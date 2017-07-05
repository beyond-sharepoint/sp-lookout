import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import * as Mousetrap from 'mousetrap';
import * as ts from 'typescript';
import * as URI from 'urijs';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { ObjectInspector } from 'react-inspector';
import { SPContext } from '../../spcontext';
import SplitPane from '../../split-pane/SplitPane';
import MonacoEditor from '../../monaco-editor';

import { FiddleState } from '../../AppStore';
import './index.css';

@observer
export default class Fiddle extends React.Component<FiddleProps, any> {
    private editorOptions;
    private commandBarItems;
    private commandBarFarItems;
    private keyMap;
    private _mousetrap: MousetrapInstance;

    public constructor(props) {
        super(props);

        this.state = {
            fiddlePaneSize: '50%'
        }

        this.editorOptions = {
            automaticLayout: true,
            scrollBeyondLastLine: false,
            jsx: 'react'
        };

        this.keyMap = {
            'brew': 'command+enter',
            'deleteNode': ['del', 'backspace']
        };

        this.commandBarItems = [
            {
                key: 'run',
                name: 'Run',
                icon: 'Play',
                ariaLabel: 'Execute current Script',
                onClick: () => { this.brew(this.props.fiddleState.code) },
            }
        ]

        this.commandBarFarItems = [];
    }

    private editorWillMount(monaco) {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2016,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowNonTsExtensions: true,
            checkJs: true,
            jsx: monaco.languages.typescript.JsxEmit.React
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2016,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowNonTsExtensions: true,
            checkJs: true,
            jsx: monaco.languages.typescript.JsxEmit.React
        })

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        })
    }

    public componentDidMount() {
        this._mousetrap = new Mousetrap(
            ReactDOM.findDOMNode(this)
        );
        this._mousetrap.bind(['ctrl+return'], () => {
            this.brew(this.props.fiddleState.code);
        });
    }

    private async uploadModule(context: SPContext, code: string): Promise<Response> {
        const { webFullUrl, fiddleScriptsPath } = this.props;
        const spContext = await SPContext.getContext(webFullUrl);

        const webUri = URI(webFullUrl).path(fiddleScriptsPath);
        const url = `/_api/web/getfolderbyserverrelativeurl('${URI.encode(webUri.path())}')/files/add(overwrite=true,url='splookout-fiddle.js')`;

        return spContext.fetch(url, {
            method: "POST",
            body: code
        });
    }

    @action.bound
    private updateCode(code) {
        this.props.fiddleState.code = code;
    }

    private async brew(code: string, brewMode?: 'require' | 'sandfiddle') {
        const { webFullUrl, fiddleState } = this.props;
        const { isBrewing } = this.state;

        if (isBrewing) {
            return;
        }

        const jsCode = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2015,
                module: ts.ModuleKind.AMD,
                jsx: ts.JsxEmit.React,
                importHelpers: true,
            },
            fileName: 'splookout-fiddle.tsx'
        });

        let lastBrewResult: any = undefined;
        let lastBrewResultIsError = false;

        this.setState({
            isBrewing: true,
            lastBrewResult,
            lastBrewResultIsError
        });

        try {
            const spContext = await SPContext.getContext(webFullUrl);
            let fiddleName = `splookout-fiddle-${(new Date()).getTime()}`;
            let requireConfig = {
                baseUrl: fiddleState.baseUrl || undefined,
                paths: fiddleState.importPaths || FiddleState.defaultImportPaths
            };

            const fiddleDefine = jsCode.outputText.replace("define([", `define('${fiddleName}',[`);
            let result: any;

            switch (brewMode) {
                case 'require':
                    await spContext.requireConfig(requireConfig);
                    await spContext.injectScript({ id: fiddleName, type: 'text/javascript', text: fiddleDefine });
                    result = await spContext.require(fiddleName, undefined);
                    break;
                default:
                case 'sandfiddle':
                    result = await spContext.sandFiddle({
                        requireConfig: requireConfig,
                        defines: [fiddleDefine],
                        entryPointId: fiddleName
                    });
                    break;
            }

            console.dir(result);
            lastBrewResult = result.data || result.transferrableData;
        } catch (ex) {
            console.dir(ex);
            lastBrewResultIsError = true;
            lastBrewResult = {
                name: ex.name,
                message: ex.message,
                stack: ex.stack
            };
        } finally {
            this.setState({
                isBrewing: false,
                lastBrewResult,
                lastBrewResultIsError
            });
            console.log("your brew is complete!");
        }
    }

    public render() {
        const { fiddleState } = this.props;
        const { isBrewing, lastBrewResult, lastBrewResultIsError } = this.state;
        let fiddleResultPaneStyle: any = {};
        if (lastBrewResultIsError) {
            fiddleResultPaneStyle.backgroundColor = "rgb(255, 214, 214)";
        }

        return (
            <SplitPane
                split="vertical"
                className="left-sidebar"
                primaryPaneSize={this.state.fiddlePaneSize}
                primaryPaneMinSize={0}
                secondaryPaneStyle={{ overflow: 'auto' }}
                onPaneResized={(size) => { this.setState({ fiddlePaneSize: size }); }}
                onResizerDoubleClick={() => { this.setState({ fiddlePaneSize: '50%' }); }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: "100%" }}>
                    <CommandBar
                        isSearchBoxVisible={false}
                        items={this.commandBarItems}
                        farItems={this.commandBarFarItems}
                    />
                    <div style={{ flex: '1' }}>
                        <MonacoEditor
                            value={fiddleState.code}
                            language={fiddleState.language}
                            theme={fiddleState.theme}
                            filename={fiddleState.filename}
                            onChange={this.updateCode}
                            editorWillMount={this.editorWillMount}
                            options={this.editorOptions}
                        >
                        </MonacoEditor>
                    </div>
                </div>
                <div className="fiddle-results">
                    {isBrewing ?
                        <Spinner size={SpinnerSize.large} label='Brewing...' ariaLive='assertive' />
                        : null}
                    {!isBrewing ?
                        <ObjectInspector data={lastBrewResult} expandLevel={3} />
                        : null}
                </div>
            </SplitPane>
        )
    }
}

/// <reference path="monaco-editor" />
export interface FiddleProps {
    webFullUrl: string;
    fiddleScriptsPath: string;
    fiddleState: FiddleState;
}