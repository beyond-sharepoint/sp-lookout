import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';
import * as URI from 'urijs';
import * as FileSaver from 'file-saver';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { SettingsStore, PagesStore, ScriptsStore, SharePointSettings, AppSettings } from '../../models';
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
                                value={settingsStore.sharePointSettings.tenantUrl}
                                onChanged={this.updateTenantUrl}
                            />
                            <TextField
                                label="HostWebProxy Server Relative Url"
                                value={settingsStore.sharePointSettings.spContextConfig.proxyServerRelativeUrl}
                                onChanged={this.updateHostWebProxyUrl}
                            />
                            <DefaultButton text="Download Host Web Proxy" onClick={this.downloadHostWebProxy} />
                        </PivotItem>
                        <PivotItem linkText="Import/Export">
                            <DefaultButton text="Reset All Settings to Defaults" onClick={this.resetSettingsToDefaults} />
                        </PivotItem>
                    </Pivot>
                </div>
            </Modal>
        );
    }

    @action.bound
    private updateTenantUrl(newValue: string) {
        this.props.settingsStore.sharePointSettings.tenantUrl = newValue;
    }

    @action.bound
    private updateHostWebProxyUrl(newValue: string) {
        this.props.settingsStore.sharePointSettings.spContextConfig.proxyServerRelativeUrl = newValue;
    }

    @action.bound
    private async downloadHostWebProxy() {
        const hostWebProxyData = require('raw-loader!../../assets/HostWebProxy.html');

        const expression = `
        window.hostWebProxyConfig = {
                "responseOrigin": "*",
                "trustedOriginAuthorities": [
                    "${URI().origin()}"
                ]
            }`;

        const trustedHostWebProxyData = hostWebProxyData.replace(/(\/\/ @\}-,--`--> Start HostWebProxyConfig)([\s\S]*)(\/\/ @\}-,--`--> End HostWebProxyConfig)/, `$1\n${expression}\n$3`);
        const blob = new Blob([trustedHostWebProxyData], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, 'HostWebProxy.aspx');
    }

    @action.bound
    private async resetSettingsToDefaults() {
        await ScriptsStore.removeSettings();
        await PagesStore.removeSettings();
        await SettingsStore.removeSettings();

        location.reload();
    }
}

export interface WorkspaceSettingsProps {
    showWorkspaceSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    settingsStore: SettingsStore;
}