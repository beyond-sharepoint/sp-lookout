/// <reference path='../../../node_modules/@types/requirejs/index.d.ts' />
import * as ts from 'typescript';
import * as URI from 'urijs';
import { toJS } from 'mobx';
import { cloneDeep, defaultsDeep } from 'lodash';

import { DebuggerTransformer } from './debuggerTransformer';
import { relativeImportsLocator } from './relativeImportsLocator';
import { nonRelativeImportsLocator } from './nonRelativeImportsLocator';
import { SPContext, SPContextConfig, SPProxy, SPContextError, defaultSPContextConfig } from '../spcontext';
import { FiddlesStore, FiddleSettings } from '../../models';

const tslib = require('raw-loader!tslib/tslib.js');
const localforage = require('raw-loader!localforage/dist/localforage.min.js');
const requirejs = require('raw-loader!requirejs/require.js');
const workerInit = require('./libs/workerInit.tsc');
const workerGetItem = require('./libs/workerGetItem.tsc');
const workerSetItem = require('./libs/workerSetItem.tsc');
const workerRemoveItem = require('./libs/workerRemoveItem.tsc');
const baristaUtils = require('./libs/BaristaUtils.tsc');

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

    private getTranspiledLib(code: string, fileName: string): string {
        if (this.scriptMap[fileName]) {
            return this.scriptMap[fileName];
        }

        const transpiled = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.None
            },
            fileName: fileName
        });

        return this.scriptMap[fileName] = transpiled.outputText;
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
                code: tslib,
                transpile: false
            },
            'sp-lookout': {
                code: baristaUtils,
                transpile: true
            }
        };

        for (let moduleName of (<any>transpileResult).nonRelativeImports) {
            if (Object.keys(localImports).indexOf(moduleName) < 0 || defines[moduleName]) {
                continue;
            }
            const moduleInfo = localImports[moduleName];
            const fileContents = await moduleInfo.code;
            if (moduleInfo.transpile === true) {
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
        const { fullPath, allowDebuggerStatement, timeout, scriptProps } = settings;
        const spContext = await SPContext.getContext(this._config.webFullUrl, this._spContextConfig);

        //Ensure that barista custom commands are added to the proxy.
        if (!(spContext as any).isBaristaContext) {
            await spContext.eval(localforage);

            await spContext.setWorkerCommand('getItem', this.getTranspiledLib(workerGetItem, 'workerGetItem.ts'));
            await spContext.setWorkerCommand('setItem', this.getTranspiledLib(workerSetItem, 'workerSetItem.ts'));
            await spContext.setWorkerCommand('removeItem', this.getTranspiledLib(workerRemoveItem, 'workerRemoveItem.ts'));

            (spContext as any).isBaristaContext = true;
        }

        //Take Order, get the fiddle settings from the store
        const targetFiddleSettings = this._fiddlesStore.getFiddleSettingsByPath(fullPath);

        if (!targetFiddleSettings) {
            throw Error(`A module with the specified path was not found in the associated store: '${fullPath}'`);
        }

        const bootstrap: Array<string> = [];
        bootstrap.push(requirejs);
        bootstrap.push(this.getTranspiledLib(workerInit, 'workerInit.ts'));

        //Tamp, Transpile the main module and resulting dependencies.
        const defines = await this.tamp(fullPath, targetFiddleSettings, allowDebuggerStatement || false);
        for (const moduleName of Object.keys(defines)) {
            bootstrap.push(defines[moduleName]);
        }

        const mergedScriptProps = defaultsDeep(scriptProps, toJS(targetFiddleSettings.defaultScriptProps));

        //Brew
        try {
            return await spContext.brew(
                {
                    bootstrap,
                    entryPointId: fullPath.replace(/\.tsx?$/, ''),
                    timeout,
                    scriptProps: mergedScriptProps,
                    requireConfig: toJS(targetFiddleSettings.requireConfig)
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

    private transpile(filename: string, input: string, allowDebuggerStatement: boolean, module?: ts.ModuleKind): ts.TranspileOutput {
        let beforeTransformers: any = [];
        beforeTransformers.push(relativeImportsLocator);
        beforeTransformers.push(nonRelativeImportsLocator);
        if (!allowDebuggerStatement) {
            beforeTransformers.push(DebuggerTransformer);
        }

        if (typeof module === 'undefined') {
            module = ts.ModuleKind.AMD;
        }

        const output = ts.transpileModule(input, {
            transformers: {
                before: beforeTransformers
            },
            compilerOptions: {
                target: ts.ScriptTarget.ES5,
                module: module,
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
    scriptProps?: any;
}