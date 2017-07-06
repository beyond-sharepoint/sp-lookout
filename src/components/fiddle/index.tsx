import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observable, action, toJS } from 'mobx';
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
import { FiddleSettings } from '../fiddle-settings';

import Barista from '../../barista';
import { FiddleState } from '../../model/AppStore';
import './index.css';

@observer
export default class Fiddle extends React.Component<FiddleProps, any> {
    private editorOptions;
    private commandBarItems: IContextualMenuItem[];
    private commandBarFarItems;
    private keyMap;
    private _mousetrap: MousetrapInstance;

    public constructor(props: FiddleProps) {
        super(props);

        this.state = {
            fiddlePaneSize: '50%',
            showFiddleSettingsModal: false,
            showEditor: true
        }

        this.keyMap = {
            'brew': 'command+enter'
        };

        this.commandBarItems = [
            {
                key: 'name',
                name: this.props.fiddleState.filename,
                disabled: true
            },
            {
                key: 'run',
                name: 'Run',
                icon: 'Play',
                ariaLabel: 'Execute current Script',
                onClick: () => { this.brew(this.props.fiddleState.code) },
            },
            {
                key: "debug",
                name: "Debug",
                onClick: () => { this.brew(this.props.fiddleState.code, this.props.fiddleState.brewMode, true, 0) },
                iconProps: {
                    className: "fa fa-bug",
                    style: { fontSize: '1.25em', lineHeight: '0.75em', verticalAlign: '-15%' }
                }
            },
        ]

        this.commandBarFarItems = [
            {
                icon: 'settings',
                title: 'Settings',
                onClick: this.showFiddleSettings,
            }
        ];
    }

    @autobind
    private editorWillMount(monaco) {

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
            jsx: monaco.languages.typescript.JsxEmit.React
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });
    }

    public componentDidMount() {
        this._mousetrap = new Mousetrap(
            ReactDOM.findDOMNode(this)
        );
        this._mousetrap.bind(['ctrl+return'], () => {
            this.brew(this.props.fiddleState.code);
        });
    }

    private reloadEditor() {
        this.setState({
            showEditor: false
        });

        setTimeout(() => {
            this.setState({
                showEditor: true
            });
        }, 1000);
    }

    @action.bound
    private updateCode(code) {
        this.props.fiddleState.code = code;
    }

    @action.bound
    private updateTheme(ev) {
        this.props.fiddleState.theme = ev.key;
    }

    @action.bound
    private updateLanguage(ev) {
        this.props.fiddleState.language = ev.key;
    }

    @action.bound
    private updateMinimap(ev) {
        //set(this.props, 'fiddleState.editorOptions.minimap.enabled', ev);
        if (!this.props.fiddleState.editorOptions) {
            this.props.fiddleState.editorOptions = {};
        }

        this.props.fiddleState.editorOptions.minimap = {
            ...this.props.fiddleState.editorOptions.minimap,
            enabled: ev
        };
    }

    private async brew(code: string, brewMode?: 'require' | 'sandfiddle', allowDebugger?: boolean, timeout?: number) {
        const { barista, fiddleState } = this.props;
        const { isBrewing } = this.state;

        if (isBrewing) {
            return;
        }

        brewMode = brewMode || fiddleState.brewMode || 'sandfiddle';
        if (typeof timeout === 'undefined') {
            timeout = fiddleState.brewTimeout || 5000
        }

        
        let lastBrewResult: any = undefined;
        let lastBrewResultIsError = false;

        this.setState({
            isBrewing: true,
            lastBrewResult,
            lastBrewResultIsError
        });

        try {

            const brewSettings = {
                filename: fiddleState.filename,
                input: fiddleState.code,
                brewMode: fiddleState.brewMode,
                timeout: timeout,
                requireConfig: toJS(fiddleState.requireConfig)
            };

            let result = await barista.brew(brewSettings);
            if (!result) {
                result = {
                    data: "An empty result was returned."
                }
            }
            console.dir(result);
            lastBrewResult = result.data || result.transferrableData;
        } catch (ex) {
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
    }

    public render() {
        const { fiddleState } = this.props;
        const { isBrewing, lastBrewResult, lastBrewResultIsError, showEditor } = this.state;
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
                        {showEditor ?
                            <MonacoEditor
                                value={fiddleState.code}
                                language={fiddleState.language}
                                theme={fiddleState.theme}
                                filename={fiddleState.filename}
                                onChange={this.updateCode}
                                editorWillMount={this.editorWillMount}
                                options={toJS(fiddleState.editorOptions)}
                            >
                            </MonacoEditor>
                            : null
                        }
                        <FiddleSettings
                            showFiddleSettingsModal={this.state.showFiddleSettingsModal}
                            onDismiss={this.hideFiddleSettings}
                            updateLanguage={this.updateLanguage}
                            updateTheme={this.updateTheme}
                            updateMinimap={this.updateMinimap}
                            fiddleState={fiddleState}
                        />
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
    barista: Barista;
    fiddleState: FiddleState;
}