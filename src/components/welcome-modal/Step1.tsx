import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import { PrimaryButton, DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { SharePointSettingsStore, SharePointSettings } from '../../models';

@observer
export class Step1 extends React.Component<Step1Props, any> {
    public render() {
        const {
            sharePointSettingsStore,
            onPrev,
            onNext
        } = this.props;
        return (
            <div className="welcome-modal-container">
                <div className="welcome-modal-step-header">
                    Specify SharePoint Location
                </div>
                <div className="welcome-modal-body">
                    <p>
                        Let's get started by configuring the URL to your SharePoint Tenant.
                    This can be a URL to your SharePoint Online site, or an on-prem url.
                    </p>
                    <TextField
                        addonString="https://"
                        label="SharePoint Tenant Url:"
                        value={sharePointSettingsStore.sharePointSettings.testTenantUrl}
                        onChanged={this.updateTestTenantUrl}
                    />
                </div>
                <div className="welcome-modal-footer">
                    <DefaultButton text="Prev" onClick={onPrev} />
                    <PrimaryButton text="Next" disabled={!this.isTenantUrlValid()} onClick={onNext} />
                </div>
            </div>
        );
    }

    @action.bound
    private isTenantUrlValid() {
        if (this.props.sharePointSettingsStore.sharePointSettings.testTenantUrl.length <= 1) {
            return false;
        }

        return true;
    }

    @action.bound
    private updateTestTenantUrl(newValue: string) {
        this.props.sharePointSettingsStore.sharePointSettings.testTenantUrl = newValue;
        SharePointSettingsStore.saveToLocalStorage(this.props.sharePointSettingsStore);
    }
}

export interface Step1Props {
    onPrev: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    onNext: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    sharePointSettingsStore: SharePointSettingsStore;
}