import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { SettingsStore, HostWebProxySettings, VisualSettings } from '../../models';
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
                                addonString='https://'
                                label="Tenant url"
                                value={settingsStore.hostWebProxySettings.tenantBaseUrl}
                                onChanged={this.updateTenantUrl}
                            />
                            <TextField
                                label="HostWebProxy Server Relative Path"
                                value={settingsStore.hostWebProxySettings.hostWebProxyServerRelativePath}
                                onChanged={this.updateHostWebProxyPath}
                            />
                        </PivotItem>
                    </Pivot>
                </div>
            </Modal>
        );
    }

    @action.bound
    private updateTenantUrl(newValue: string) {
        this.props.settingsStore.hostWebProxySettings.tenantBaseUrl = newValue;
    }

    @action.bound
    private updateHostWebProxyPath(newValue: string) {
        this.props.settingsStore.hostWebProxySettings.hostWebProxyServerRelativePath = newValue;
    }
}

export interface WorkspaceSettingsProps {
    showWorkspaceSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    settingsStore: SettingsStore;
}