/// <reference path='../../../node_modules/@types/requirejs/index.d.ts' />
import * as ts from 'typescript';
import * as URI from 'urijs';
import { cloneDeep, defaultsDeep } from 'lodash';

import { DebuggerTransformer } from './debuggerTransformer';
import { RelativeImportsLocator } from './relativeImportsLocator';
import { SPContext, SPContextConfig, SPProxy, SPContextError, defaultSPContextConfig } from '../spcontext';
import { FiddlesStore, FiddleSettings } from '../../models';

export default class Barista {
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

    public getImports(fullPath: string, targetFiddleSettings: FiddleSettings): { [fileName: string]: FiddleSettings } {
        const result = ts.preProcessFile(targetFiddleSettings.code, true, true);

        const importFiles = {};
        for (const importedFile of result.importedFiles) {
            let dependencyAbsolutePath = decodeURI(URI(importedFile.fileName).absoluteTo(fullPath).pathname());
            let dependentFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(dependencyAbsolutePath);

            if (!dependentFiddleSettings) {
                dependencyAbsolutePath = decodeURI(URI(importedFile.fileName + '.ts').absoluteTo(fullPath).pathname());
                dependentFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(dependencyAbsolutePath);
            }

            if (dependentFiddleSettings) {
                importFiles[dependencyAbsolutePath] = dependentFiddleSettings;
            }
        }

        return importFiles;
    }

    /**
     * Transpiles the specified typescript code and returns a map of define statements.
     */
    private tamp(fullPath: string, targetFiddleSettings: FiddleSettings, allowDebuggerStatement: boolean, defines?: { [path: string]: string }): { [path: string]: string } {

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
                this.tamp(dependencyAbsolutePath, dependentFiddleSettings, allowDebuggerStatement, defines);
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

        //Take Order, get the fiddle settings from the store
        const targetFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(fullPath);

        if (!targetFiddleSettings) {
            throw Error(`A module with the specified path was not found in the associated store: '${fullPath}'`);
        }

        //Tamp, Transpile the main module and resulting dependencies.
        const defines = this.tamp(fullPath, targetFiddleSettings, allowDebuggerStatement || false);

        //Brew
        try {
            return await spContext.brew(
                {
                    requireConfig: targetFiddleSettings.requireConfig,
                    defines: defines,
                    entryPointId: fullPath.replace(/\.tsx?$/, ''),
                    timeout
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
        beforeTransformers.push(RelativeImportsLocator);
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
                importHelpers: true,
            },
            fileName: filename
        });

        (<any>output).relativeImports = (<any>RelativeImportsLocator).relativeImports;
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