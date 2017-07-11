import * as React from 'react';
import { observable, action, extendObservable } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { AppStore } from '../../models/AppStore';
import { FiddleSettings, defaultFiddleSettings } from '../../models/FiddleSettings';
import './index.css';

@observer
export class FiddleSettingsModal extends React.Component<FiddleSettingsProps, any> {
    public render() {
        const {
            showFiddleSettingsModal,
            onDismiss,
            appStore,
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
                            <Dropdown
                                label="Language:"
                                id="fiddle-language"
                                ariaLabel="Select Fiddle Language"
                                selectedKey={currentFiddle.language || defaultFiddleSettings.language}
                                onChanged={this.updateLanguage}
                                options={
                                    [
                                        { key: 'typescript', text: 'TypeScript' },
                                        { key: 'javascript', text: 'JavaScript' },
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
    private updateTheme(ev: any) {
        this.props.currentFiddle.theme = ev.key;
    }

    @action.bound
    private updateLanguage(ev: any) {
        this.props.currentFiddle.language = ev.key;
    }

    @action.bound
    private updateMinimap(ev: any) {
        set(this.props, 'currentFiddle.editorOptions.minimap.enabled', ev);
    }
}

export interface FiddleSettingsProps {
    showFiddleSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    appStore: AppStore;
    currentFiddle: FiddleSettings;
}