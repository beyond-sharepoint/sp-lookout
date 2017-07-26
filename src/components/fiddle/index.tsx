/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { action, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as Mousetrap from 'mousetrap';
import * as URI from 'urijs';
import { autobind } from 'office-ui-fabric-react/lib';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { ObjectInspector } from 'react-inspector';
import SplitPane from '../split-pane/SplitPane';
import MonacoEditor from '../monaco-editor';
import { get, set, cloneDeep, defaultsDeep, debounce } from 'lodash';
import { FiddleSettingsModal } from '../fiddle-settings-modal';

import Barista, { BrewSettings } from '../../services/barista';
import { FiddlesStore, FiddleSettings, defaultFiddleSettings, Util } from '../../models';
import './index.css';

@observer
export default class Fiddle extends React.Component<FiddleProps, FiddleState> {
    private editorOptions;
    private commandBarItems: IContextualMenuItem[];
    private commandBarFarItems;
    private _mousetrap: MousetrapInstance;
    private _extraLibs: Array<monaco.IDisposable>;

    public constructor(props: FiddleProps) {
        super(props);

        this.commandBarItems = [
            {
                key: 'run',
                name: 'Run',
                title: 'Execute the current script.',
                icon: 'Play',
                ariaLabel: 'Execute the current script.',
                onClick: () => { this.brew(); }
            },
            {
                key: 'debug',
                name: 'Debug',
                title: 'Debug the current script. Ensure developer tools are open before running this command.',
                iconProps: {
                    className: 'fa fa-bug',
                    style: { fontSize: '1.25em', lineHeight: '0.75em', verticalAlign: '-15%', fontFamily: 'FontAwesome' }
                },
                ariaLabel: 'Debug the current script. Ensure developer tools are open before running this command.',
                onClick: () => { this.debug(); },
            },
        ];

        this.commandBarFarItems = [
            {
                icon: 'settings',
                title: 'Customize current fiddle settings.',
                ariaLabel: 'Customize current fiddle settings.',
                onClick: this.showFiddleSettings,
            }
        ];

        this.state = {
            isBrewing: false,
            fiddlePaneSize: '50%',
            showFiddleSettingsModal: false,
            showEditor: true,
            lastBrewResult: undefined,
            lastBrewResultIsError: false,
            lastProgressReport: undefined,
        };

        //Ensure that the fiddle store isn't updated more than once every second.
        this.persistFiddleStoreToLocalStorage = debounce(this.persistFiddleStoreToLocalStorage, 1000)
            .bind(this);
    }

    private async loadTypescriptDefinitions() {

        //Import typedefs to feed the grue
        //the grue is ancient, it must be done this way.
        const typeDefs = {
            'react': require('file-loader!@types/react/index.d.ts'),
            'react-dom': require('file-loader!@types/react-dom/index.d.ts'),
            'react-dom-server': require('file-loader!@types/react-dom/server/index.d.ts'),
            'lodash': require('file-loader!@types/lodash/index.d.ts'),
            'moment': require('file-loader!moment/moment.d.ts'),
            'sp-pnp-js': require('file-loader!./types/sp-pnp-js.d.html'),
        };

        this._extraLibs = [];

        for (let name of Object.keys(typeDefs)) {
            const fileResponse = await fetch(typeDefs[name]);
            const fileContents = await fileResponse.text();
            const lib = monaco.languages.typescript.typescriptDefaults.addExtraLib(
                fileContents,
                `node_modules/@types/${name}/index.d.ts`);

            this._extraLibs.push(lib);
        }

        // define sp-lookout
        const spLookoutLib = monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `declare module "sp-lookout" { export declare function reportProgress(message: string, details?: any) :void }`,
            'node_modules/@types/sp-lookout/index.d.ts');
            
        this._extraLibs.push(spLookoutLib);
    }

    @autobind
    private async editorWillMount() {

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2016,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowNonTsExtensions: true,
            checkJs: true,
            jsx: monaco.languages.typescript.JsxEmit.React
        });

        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2016,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowNonTsExtensions: true,
            checkJs: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });

        this.loadTypescriptDefinitions();
    }

    @autobind
    private editorWillDispose(editor: monaco.editor.ICodeEditor) {
        for (let lib of this._extraLibs) {
            lib.dispose();
        }
    }

    private reloadEditor() {
        this.setState({
            showEditor: false
        });

        setTimeout(
            () => {
                this.setState({
                    showEditor: true
                });
            },
            1000
        );
    }

    @autobind
    private reportProgress(progress: any): void {
        this.setState({
            lastProgressReport: progress
        });
    }

    private async brew(allowDebugger?: boolean, timeout?: number) {
        const { barista, fiddlesStore, currentFiddle, currentFiddleFullPath } = this.props;
        const { isBrewing } = this.state;

        if (isBrewing) {
            return;
        }

        if (!currentFiddle || !currentFiddle.code) {
            return;
        }

        if (typeof timeout === 'undefined') {
            timeout = 5000;
        }

        let lastBrewResult: any = undefined;
        let lastBrewResultIsError = false;

        this.setState({
            isBrewing: true,
            lastBrewResult,
            lastBrewResultIsError
        });

        try {

            const brewSettings: BrewSettings = {
                fullPath: currentFiddleFullPath,
                allowDebuggerStatement: allowDebugger,
                timeout: timeout
            };

            let result = await barista.brew(brewSettings, this.reportProgress);
            if (!result) {
                result = {
                    data: 'An empty result was returned.'
                };
            }
            console.dir(result);
            lastBrewResult = result.data || result.transferrableData;
        } catch (ex) {
            lastBrewResultIsError = true;
            lastBrewResult = {
                error: {
                    name: ex.name,
                    message: ex.message,
                    stack: ex.stack
                }
            };
        } finally {
            this.setState({
                isBrewing: false,
                lastBrewResult,
                lastBrewResultIsError
            });
            console.log('your brew is complete!');
        }
    }

    public componentDidMount() {
        const thisElement = ReactDOM.findDOMNode(this);
        this._mousetrap = new Mousetrap(
            thisElement
        );

        this._mousetrap.bind(['ctrl+return', 'ctrl+f5'], () => {
            this.brew();
        });

        this._mousetrap.bind(['ctrl+shift+return', 'f5'], () => {
            this.debug();
        });
    }

    public render() {
        const { fiddlesStore, currentFiddle } = this.props;
        const { code, theme, editorOptions } = currentFiddle;

        const { isBrewing, lastBrewResult, lastBrewResultIsError, showEditor } = this.state;

        let fiddleResultPaneStyle: any = {};
        if (lastBrewResultIsError) {
            fiddleResultPaneStyle.backgroundColor = 'rgb(255, 214, 214)';
        }

        const editorOptionsJS = toJS(editorOptions) as monaco.editor.IEditorOptions;

        //override the readOnly value with the lock status.
        editorOptionsJS.readOnly = currentFiddle.locked;

        //Determine language from file extension.
        let language = 'typescript';
        let fileExtension = currentFiddle.name
            .substring(currentFiddle.name.lastIndexOf('.'), currentFiddle.name.length)
            .toLowerCase();

        switch (fileExtension) {
            case '.json':
                language = 'json';
                break;
            default:
                language = 'typescript';
                break;
        }

        let brewingLabel = 'Brewing...';
        if (this.state.lastProgressReport && this.state.lastProgressReport.data && this.state.lastProgressReport.data.message) {
            brewingLabel = this.state.lastProgressReport.data.message;
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
                onWindowResize={() => { this.setState({ fiddlePaneSize: '50%' }); }}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                    <CommandBar
                        isSearchBoxVisible={false}
                        items={this.commandBarItems}
                        farItems={this.commandBarFarItems}
                    />
                    <div style={{ flex: '1', display: 'flex' }}>
                        {showEditor ?
                            <MonacoEditor
                                value={code}
                                theme={theme}
                                language={language}
                                filename={currentFiddle.name}
                                onChange={this.updateCode}
                                editorWillMount={this.editorWillMount}
                                editorWillDispose={this.editorWillDispose}
                                options={editorOptionsJS}
                            />
                            : null
                        }
                        <FiddleSettingsModal
                            showFiddleSettingsModal={this.state.showFiddleSettingsModal}
                            onDismiss={this.hideFiddleSettings}
                            fiddlesStore={fiddlesStore}
                            currentFiddle={currentFiddle}
                        />
                    </div>
                </div>
                <div className="fiddle-results" style={{ backgroundColor: theme.endsWith('dark') ? 'black' : null }}>
                    {isBrewing ?
                        <Spinner size={SpinnerSize.large} label={brewingLabel} ariaLive="assertive" />
                        : null}
                    {!isBrewing ?
                        <ObjectInspector data={lastBrewResult} expandLevel={2} showNonenumerable={false} theme={theme.endsWith('dark') ? 'chromeDark' : 'chromeLight'} />
                        : null}
                </div>
            </SplitPane>
        );
    }

    @action.bound
    private async debug() {
        return this.brew(true, 0);
    }

    @action.bound
    private updateCode(code: string) {
        this.props.currentFiddle.code = code;
        this.persistFiddleStoreToLocalStorage();
    }

    private persistFiddleStoreToLocalStorage() {
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private showFiddleSettings() {
        this.setState({
            showFiddleSettingsModal: true
        });
    }

    @autobind
    private hideFiddleSettings() {
        this.setState({
            showFiddleSettingsModal: false
        });
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }
}

export interface FiddleState {
    isBrewing: boolean;
    showEditor: boolean;
    showFiddleSettingsModal: boolean;
    lastBrewResult: any;
    lastBrewResultIsError: boolean;
    lastProgressReport: any;
    fiddlePaneSize: string | number;
}

export interface FiddleProps {
    fiddlesStore: FiddlesStore;
    barista: Barista;
    currentFiddle: FiddleSettings;
    currentFiddleFullPath: string;
}