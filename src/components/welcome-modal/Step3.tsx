import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import * as URI from 'urijs';
import * as FileSaver from 'file-saver';

import { PrimaryButton, DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { SettingsStore, SharePointSettings, LookoutSettings } from '../../models';

@observer
export class Step3 extends React.Component<Step3Props, any> {

    public render() {
        const {
            settingsStore,
            onPrev,
            onNext
        } = this.props;

        const targetDocumentLibrary = URI('https://' + settingsStore.sharePointSettings.testTenantUrl)
            .pathname(settingsStore.sharePointSettings.spContextConfig.proxyServerRelativeUrl)
            .filename('')
            .href();

        return (
            <div className="welcome-modal-container">
                <div className="welcome-modal-step-header">
                    Upload HostWebProxy
                </div>
                <div className="welcome-modal-body">
                    <p>
                        Now, we're going to upload a small file to your SharePoint environment. This file lets SP Lookout! communicate and perform actions with the SharePoint REST services.
                        This file is secured to only authenticated users and this current address.
                    </p>
                    <p style={{ paddingTop: '15px' }}>
                        Click the button below to download the SP Lookout! Proxy file, then, upload this file to the server relative location listed below.
                    </p>
                    <PrimaryButton text="Click to Download" onClick={this.downloadHostWebProxy} />
                    <p>
                        This file can be located anywhere within your SharePoint tenant so if you'd like to change the location, simply upload
                        the file to the location you desire and then update the URL below.
                    </p>
                    <TextField
                        label="HostWebProxy Server Relative Url"
                        value={settingsStore.sharePointSettings.spContextConfig.proxyServerRelativeUrl}
                        onChanged={this.updateHostWebProxyUrl}
                    />
                    <a href={targetDocumentLibrary} target="_blank" style={{color: 'white'}}>Open HostWebProxy target library in new window.</a>
                    <p>
                        When you're finished uploading the file to the above location, click next to continue.
                    </p>
                </div>
                <div className="welcome-modal-footer">
                    <DefaultButton text="Prev" onClick={onPrev} />
                    <PrimaryButton text="Next" onClick={onNext} />
                </div>
            </div>
        );
    }

    @action.bound
    private async downloadHostWebProxy() {
        const hostWebProxyUrl = require('file-loader@../../../public/HostWebProxy.txt');
        const response = await fetch(hostWebProxyUrl);
        const hostWebProxyData = await response.text();

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
    private updateHostWebProxyUrl(newValue: string) {
        this.props.settingsStore.sharePointSettings.spContextConfig.proxyServerRelativeUrl = newValue;
        SettingsStore.saveToLocalStorage(this.props.settingsStore);
    }
}

export interface Step3Props {
    onPrev: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    onNext: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    settingsStore: SettingsStore;
}