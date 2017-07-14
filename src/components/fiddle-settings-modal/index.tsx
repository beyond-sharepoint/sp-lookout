import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { FiddlesStore, FiddleSettings, defaultFiddleSettings } from '../../models';
import './index.css';

@observer
export class FiddleSettingsModal extends React.Component<FiddleSettingsProps, any> {
    public render() {
        const {
            showFiddleSettingsModal,
            onDismiss,
            fiddlesStore,
            currentFiddle
        } = this.props;

        return (
            <Modal
                isOpen={showFiddleSettingsModal}
                onDismiss={onDismiss}
                isBlocking={false}
                containerClassName="fiddle-settings-modal-container"
            >
                <div className="fiddle-settings-modal-header">
                    <span>SPFiddle Settings</span>
                </div>
                <div className="fiddle-settings-modal-body">
                    <Pivot>
                        <PivotItem linkText="Script Options">
                            <TextField
                                label='Description'
                                multiline={true}
                                value={currentFiddle.description}
                                onChanged={this.updateDescription}
                            />
                        </PivotItem>
                        <PivotItem linkText="Editor Options">
                            <Dropdown
                                label="Theme:"
                                id="fiddle-theme"
                                ariaLabel="Select Fiddle Theme"
                                selectedKey={currentFiddle.theme || defaultFiddleSettings.theme}
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
                        </PivotItem>
                        <PivotItem linkText="Import Options">
                            TODO
                        </PivotItem>
                        <PivotItem linkText="TypeScript Options">
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
    private updateTheme(ev: any) {
        this.props.currentFiddle.theme = ev.key;
    }

    @action.bound
    private updateMinimap(ev: any) {
        set(this.props, 'currentFiddle.editorOptions.minimap.enabled', ev);
    }
}

export interface FiddleSettingsProps {
    showFiddleSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    fiddlesStore: FiddlesStore;
    currentFiddle: FiddleSettings;
}