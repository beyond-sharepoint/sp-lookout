import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import * as URI from 'urijs';

import { PrimaryButton, DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { SettingsStore, BaristaSettings, VisualSettings } from '../../models';

@observer
export class Step2 extends React.Component<Step2Props, Step2State> {
    public constructor(props: Step2Props) {
        super(props);

        this.state = {
            isNavigatingToSharePoint: false,
            sharePointValidated: false
        };
    }

    public componentWillMount() {
        const currentUri: uri.URI = URI();

        if (currentUri.hasQuery('splauth')) {
            this.setState({
                isNavigatingToSharePoint: false,
                sharePointValidated: true
            });
            return;
        }
    }

    public render() {
        const {
            settingsStore,
            onPrev,
            onNext
        } = this.props;

        const {
            isNavigatingToSharePoint,
            sharePointValidated
        } = this.state;

        return (
            <div className="welcome-modal-container">
                <div className="welcome-modal-step-header">
                    Verifying SharePoint location
                </div>
                <div className="welcome-modal-body">
                    {!sharePointValidated
                        ? <div>
                            <p>
                                <strong>Great!</strong> Next, we're going to verify that we can access the SharePoint environment you specified.
                    </p>
                            <p style={{ paddingTop: '25px' }}>
                                If you're not already logged in, you will be prompted for authentication and will be bought back to this page.
                    </p>
                            <p>
                                If you get an invalid page, navigate back to SP Lookout! in your browser and ensure that the URL to your
                        SharePoint environment was entered correctly.
                    </p>
                        </div>
                        : null
                    }
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isNavigatingToSharePoint
                            ? <Spinner size={SpinnerSize.large} label="Verifying SharePoint Location..." ariaLive="assertive" />
                            : null
                        }
                        {sharePointValidated === true
                            ? <div style={{ color: '#107c10', fontSize: '72px', paddingTop: '15px' }}><i className="fa fa-check-circle fa-2x" aria-hidden="true" /></div>
                            : null
                        }
                        {sharePointValidated === true
                            ? <div>SharePoint Validated!</div>
                            : null
                        }
                    </div>
                </div>
                <div className="welcome-modal-footer">
                    <DefaultButton text="Prev" onClick={onPrev} />
                    <PrimaryButton text="Next" onClick={this.navigateToSharePoint} />
                </div>
            </div>
        );
    }

    @action.bound
    private navigateToSharePoint() {
        if (this.state.sharePointValidated === true) {
            this.props.onNext();
            return;
        }

        this.setState({
            isNavigatingToSharePoint: true
        });

        //Compose the URL to the SharePoint authentication endpoint.
        const sharePointBaseUrl = this.props.settingsStore.baristaSettings.testTenantUrl;
        const authenticationEndpointWebRelativeUrl = '/_layouts/15/authenticate.aspx';
        const currentUri: uri.URI = URI();

        let sourceUrl = URI()
            .addQuery({ splauth: currentUri.hash() })
            .hash('');

        let authUri = URI('https://' + sharePointBaseUrl)
            .pathname(authenticationEndpointWebRelativeUrl)
            .addQuery({ 'source': sourceUrl.normalize().href() })
            .normalize()
            .toString();

        setTimeout(
            () => {
                location.href = authUri;
            },
            1500
        );
    }
}

export interface Step2State {
    isNavigatingToSharePoint: boolean;
    sharePointValidated: boolean;
}

export interface Step2Props {
    onPrev: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    onNext: () => void;
    settingsStore: SettingsStore;
}