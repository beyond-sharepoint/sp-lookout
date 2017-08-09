import * as React from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';

import MonacoEditor from '../monaco-editor';

import { FiddlesStore, FiddleSettings } from '../../models';
import './index.css';

@observer
export class FiddleSettingsModal extends React.Component<FiddleSettingsProps, FiddleSettingsState> {
    constructor(props: FiddleSettingsProps) {
        super(props);

        this.state = {
            requireConfig: JSON.stringify(props.currentFiddle.requireConfig, null, 4),
            defaultScriptProps: JSON.stringify(props.currentFiddle.defaultScriptProps, null, 4)
        };
    }
    public render() {
        const {
            showFiddleSettingsModal,
            fiddlesStore,
            currentFiddle
        } = this.props;

        return (
            <Modal
                isOpen={showFiddleSettingsModal}
                onDismiss={this.onDismiss}
                isBlocking={false}
                containerClassName="fiddle-settings-modal-container"
            >
                <div className="fiddle-settings-modal-header">
                    <span>SPFiddle Settings</span>
                </div>
                <div className="fiddle-settings-modal-body">
                    <Pivot>
                        <PivotItem linkText="Script Options" style={{ flex: '1 0 0%'}}>
                            <TextField
                                label="Description"
                                multiline={true}
                                value={currentFiddle.description}
                                onChanged={this.updateDescription}
                            />
                            <SpinButton
                                label="Script Timeout (ms)"
                                min={0}
                                max={600000}
                                step={1}
                                value={currentFiddle.brewTimeout.toString()}
                                onIncrement={this.updateBrewTimeout}
                                onDecrement={this.updateBrewTimeout}
                                onValidate={this.updateBrewTimeout}
                            />
                            <Toggle
                                defaultChecked={currentFiddle.autoSaveArrayBufferResults}
                                onChanged={this.updateAutoSaveArrayBufferResults}
                                label="Auto-Save ArrayBuffer Results"
                                onAriaLabel="Auto-Save is enabled. Press to disable."
                                offAriaLabel="Auto-Save is disabled. Press to enable."
                                onText="On"
                                offText="Off"
                            />
                        </PivotItem>
                        <PivotItem linkText="Default Props" style={{flex: '1 0 0%', display: 'flex'}}>
                            <MonacoEditor
                                value={this.state.defaultScriptProps}
                                language="json"
                                onChange={this.updateDefaultProps}
                                options={{
                                    automaticLayout: true,
                                    cursorBlinking: 'blink',
                                    folding: true,
                                    minimap: {
                                        enabled: false
                                    },
                                    readOnly: false,
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'off'
                                }}
                                style={{height: '90%'}}
                            />
                        </PivotItem>
                        <PivotItem linkText="Editor Options" style={{ flex: '1 0 0%'}}>
                            <Dropdown
                                label="Theme:"
                                id="fiddle-theme"
                                ariaLabel="Select Fiddle Theme"
                                selectedKey={currentFiddle.theme || new FiddleSettings().theme}
                                onChanged={this.updateTheme}
                                options={
                                    [
                                        { key: 'vs', text: 'Light (Visual Studio)' },
                                        { key: 'vs-dark', text: 'Dark (Visual Studio)' },
                                    ]
                                }
                            />
                            <Toggle
                                defaultChecked={get(currentFiddle, 'editorOptions.minimap.enabled') as boolean}
                                onChanged={this.updateMinimap}
                                label="Minimap Enabled"
                                onAriaLabel="Minimap is enabled. Press to disable."
                                offAriaLabel="Minimap is disabled. Press to enable."
                                onText="On"
                                offText="Off"
                            />
                            <Dropdown
                                label="Wordwrap:"
                                id="fiddle-wordwrap"
                                ariaLabel="Select wordwrap"
                                selectedKey={currentFiddle.editorOptions.wordWrap || new FiddleSettings().editorOptions.wordWrap}
                                onChanged={this.updateWordWrap}
                                options={
                                    [
                                        { key: 'off', text: 'Off - Never Wrap Lines' },
                                        { key: 'on', text: 'On - Wrap at viewport width' },
                                        { key: 'wordWrapColumn', text: 'Column - Wrap at 80 characters' },
                                        { key: 'bounded', text: 'Bounded - Wrap at min(viewportwidth, 80)' }
                                    ]
                                }
                            />
                            <Dropdown
                                label="Cursor Animation Style:"
                                id="fiddle-cursor"
                                ariaLabel="Select Cursor Animation Style"
                                selectedKey={currentFiddle.editorOptions.cursorBlinking || new FiddleSettings().editorOptions.cursorBlinking}
                                onChanged={this.updateCursorAnimationStyle}
                                options={
                                    [
                                        { key: 'blink', text: 'Blink' },
                                        { key: 'smooth', text: 'Smooth' },
                                        { key: 'phase', text: 'Phase' },
                                        { key: 'expand', text: 'Expand' },
                                        { key: 'solid', text: 'Solid' }
                                    ]
                                }
                            />
                        </PivotItem>
                        <PivotItem linkText="RequireJS Config" style={{flex: '1 0 0%', display: 'flex'}}>
                            <MonacoEditor
                                value={this.state.requireConfig}
                                language="json"
                                onChange={this.updateRequireConfig}
                                options={{
                                    automaticLayout: true,
                                    cursorBlinking: 'blink',
                                    folding: true,
                                    minimap: {
                                        enabled: false
                                    },
                                    readOnly: false,
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'off'
                                }}
                                style={{height: '90%'}}
                            />
                        </PivotItem>
                        <PivotItem linkText="TypeScript Options" style={{ flex: '1 0 0%'}}>
                            TODO
                        </PivotItem>
                    </Pivot>
                </div>
            </Modal>
        );
    }

    @action.bound
    private updateDescription(newValue: any) {
        this.props.currentFiddle.description = newValue;
    }

    @action.bound
    private updateBrewTimeout(newValue: string) {
        try {
            this.props.currentFiddle.brewTimeout = parseInt(newValue, 10);
            return newValue;
        }
        finally {
            return;
        }
    }

    @action.bound
    private updateAutoSaveArrayBufferResults(newValue: boolean) {
        this.props.currentFiddle.autoSaveArrayBufferResults = newValue;
    }

    @action.bound
    private updateRequireConfig(newValue: string) {
        this.setState({
            requireConfig: newValue
        });
    }

    @action.bound
    private updateDefaultProps(newValue: string) {
        this.setState({
            defaultScriptProps: newValue
        });
    }

    @action.bound
    private updateTheme(ev: any) {
        this.props.currentFiddle.theme = ev.key;
    }

    @action.bound
    private updateMinimap(newValue: boolean) {
        set(this.props, 'currentFiddle.editorOptions.minimap.enabled', newValue);
    }

    @action.bound
    private updateCursorAnimationStyle(ev: any) {
        this.props.currentFiddle.editorOptions.cursorBlinking = ev.key;
    }

    @action.bound
    private updateWordWrap(ev: any) {
        this.props.currentFiddle.editorOptions.wordWrap = ev.key;
    }

    @action.bound
    private onDismiss(ev?: React.MouseEvent<HTMLButtonElement>) {
        const { onDismiss } = this.props;

        try {
            this.props.currentFiddle.requireConfig = observable(JSON.parse(this.state.requireConfig));
        } catch (ex) {
            //Do nothing
        }

        try {
            this.props.currentFiddle.defaultScriptProps = observable(JSON.parse(this.state.defaultScriptProps));
        } catch (ex) {
            //Do nothing
        }

        if (typeof onDismiss === 'function') {
            onDismiss(ev);
        }
    }
}

export interface FiddleSettingsState {
    requireConfig: string;
    defaultScriptProps: string;
}

export interface FiddleSettingsProps {
    showFiddleSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    fiddlesStore: FiddlesStore;
    currentFiddle: FiddleSettings;
}