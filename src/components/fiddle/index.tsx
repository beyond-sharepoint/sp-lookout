/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { action, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as Mousetrap from 'mousetrap';
import * as URI from 'urijs';
import * as FileSaver from 'file-saver';
import { autobind } from 'office-ui-fabric-react/lib';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { ObjectInspector } from 'react-inspector';
import SplitPane from '../split-pane/SplitPane';
import MonacoEditor from '../monaco-editor';
import { get, set, cloneDeep, defaultsDeep, debounce, throttle } from 'lodash';
import { FiddleSettingsModal } from '../fiddle-settings-modal';

import Barista, { BrewSettings } from '../../services/barista';
import { ScriptsStore, ScriptFile, Util } from '../../models';

@observer
export default class Fiddle extends React.Component<FiddleProps, FiddleState> {
    private editor: monaco.editor.ICodeEditor | undefined;
    private editorOptions;
    private commandBarItems: Array<IContextualMenuItem>;
    private commandBarFarItems: Array<IContextualMenuItem>;
    private _mousetrap: MousetrapInstance;
    private _extraLibs: { [libName: string]: monaco.IDisposable };

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
                key: 'settings',
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
        this.persistFiddleStoreToLocalStorage = debounce(this.persistFiddleStoreToLocalStorage, 1000).bind(this);
        this.ensureImportedLibs = throttle(this.ensureImportedLibs, 1000).bind(this);
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
            'async': require('file-loader!@types/async/index.d.ts'),
            'bluebird': require('file-loader!@types/bluebird/index.d.ts'),
            'jszip': require('file-loader!@types/jszip/index.d.ts'),
            'urijs': require('file-loader!@types/urijs/index.d.ts'),
            'xlsx': require('file-loader!xlsx/types/index.d.ts'),
            'sp-pnp-js': './libs/sp-pnp-js.d.tsc',
            'sp-lookout': './libs/sp-lookout.d.tsc'
        };

        this._extraLibs = {};

        for (let name of Object.keys(typeDefs)) {
            const fileResponse = await fetch(typeDefs[name]);
            const fileContents = await fileResponse.text();
            const libName = `node_modules/@types/${name}/index.d.ts`;
            const lib = monaco.languages.typescript.typescriptDefaults.addExtraLib(
                fileContents,
                libName
            );

            this._extraLibs[libName] = lib;
        }

        //We can get the current typescript worker using the following... 
        //  const worker = await monaco.languages.typescript.getTypeScriptWorker();
        //  const client = await worker(this.props.currentFiddleFullPath);
        //  const result = await client.getEmitOutput(this.props.currentFiddleFullPath);
        //this._extraLibs['node_modules/@types/sp-lookout/index.d.ts'] = spLookoutLib;

        this.ensureImportedLibs(this.props);
    }

    @autobind
    private editorWillMount() {

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
    private editorDidMount(editor: monaco.editor.ICodeEditor) {
        this.editor = editor;
        this.ensureEditorFocus(this.props);
    }

    @autobind
    private editorWillDispose(editor: monaco.editor.ICodeEditor) {
        for (let libName of Object.keys(this._extraLibs)) {
            const lib = this._extraLibs[libName];
            lib.dispose();
        }

        this.editor = undefined;
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
            timeout = typeof currentFiddle.brewTimeout === 'number' ? currentFiddle.brewTimeout : 5000;
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
            lastBrewResult = result.data || result.transferrableData;

            if (lastBrewResult) {
                if (this.props.currentFiddle.autoSaveArrayBufferResults === true) {
                    for (let key of Object.keys(lastBrewResult)) {
                        if (lastBrewResult[key] instanceof ArrayBuffer) {
                            FileSaver.saveAs(new Blob([lastBrewResult[key]]), key);
                        }
                    }
                }
            }
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
                lastBrewResultIsError,
                lastProgressReport: null
            });
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

    public componentWillReceiveProps(nextProps: FiddleProps) {
        if (this.props.currentFiddleFullPath !== nextProps.currentFiddleFullPath) {
            this.ensureImportedLibs(nextProps);
            this.ensureEditorFocus(nextProps);
        }
    }

    public render() {
        const { fiddlesStore, currentFiddle, currentFiddleFullPath } = this.props;
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
                <div style={{ flex: '1 0 0%', display: 'flex', flexDirection: 'column', maxHeight: '100%', maxWidth: '100%' }}>
                    <CommandBar
                        isSearchBoxVisible={false}
                        items={this.commandBarItems}
                        farItems={this.commandBarFarItems}
                    />
                    <div style={{ flex: '1 0 0%', display: 'flex' }}>
                        {showEditor &&
                            <MonacoEditor
                                value={code}
                                theme={theme}
                                language={language}
                                filename={currentFiddleFullPath}
                                onChange={this.updateCode}
                                onCursorPositionChange={this.onCursorPositionChange}
                                editorWillMount={this.editorWillMount}
                                editorDidMount={this.editorDidMount}
                                editorWillDispose={this.editorWillDispose}
                                options={editorOptionsJS}
                            />
                        }
                        <FiddleSettingsModal
                            showFiddleSettingsModal={this.state.showFiddleSettingsModal}
                            onDismiss={this.hideFiddleSettings}
                            fiddlesStore={fiddlesStore}
                            currentFiddle={currentFiddle}
                            currentFiddleFullPath={currentFiddleFullPath}
                        />
                    </div>
                </div>
                <div style={{ flex: '1 0 0%', padding: '5px', backgroundColor: theme.endsWith('dark') ? 'black' : null }}>
                    {isBrewing &&
                        <div style={{ margin: '30px' }}>
                            <Spinner
                                size={SpinnerSize.large}
                                label={brewingLabel}
                                ariaLive="assertive"
                            />
                        </div>
                    }
                    {!isBrewing &&
                        <ObjectInspector
                            data={lastBrewResult}
                            expandLevel={2}
                            showNonenumerable={false}
                            theme={theme.endsWith('dark') ? 'chromeDark' : 'chromeLight'}
                        />
                    }
                </div>
            </SplitPane>
        );
    }

    @action.bound
    private async debug() {
        return this.brew(true, 0);
    }

    private ensureImportedLibs(props: FiddleProps) {
        if (!props.barista) {
            return;
        }

        const imports = props.barista.getImports(props.currentFiddleFullPath, props.currentFiddle);

        for (const importPath of Object.keys(imports)) {
            if (this._extraLibs[importPath]) {
                this._extraLibs[importPath].dispose();
                delete this._extraLibs[importPath];
            }

            const lib = monaco.languages.typescript.typescriptDefaults.addExtraLib(
                toJS(imports[importPath].code),
                importPath
            );

            this._extraLibs[importPath] = lib;
        }
    }

    private ensureEditorFocus(props: FiddleProps) {
        setTimeout(
            () => {
                if (!this.editor) {
                    return;
                }
                this.editor.focus();
                this.editor.revealLineInCenter(props.currentFiddle.cursorLineNumber);
                this.editor.setPosition({
                    column: props.currentFiddle.cursorColumn,
                    lineNumber: props.currentFiddle.cursorLineNumber
                });
            },
            0
        );
    }

    @action.bound
    private updateCode(code: string) {
        const { currentFiddle, currentFiddleFullPath } = this.props;

        currentFiddle.code = code;
        this.persistFiddleStoreToLocalStorage();
    }

    @action.bound
    private onCursorPositionChange(e: monaco.editor.ICursorPositionChangedEvent) {
        if (e.reason !== monaco.editor.CursorChangeReason.NotSet && e.reason !== monaco.editor.CursorChangeReason.Explicit) {
            return;
        }
        const { currentFiddle } = this.props;
        currentFiddle.cursorColumn = e.position.column;
        currentFiddle.cursorLineNumber = e.position.lineNumber;
        this.persistFiddleStoreToLocalStorage();
    }

    private persistFiddleStoreToLocalStorage() {
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
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
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
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
    fiddlesStore: ScriptsStore;
    barista: Barista;
    currentFiddle: ScriptFile;
    currentFiddleFullPath: string;
}