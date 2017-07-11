/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, extendObservable, toJS } from 'mobx';
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
import { get, set, cloneDeep } from 'lodash';
import { FiddleSettingsModal } from '../fiddle-settings-modal';

import Barista, { BrewSettings } from '../../services/barista';
import { AppStore } from '../../models/AppStore';
import { FiddleSettings, defaultFiddleSettings } from '../../models/FiddleSettings';
import './index.css';

@observer
export default class Fiddle extends React.Component<FiddleProps, any> {
    private editorOptions;
    private commandBarItems: IContextualMenuItem[];
    private commandBarFarItems;
    private _mousetrap: MousetrapInstance;
    private _extraLibs: Array<monaco.IDisposable>;

    public constructor(props: FiddleProps) {
        super(props);

        this.state = {
            fiddlePaneSize: '50%',
            showFiddleSettingsModal: false,
            showEditor: true
        };

        this.commandBarItems = [
            {
                key: 'name',
                name: this.props.currentFiddle.name,
                title: this.props.currentFiddle.name,
                disabled: true
            },
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
                    style: { fontSize: '1.25em', lineHeight: '0.75em', verticalAlign: '-15%' }
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
    }

    private async loadTypescriptDefinitions() {

        //Import typedefs to feed the grue
        //the grue is ancient, it must be done this way.
        const typeDefs = {
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

        // // extra libraries
        // monaco.languages.typescript.typescriptDefaults.addExtraLib(
        //     `declare module "sp-pnp-js" { export declare function next() : string }`,
        //     'node_modules/@types/sp-pnp-js/index.d.ts');
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

    private async brew(allowDebugger?: boolean, timeout?: number) {
        const { barista, appStore, currentFiddle } = this.props;
        const { isBrewing } = this.state;

        if (isBrewing) {
            return;
        }

        if (!currentFiddle || !currentFiddle.code) {
            return;
        }

        let brewMode = currentFiddle.brewMode || 'sandfiddle';
        if (typeof timeout === 'undefined') {
            timeout = currentFiddle.brewTimeout || 5000;
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
                filename: currentFiddle.name,
                input: currentFiddle.code,
                brewMode: currentFiddle.brewMode,
                allowDebuggerStatement: allowDebugger,
                timeout: timeout,
                requireConfig: toJS(currentFiddle.requireConfig)
            };

            let result = await barista.brew(brewSettings);
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

    private async debug() {
        return this.brew(true, 0);
    }

    @action.bound
    private updateCode(code: string) {
        this.props.currentFiddle.code = code;
        this.props.appStore.saveFiddle(this.props.currentFiddle);
    }

    @autobind
    private showFiddleSettings() {
        this.props.appStore.extendObjectWithDefaults(this.props.currentFiddle, defaultFiddleSettings);
        this.setState({
            showFiddleSettingsModal: true
        });
    }

    @autobind
    private hideFiddleSettings() {
        this.setState({
            showFiddleSettingsModal: false
        });
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
        const { appStore, currentFiddle } = this.props;

        const { isBrewing, lastBrewResult, lastBrewResultIsError, showEditor } = this.state;
        let fiddleResultPaneStyle: any = {};
        if (lastBrewResultIsError) {
            fiddleResultPaneStyle.backgroundColor = 'rgb(255, 214, 214)';
        }

        const theme = currentFiddle.theme || 'vs';

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
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <CommandBar
                        isSearchBoxVisible={false}
                        items={this.commandBarItems}
                        farItems={this.commandBarFarItems}
                    />
                    <div style={{ flex: '1' }}>
                        {showEditor ?
                            <MonacoEditor
                                value={currentFiddle.code}
                                language={currentFiddle.language}
                                theme={currentFiddle.theme}
                                filename={currentFiddle.name}
                                onChange={this.updateCode}
                                editorWillMount={this.editorWillMount}
                                editorWillDispose={this.editorWillDispose}
                                options={toJS(currentFiddle.editorOptions)}
                            />
                            : null
                        }
                        <FiddleSettingsModal
                            showFiddleSettingsModal={this.state.showFiddleSettingsModal}
                            onDismiss={this.hideFiddleSettings}
                            appStore={appStore}
                            currentFiddle={currentFiddle}
                        />
                    </div>
                </div>
                <div className="fiddle-results" style={{ backgroundColor: theme.endsWith('dark') ? 'black' : null }}>
                    {isBrewing ?
                        <Spinner size={SpinnerSize.large} label="Brewing..." ariaLive="assertive" />
                        : null}
                    {!isBrewing ?
                        <ObjectInspector data={lastBrewResult} expandLevel={2} showNonenumerable={false} theme={theme.endsWith('dark') ? 'chromeDark' : 'chromeLight'} />
                        : null}
                </div>
            </SplitPane>
        );
    }
}

export interface FiddleProps {
    appStore: AppStore;
    barista: Barista;
    currentFiddle: FiddleSettings;
}