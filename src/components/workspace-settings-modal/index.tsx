import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { SettingsStore, BaristaSettings, VisualSettings } from '../../models';
import './index.css';

@observer
export class WorkspaceSettingsModal extends React.Component<WorkspaceSettingsProps, any> {
    public render() {
        const {
            showWorkspaceSettingsModal,
            onDismiss,
            settingsStore,
        } = this.props;

        return (
            <Modal
                isOpen={showWorkspaceSettingsModal}
                onDismiss={onDismiss}
                isBlocking={false}
                containerClassName="settings-modal-container"
            >
                <div className="settings-modal-header">
                    <span>SP Lookout! Settings</span>
                </div>
                <div className="settings-modal-body">
                    <Pivot>
                        <PivotItem linkText="Proxy Options">
                            <TextField
                                addonString="https://"
                                label="SharePoint Tenant Url"
                                value={settingsStore.baristaSettings.tenantUrl}
                                onChanged={this.updateTenantUrl}
                            />
                            <TextField
                                label="HostWebProxy Server Relative Url"
                                value={settingsStore.baristaSettings.spContextConfig.proxyServerRelativeUrl}
                                onChanged={this.updateHostWebProxyUrl}
                            />
                        </PivotItem>
                        <PivotItem linkText="Import/Export">
                            TODO
                        </PivotItem>
                    </Pivot>
                </div>
            </Modal>
        );
    }

    @action.bound
    private updateTenantUrl(newValue: string) {
        this.props.settingsStore.baristaSettings.tenantUrl = newValue;
    }

    @action.bound
    private updateHostWebProxyUrl(newValue: string) {
        this.props.settingsStore.baristaSettings.spContextConfig.proxyServerRelativeUrl = newValue;
    }
}

export interface WorkspaceSettingsProps {
    showWorkspaceSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    settingsStore: SettingsStore;
}