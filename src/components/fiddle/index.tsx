/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

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

import Barista, { BrewSettings } from '../../barista';
import { FiddleState } from '../../model/AppStore';
import './index.css';

@observer
export default class Fiddle extends React.Component<FiddleProps, any> {
    private editorOptions;
    private commandBarItems: IContextualMenuItem[];
    private commandBarFarItems;
    private _mousetrap: MousetrapInstance;

    public constructor(props: FiddleProps) {
        super(props);

        this.state = {
            fiddlePaneSize: '50%',
            showFiddleSettingsModal: false,
            showEditor: true
        }

        this.commandBarItems = [
            {
                key: 'name',
                name: this.props.fiddleState.filename,
                title: this.props.fiddleState.filename,
                disabled: true
            },
            {
                key: 'run',
                name: 'Run',
                title: 'Execute the current script.',
                icon: 'Play',
                ariaLabel: 'Execute the current script.',
                onClick: () => { this.brew(this.props.fiddleState.code, this.props.fiddleState.brewMode) },
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
                onClick: () => { this.debug(this.props.fiddleState.code, this.props.fiddleState.brewMode) },
            },
        ]

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
        }

        for (let name in typeDefs) {
            const fileResponse = await fetch(typeDefs[name]);
            const fileContents = await fileResponse.text();
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                fileContents,
                `node_modules/@types/${name}/index.d.ts`);
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

    public componentDidMount() {
        this._mousetrap = new Mousetrap(
            ReactDOM.findDOMNode(this)
        );

        this._mousetrap.bind(['ctrl+return', 'ctrl+f5'], () => {
            this.brew(this.props.fiddleState.code, this.props.fiddleState.brewMode);
        });

        this._mousetrap.bind(['ctrl+shift+return', 'f5'], () => {
            this.debug(this.props.fiddleState.code, this.props.fiddleState.brewMode);
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

    private async debug(code: string, brewMode?: 'require' | 'sandfiddle') {
        return this.brew(code, brewMode, true, 0);
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

            const brewSettings: BrewSettings = {
                filename: fiddleState.filename,
                input: fiddleState.code,
                brewMode: fiddleState.brewMode,
                allowDebuggerStatement: allowDebugger,
                timeout: timeout,
                requireConfig: toJS(fiddleState.requireConfig)
            };

            let result = await barista.brew(brewSettings);
            if (!result) {
                result = {
                    data: 'An empty result was returned.'
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
            console.log('your brew is complete!');
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
            fiddleResultPaneStyle.backgroundColor = 'rgb(255, 214, 214)';
        }

        return (
            <SplitPane
                split='vertical'
                className='left-sidebar'
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
                <div className='fiddle-results'>
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

export interface FiddleProps {
    barista: Barista;
    fiddleState: FiddleState;
}