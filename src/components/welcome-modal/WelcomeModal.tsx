import * as React from 'react';
import { observer } from 'mobx-react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import * as URI from 'urijs';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { PrimaryButton, DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';

import { SettingsStore, BaristaSettings, VisualSettings } from '../../models';
import { Step0 } from './Step0';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import './index.css';

@observer
export class WelcomeModal extends React.Component<WorkspaceSettingsProps, any> {
    private _routes;
    public constructor(props: WorkspaceSettingsProps) {
        super(props);

        const {
            showWelcomeModal,
            onSkip,
            onFinish,
            settingsStore,
        } = this.props;

        //Authenticate.aspx on SPO and 2016 won't redirect to a non-localhost url.
        const currentUri: uri.URI = URI();
        let shouldValidate = true;
        if (!currentUri.origin().startsWith("localhost")) {
            shouldValidate = false;
        }

        this._routes = [
            {
                path: '/welcome/step1',
                exact: true,
                main: (innerProps) => {
                    return (
                        <Step1
                            onPrev={() => { innerProps.history.push('/welcome'); }}
                            onNext={() => { shouldValidate ? innerProps.history.push('/welcome/step2') : innerProps.history.push('/welcome/step3'); }}
                            settingsStore={settingsStore}
                        />
                    );
                }
            },
            {
                path: '/welcome/step2',
                exact: true,
                main: (innerProps) => {
                    return (
                        <Step2
                            onPrev={() => { innerProps.history.push('/welcome/step1'); }}
                            onNext={() => { innerProps.history.push('/welcome/step3'); }}
                            settingsStore={settingsStore}
                        />
                    );
                }
            },
            {
                path: '/welcome/step3',
                exact: true,
                main: (innerProps) => {
                    return (
                        <Step3
                            onPrev={() => { shouldValidate ? innerProps.history.push('/welcome/step2') : innerProps.history.push('/welcome/step1'); }}
                            onNext={() => { innerProps.history.push('/welcome/step4'); }}
                            settingsStore={settingsStore}
                        />
                    );
                }
            },
            {
                path: '/welcome/step4',
                exact: true,
                main: (innerProps) => {
                    return (
                        <Step4
                            onPrev={() => { innerProps.history.push('/welcome/step3'); }}
                            onFinish={onFinish}
                            settingsStore={settingsStore}
                        />
                    );
                }
            },
            {
                main: (innerProps) => {
                    return (
                        <Step0
                            onSkip={onSkip}
                            onNext={() => { innerProps.history.push('/welcome/step1'); }}
                        />
                    );
                }
            }
        ];
    }
    public render() {
        const {
            showWelcomeModal,
            onSkip,
            settingsStore,
        } = this.props;

        return (
            <Router>
                <Modal
                    isOpen={showWelcomeModal}
                    isBlocking={true}
                    isDarkOverlay={true}
                    ignoreExternalFocusing={true}
                    containerClassName="welcome-modal"
                >
                    <Switch>
                        {this._routes.map((route, index) => (
                            <Route
                                key={index}
                                path={route.path}
                                exact={route.exact}
                                component={route.main}
                            />
                        ))}
                    </Switch>
                </Modal>
            </Router>
        );
    }
}

export interface WorkspaceSettingsProps {
    showWelcomeModal: boolean;
    onSkip: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    onFinish: () => any;
    settingsStore: SettingsStore;
}