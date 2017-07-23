/// <reference path='../../../node_modules/@types/requirejs/index.d.ts' />
import * as ts from 'typescript';
import * as URI from 'urijs';
import { cloneDeep, defaultsDeep } from 'lodash';

import { DebuggerTransformer } from './debuggerTransformer';
import { RelativeImportsLocator } from './relativeImportsLocator';
import { SPContext, SPContextConfig, SPProxy, SPContextError, defaultSPContextConfig } from '../spcontext';

export default class Barista {
    private _config: BaristaConfig;
    private _spContextConfig: SPContextConfig;

    constructor(config: BaristaConfig, spContextConfig?: SPContextConfig) {
        if (!config) {
            throw Error('Barista configuration must be specified.');
        }
        this._config = config;
        if (!spContextConfig) {
            this._spContextConfig = cloneDeep(defaultSPContextConfig);
        } else {
            this._spContextConfig = defaultsDeep(spContextConfig, defaultSPContextConfig);
        }
    }

    public get config(): BaristaConfig {
        return this._config;
    }

    public get spContextConfig(): SPContextConfig {
        return this._spContextConfig;
    }

    /**
     * Brews the specified typescript code.
     */
    public async brew(settings: BrewSettings): Promise<any> {
        const { filename, input, brewMode, allowDebuggerStatement, requireConfig, timeout } = settings;
        const spContext = await SPContext.getContext(this._config.webFullUrl, this._spContextConfig);

        //Transpile the main module.
        const transpileResult = this.transpile(filename, input, allowDebuggerStatement || false);

        //TODO: determine any dependent modules that have a spl prefix and get them.

        const defines: { [id: string]: string } = {
            filename: transpileResult.outputText
        };

        const relativeImports: Array<string> = (<any>transpileResult).relativeImports;
        console.log(relativeImports);

        //Ensure a unique define. Mostly for 'require' mode.
        //TODO: This probably needs to be done for all defines, not just our entry point.
        //However, that will mess things up for all requires. So we might need to do
        //this at a step before.
        let brewName = `${filename}-${(new Date()).getTime()}`;
        for (let id of Object.keys(defines)) {
            const define = defines[id];
            if (define.startsWith(`define('${filename}',[`)) {
                defines[id] = define.replace(`define('${filename}',[`, `define('${brewName}',[`);
            }
        }

        let result: any;
        try {
            switch (brewMode) {
                case 'require':
                    if (requireConfig) {
                        await spContext.requireConfig(requireConfig);
                    }

                    for (let id of Object.keys(defines)) {
                        const define = defines[id];
                        await spContext.injectScript({ id: define, type: 'text/javascript', text: define });
                    }

                    result = await spContext.require(brewName, timeout);
                    break;
                default:
                case 'sandfiddle':
                    result = await spContext.sandFiddle(
                        {
                            requireConfig: requireConfig,
                            defines: defines,
                            entryPointId: brewName,
                            timeout
                        },
                        timeout
                    );
                    break;
            }
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

        return result;
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
        output.outputText = output.outputText.replace('define([', `define('${filename}',[`);
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
    filename: string;
    input: string;
    brewMode?: 'require' | 'sandfiddle';
    moduleLocator?: (moduleId: string) => string;
    allowDebuggerStatement?: boolean;
    timeout?: number;
    requireConfig?: RequireConfig;
}