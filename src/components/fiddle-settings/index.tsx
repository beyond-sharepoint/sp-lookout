import * as React from 'react';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import { get } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { FiddleState } from '../../model/AppStore';
import './index.css';

@observer
export class FiddleSettings extends React.Component<FiddleSettingsProps, any> {
    public render() {
        const {
            showFiddleSettingsModal,
            onDismiss,
            updateTheme,
            updateLanguage,
            updateMinimap,
            fiddleState
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
                                selectedKey={fiddleState.theme}
                                onChanged={updateTheme}
                                options={
                                    [
                                        { key: "vs", text: "Light (Visual Studio)" },
                                        { key: "vs-dark", text: "Dark (Visual Studio)" },
                                    ]
                                }
                            />
                            <Dropdown
                                label="Language:"
                                id="fiddle-language"
                                ariaLabel="Select Fiddle Language"
                                selectedKey={fiddleState.language}
                                onChanged={updateLanguage}
                                options={
                                    [
                                        { key: "typescript", text: "TypeScript" },
                                        { key: "javascript", text: "JavaScript" },
                                    ]
                                }
                            />
                            <Toggle
                                defaultChecked={get(fiddleState, "editorOptions.minimap.enabled") as boolean}
                                onChanged={updateMinimap}
                                label="Minimap Enabled"
                                onAriaLabel="Minimap is enabled. Press to disable."
                                offAriaLabel="Minimap is disabled. Press to enable."
                                onText="On"
                                offText="Off"
                            />
                        </PivotItem>
                        <PivotItem linkText="Import Options">
                        </PivotItem>
                        <PivotItem linkText="TypeScript Options">
                        </PivotItem>
                    </Pivot>
                </div>
            </Modal>
        );
    }
}


export interface FiddleSettingsProps {
    showFiddleSettingsModal: boolean;
    onDismiss: (any) => any,
    fiddleState: FiddleState,
    updateTheme?: (option: IDropdownOption, index: number | undefined) => void,
    updateLanguage?: (option: IDropdownOption, index: number | undefined) => void,
    updateMinimap?: (checked: boolean) => void
}