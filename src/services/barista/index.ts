/// <reference path='../../../node_modules/@types/requirejs/index.d.ts' />
import * as ts from 'typescript';
import * as URI from 'urijs';
import { cloneDeep, defaultsDeep } from 'lodash';

import { DebuggerTransformer } from './debuggerTransformer';
import { relativeImportsLocator } from './relativeImportsLocator';
import { nonRelativeImportsLocator } from './nonRelativeImportsLocator';
import { SPContext, SPContextConfig, SPProxy, SPContextError, defaultSPContextConfig } from '../spcontext';
import { FiddlesStore, FiddleSettings } from '../../models';

export default class Barista {
    private scriptMap: { [path: string]: string } = {};

    private _config: BaristaConfig;
    private _fiddlesStore: FiddlesStore;
    private _spContextConfig: SPContextConfig;

    constructor(config: BaristaConfig, fiddlesStore: FiddlesStore, spContextConfig?: SPContextConfig) {
        if (!config) {
            throw Error('Barista configuration must be specified.');
        }

        if (!fiddlesStore) {
            throw Error('FiddleStore must be specified.');
        }

        this._config = config;
        this._fiddlesStore = fiddlesStore;

        if (!spContextConfig) {
            this._spContextConfig = cloneDeep(defaultSPContextConfig);
        } else {
            this._spContextConfig = defaultsDeep(spContextConfig, defaultSPContextConfig);
        }
    }

    public get config(): BaristaConfig {
        return this._config;
    }

    public get fiddlesStore(): FiddlesStore {
        return this._fiddlesStore;
    }

    public get spContextConfig(): SPContextConfig {
        return this._spContextConfig;
    }

    public getImports(fullPath: string, fiddleSettings: FiddleSettings, imports?: { [path: string]: FiddleSettings }): { [path: string]: FiddleSettings } {

        if (!imports) {
            imports = {};
        }

        const preProcessResult = ts.preProcessFile(fiddleSettings.code, true, true);

        for (const importedFile of preProcessResult.importedFiles) {
            let dependencyAbsolutePath = decodeURI(URI(importedFile.fileName).absoluteTo(fullPath).pathname());
            let dependentFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(dependencyAbsolutePath);

            if (!dependentFiddleSettings) {
                dependencyAbsolutePath = decodeURI(URI(importedFile.fileName + '.ts').absoluteTo(fullPath).pathname());
                dependentFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(dependencyAbsolutePath);
            }

            if (dependentFiddleSettings) {
                if (!imports[dependencyAbsolutePath]) {
                    imports[dependencyAbsolutePath] = dependentFiddleSettings;
                    this.getImports(dependencyAbsolutePath, dependentFiddleSettings, imports);
                }
            }
        }

        return imports;
    }

    private async getScript(scriptPath: string): Promise<string> {
        if (this.scriptMap[scriptPath]) {
            return this.scriptMap[scriptPath];
        }

        const fileResponse = await fetch(scriptPath);
        return this.scriptMap[scriptPath] = await fileResponse.text();
    }

    /**
     * Transpiles the specified typescript code and returns a map of define statements.
     */
    private async tamp(fullPath: string, targetFiddleSettings: FiddleSettings, allowDebuggerStatement: boolean, defines?: { [path: string]: string }): Promise<{ [path: string]: string }> {

        if (!defines) {
            defines = {};
        } else if (defines[fullPath]) {
            return defines;
        }

        //Tamp, Transpile the main module.
        const transpileResult = this.transpile(fullPath, targetFiddleSettings.code, allowDebuggerStatement);
        defines[fullPath] = transpileResult.outputText;

        //Transpile dependencies
        const relativeImports: Array<string> = (<any>transpileResult).relativeImports;
        for (const relativePath of relativeImports) {
            let dependencyAbsolutePath = decodeURI(URI(relativePath).absoluteTo(fullPath).pathname());
            let dependentFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(dependencyAbsolutePath);

            //Check for .ts files too.
            if (!dependentFiddleSettings) {
                dependencyAbsolutePath = decodeURI(URI(relativePath + '.ts').absoluteTo(fullPath).pathname());
                dependentFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(dependencyAbsolutePath);
            }

            if (dependentFiddleSettings) {
                await this.tamp(dependencyAbsolutePath, dependentFiddleSettings, allowDebuggerStatement, defines);
            }
        }

        //Always include tslib
        (<any>transpileResult).nonRelativeImports.unshift('tslib');

        //Redirect a set of modules to import from local resources.
        const localImports = {
            'tslib': {
                path: './libs/tslib.js',
                transpile: false
            },
            'sp-lookout': {
                path: './libs/BaristaUtils.tsc',
                transpile: true
            }
        };

        for (let moduleName of (<any>transpileResult).nonRelativeImports) {
            if (Object.keys(localImports).indexOf(moduleName) < 0 || defines[moduleName]) {
                continue;
            }
            const moduleInfo = localImports[moduleName];
            const fileResponse = await fetch(moduleInfo.path);
            const fileContents = await fileResponse.text();
            if (moduleInfo.transpile) {
                defines[moduleName] = this.transpile(moduleName, fileContents, true).outputText;
            } else {
                defines[moduleName] = fileContents;
            }
        }

        for (const definePath of Object.keys(defines)) {
            let path = definePath.replace(/\.tsx?$/, '');
            path = path.replace(/\'/g, '\\\'');
            defines[definePath] = defines[definePath].replace(/^define\(\[/, `define('${path}',[`);
        }

        return defines;
    }

    /**
     * Brews the specified typescript code.
     */
    public async brew(settings: BrewSettings, onProgress?: (progress: any) => void): Promise<any> {
        const { fullPath, allowDebuggerStatement, timeout } = settings;
        const spContext = await SPContext.getContext(this._config.webFullUrl, this._spContextConfig);

        //Ensure that barista custom commands are added to the proxy.
        if (!(spContext as any).isBaristaContext) {
            const localforage = await this.getScript('./libs/localforage.min.js');
            await spContext.eval(localforage);

            await spContext.setWorkerCommand('getItem', await this.getScript('./libs/workerGetItem.js'));
            await spContext.setWorkerCommand('setItem', await this.getScript('./libs/workerSetItem.js'));
            await spContext.setWorkerCommand('removeItem', await this.getScript('./libs/workerRemoveItem.js'));

            (spContext as any).isBaristaContext = true;
        }

        //Take Order, get the fiddle settings from the store
        const targetFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(fullPath);

        if (!targetFiddleSettings) {
            throw Error(`A module with the specified path was not found in the associated store: '${fullPath}'`);
        }

        const bootstrap: Array<string> = [];
        bootstrap.push(await this.getScript('./libs/require.min.js'));
        bootstrap.push(await this.getScript('./libs/requireInit.js'));

        //Tamp, Transpile the main module and resulting dependencies.
        const defines = await this.tamp(fullPath, targetFiddleSettings, allowDebuggerStatement || false);
        for (const moduleName of Object.keys(defines)) {
            bootstrap.push(defines[moduleName]);
        }

        //Brew
        try {
            return await spContext.brew(
                {
                    bootstrap,
                    entryPointId: fullPath.replace(/\.tsx?$/, ''),
                    timeout,
                    requireConfig: targetFiddleSettings.requireConfig
                },
                timeout,
                undefined,
                onProgress
            );
        } catch (ex) {
            if (ex instanceof SPContextError) {
                const { noProxyHandler, invalidOriginHandler, authenticationRequiredHandler } = this._config;
                switch (ex.$$spcontext) {
                    case 'authrequired':
                        if (authenticationRequiredHandler) {
                            return authenticationRequiredHandler(ex.message, this);
                        }
                        break;
                    case 'invalidorigin':
                        if (invalidOriginHandler) {
                            return invalidOriginHandler(ex.message, this);
                        }
                        break;
                    case 'noproxy':
                        if (noProxyHandler) {
                            return noProxyHandler(ex.message, this);
                        }
                        break;
                    default:
                        throw ex;
                }
            }
            throw ex;
        }
    }

    public dispose() {
        SPContext.removeContext(this._config.webFullUrl);
        SPProxy.removeProxy(this._config.webFullUrl);
    }

    public async uploadModule(context: SPContext, code: string): Promise<Response> {
        const { webFullUrl, fiddleScriptsPath } = this._config;
        const spContext = await SPContext.getContext(webFullUrl, this._spContextConfig);

        const webUri = URI(webFullUrl).path(fiddleScriptsPath || '/Shared Documents');
        const url = `/_api/web/getfolderbyserverrelativeurl('${URI.encode(webUri.path())}')/files/add(overwrite=true,url='splookout-fiddle.js')`;

        return spContext.fetch(url, {
            method: 'POST',
            body: code
        });
    }

    private transpile(filename: string, input: string, allowDebuggerStatement: boolean): ts.TranspileOutput {
        let beforeTransformers: any = [];
        beforeTransformers.push(relativeImportsLocator);
        beforeTransformers.push(nonRelativeImportsLocator);
        if (!allowDebuggerStatement) {
            beforeTransformers.push(DebuggerTransformer);
        }

        const output = ts.transpileModule(input, {
            transformers: {
                before: beforeTransformers
            },
            compilerOptions: {
                target: ts.ScriptTarget.ES2015,
                module: ts.ModuleKind.AMD,
                jsx: ts.JsxEmit.React,
                importHelpers: true
            },
            fileName: filename
        });

        (<any>output).nonRelativeImports = (<any>nonRelativeImportsLocator).nonRelativeImports;
        (<any>output).relativeImports = (<any>relativeImportsLocator).relativeImports;
        return output;
    }
}

export interface BaristaConfig {
    webFullUrl: string;
    fiddleScriptsPath?: string;
    noProxyHandler?: (errorMessage: string, barista: Barista) => any;
    invalidOriginHandler?: (errorMessage: string, barista: Barista) => any;
    authenticationRequiredHandler?: (errorMessage: string, barista: Barista) => any;
}

export interface BrewSettings {
    fullPath: string;
    allowDebuggerStatement?: boolean;
    timeout?: number;
}