import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Mousetrap from 'mousetrap';
import * as ts from 'typescript';
import * as URI from 'urijs';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
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

        const jsCode = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.AMD,
                checkJs: true
            },
            fileName: 'splookout-fiddle.js'
        });

        this.setState({
            isBrewing: true
        });

        try {
            const spContext = await SPContext.getContext(webFullUrl);
            await spContext.importScript("https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.3/require.min.js");
            await this.uploadModule(spContext, jsCode.outputText);
            const result = await spContext.eval("require.undef('splookout-fiddle'); require.config({ urlArgs: 'v=' + (new Date()).getTime()}); new Promise((resolve, reject) => { require(['splookout-fiddle'], result => resolve(result), err => reject(err)); });");
            console.dir(result);
        } catch (ex) {
            console.dir(ex);
        } finally {
            this.setState({
                isBrewing: false
            });
            console.log("your brew is complete!");
        }
    }

    public render() {
        const { isBrewing }  = this.state;

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
                    { isBrewing ?
                        <Spinner size={ SpinnerSize.large } label='Brewing...' ariaLive='assertive' /> 
                        : null }
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