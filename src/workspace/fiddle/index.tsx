import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Mousetrap from 'mousetrap';
import * as ts from 'typescript';
import * as URI from 'urijs';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { ObjectInspector } from 'react-inspector';
import { SPContext } from '../../spcontext';
import SplitPane from '../../split-pane/SplitPane';
import MonacoEditor from '../../monaco-editor';

import './index.css';

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
                onClick: () => { this.brew(this.props.code) },
            }
        ]

        this.commandBarFarItems = [];
    }

    private editorWillMount(monaco) {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES5,
            module: ts.ModuleKind.AMD,
            allowNonTsExtensions: true,
            checkJs: true
        });

        //monaco.languages.typescript.javaScriptDefaults.
    }

    public componentDidMount() {
        this._mousetrap = new Mousetrap(
            ReactDOM.findDOMNode(this)
        );
        this._mousetrap.bind(['ctrl+return'], () => {
            this.brew(this.props.code);
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

    private async brew(code: string) {
        const { webFullUrl } = this.props;
        const { isBrewing } = this.state;

        if (isBrewing) {
            return;
        }

        const jsCode = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2015,
                module: ts.ModuleKind.AMD,
                //importHelpers: true,
            },
            fileName: 'splookout-fiddle.js'
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
            //await spContext.injectScript({ text: jsCode.outputText.replace("define([", `define('splookout-fiddle',[`) });
            await this.uploadModule(spContext, jsCode.outputText);
            const result = await spContext.require('splookout-fiddle');
            console.dir(result);
            lastBrewResult = result.requireResult;
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
                            value={this.props.code}
                            onChange={this.props.onCodeChange}
                            editorWillMount={this.editorWillMount}
                            options={this.editorOptions}
                        ></MonacoEditor>
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
    code: string;
    onCodeChange: (val: string, ev: any) => void;
}