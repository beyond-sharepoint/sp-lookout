import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import { PrimaryButton, DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { SharePointSettingsStore, SharePointSettings } from '../../models';
import { SPContext } from '../../services/spcontext';

@observer
export class Step4 extends React.Component<Step4Props, Step4State> {
    public constructor(props: Step4Props) {
        super(props);

        this.state = {
            isRetrievingContext: true,
            didSucceed: false,
            error: ''
        };
    }

    public componentDidMount() {
        setTimeout(
            () => {
                this.ensureSPContext();
            },
            2000
        );
    }

    public render() {
        const {
            sharePointSettingsStore,
            onPrev
        } = this.props;
        const {
            isRetrievingContext,
            didSucceed,
            error
        } = this.state;
        return (
            <div className="welcome-modal-container">
                <div className="welcome-modal-step-header">
                    Validate SP Lookout! Connection
                </div>
                <div className="welcome-modal-body">
                    <p>
                        In this final step, we're going to validate that we can interact with SharePoint
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isRetrievingContext
                            ? <Spinner size={SpinnerSize.large} label="Retrieving SPContext..." ariaLive="assertive" />
                            : null
                        }
                        {!isRetrievingContext && didSucceed === true
                            ? <div style={{ color: '#107c10', fontSize: '72px', paddingTop: '15px' }}><i className="fa fa-check-circle fa-2x" aria-hidden="true" /></div>
                            : null
                        }
                        {!isRetrievingContext && didSucceed === true
                            ? <div>Success! SP Lookout! is now ready to use!</div>
                            : null
                        }
                        {!isRetrievingContext && !didSucceed
                            ? <div style={{ color: '#a80000', fontSize: '72px', paddingTop: '15px' }}><i className="fa fa-times-circle fa-2x" aria-hidden="true" /></div>
                            : null
                        }
                        {!isRetrievingContext && !didSucceed
                            ? <div style={{ paddingBottom: '5px' }}>Uhoh, an error occurred:</div>
                            : null
                        }
                        {!isRetrievingContext && !didSucceed
                            ? <div style={{ textAlign: 'center' }}>{error}</div>
                            : null
                        }
                    </div>
                </div>
                <div className="welcome-modal-footer">
                    <DefaultButton text="Prev" onClick={onPrev} />
                    <PrimaryButton text="Finish" disabled={!didSucceed} onClick={this.completeConfiguration} />
                </div>
            </div>
        );
    }

    @action.bound
    private async ensureSPContext() {
        const sharepointBaseUrl = 'https://' + this.props.sharePointSettingsStore.sharePointSettings.testTenantUrl;

        try {
            const context = await SPContext.getContext(sharepointBaseUrl, this.props.sharePointSettingsStore.sharePointSettings.spContextConfig);
            await context.ensureContext(false);
        } catch (ex) {
            this.setState({
                isRetrievingContext: false,
                didSucceed: false,
                error: ex.message
            });

            SPContext.removeContext(sharepointBaseUrl);
            return;
        }

        this.setState({
            isRetrievingContext: false,
            didSucceed: true,
        });
    }

    @action.bound
    private completeConfiguration() {
        const { sharePointSettingsStore } = this.props;
        sharePointSettingsStore.sharePointSettings.tenantUrl = sharePointSettingsStore.sharePointSettings.testTenantUrl;
        sharePointSettingsStore.sharePointSettings.testTenantUrl = '';
        SharePointSettingsStore.saveToLocalStorage(sharePointSettingsStore);
        this.props.onFinish();
    }
}

export interface Step4State {
    isRetrievingContext: boolean;
    didSucceed: boolean;
    error: string;
}

export interface Step4Props {
    onPrev: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    onFinish: () => any;
    sharePointSettingsStore: SharePointSettingsStore;
}