/// <reference path="../../node_modules/@types/requirejs/index.d.ts" />
import * as ts from 'typescript';

import { DebuggerTransformer } from './debuggerTransformer';
import { SPContext, SPContextConfig } from '../spcontext';

export default class Barista {
    private _config: BaristaConfig;

    constructor(config: BaristaConfig) {
        if (!config) {
            throw Error("Barista configuration must be specified.");
        }
        this._config = config;
    }

    public get config(): BaristaConfig {
        return this._config;
    }

    public async uploadModule(context: SPContext, code: string): Promise<Response> {
        const { webFullUrl, fiddleScriptsPath } = this._config;
        const spContext = await SPContext.getContext(webFullUrl);

        const webUri = URI(webFullUrl).path(fiddleScriptsPath || '/Shared Documents');
        const url = `/_api/web/getfolderbyserverrelativeurl('${URI.encode(webUri.path())}')/files/add(overwrite=true,url='splookout-fiddle.js')`;

        return spContext.fetch(url, {
            method: "POST",
            body: code
        });
    }

    /**
     * Brews the specified typescript code.
     */
    public async brew(settings: BrewSettings): Promise<any> {
        const { filename, input, brewMode, allowDebuggerStatement, requireConfig, timeout } = settings;
        const spContext = await SPContext.getContext(this._config.webFullUrl, this._config.spContextConfig);

        const transpileResult = this.transpile(filename, input, allowDebuggerStatement || false);

        //TODO: determine any dependent modules that have a spl prefix and get them.

        const defines = [transpileResult.outputText];

        //Ensure a unique define. Mostly for 'require' mode.
        //TODO: This probably needs to be done for all defines, not just our entry point.
        //However, that will mess things up for all requires. So we might need to do
        //this at a step before.
        let brewName = `${filename}-${(new Date()).getTime()}`;
        for (let ix in defines) {
            let define = defines[ix];
            if (define.startsWith(`define('${filename}',[`)) {
                defines[ix] = define.replace(`define('${filename}',[`, `define('${brewName}',[`);
            }
        }

        let result: any;
        switch (brewMode) {
            case 'require':
                if (requireConfig) {
                    await spContext.requireConfig(requireConfig);
                }

                for (let define in defines) {
                    await spContext.injectScript({ id: brewName, type: 'text/javascript', text: define });
                }

                result = await spContext.require(brewName, undefined);
                break;
            default:
            case 'sandfiddle':
                result = await spContext.sandFiddle({
                    requireConfig: requireConfig,
                    defines: defines,
                    entryPointId: brewName,
                    timeout
                }, timeout);
                break;
        }

        return result;
    }

    private transpile(filename: string, input: string, allowDebuggerStatement: boolean): ts.TranspileOutput {

        let beforeTransformers: any = [];
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

        output.outputText = output.outputText.replace("define([", `define('${filename}',[`);
        return output;
    }
}

export interface BaristaConfig {
    webFullUrl: string;
    spContextConfig?: SPContextConfig;
    fiddleScriptsPath?: string;
    noProxyHandler?: (barista: Barista) => any;
}

export interface BrewSettings {
    filename: string;
    input: string;
    brewMode?: 'require' | 'sandfiddle';
    moduleLocator?: (moduleId: string) => string;
    allowDebuggerStatement?: boolean;
    timeout?: number;
    requireConfig?: RequireConfig
}