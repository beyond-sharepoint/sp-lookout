import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { BaseWebPart, BaseWebPartState } from './BaseWebPart';

import * as later from 'later';

const asAutoRefreshingWebPart = function <P extends object, S extends BaseWebPartState, WP extends BaseWebPart<P, S>>(webPart: WP) {
    return class AutoRefreshingWebPart extends BaseWebPart<AutoRefreshingWebPartProps, AutoRefreshingWebPartState> {
        private innerWebPart: WP;
        private timer: later.Timer | undefined;

        public constructor(props: AutoRefreshingWebPartProps) {
            super(props);

            this.state = {
                showWebPartSettingsPanel: false,
                isRefreshing: false
            };

            this.showWebPartSettings = this.showWebPartSettings.bind(this);
            this.hideWebPartSettings = this.hideWebPartSettings.bind(this);
            this.onTextScheduleChanged = this.onTextScheduleChanged.bind(this);
        }

        getDefaultWebPartProps() {
            return {
                textSchedule: 'every 5 mins',
            };
        }

        componentWillMount() {
            this.setSchedule();
        }

        componentWillUnmount() {
            if (this.timer) {
                this.timer.clear();
                this.timer = undefined;
            }
        }

        renderWebPartContent(): JSX.Element {
            const { isRefreshing } = this.state;
            let refreshingLabel = 'Refreshing...';

            const WebPart = webPart as any;

            return (
                <div>
                    {isRefreshing === true &&
                        <div style={{ flex: '1 0 0%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Spinner size={SpinnerSize.large} label={refreshingLabel} ariaLive="assertive" />
                        </div>
                    }
                    {
                        !isRefreshing && typeof WebPart === 'function'
                            ? <WebPart
                                ref={(innerWebPart) => { this.innerWebPart = innerWebPart; }}
                                {...this.props}
                                disableChrome={true}
                            />
                            : !isRefreshing && <div>Unexpected Error</div>
                    }
                </div>
            );
        }

        public renderWebPartSettings() {
            return (
                <div>
                    {this.innerWebPart && typeof this.innerWebPart.renderWebPartSettings === 'function' && this.innerWebPart.renderWebPartSettings()}
                    <TextField
                        label="Schedule"
                        value={this.webPartProps.textSchedule}
                        onChanged={this.onTextScheduleChanged}
                    />
                </div>
            );
        }

        protected showWebPartSettings() {
            if (this.timer) {
                this.timer.clear();
            }
            super.showWebPartSettings();
        }

        protected hideWebPartSettings() {
            this.setSchedule();
            super.hideWebPartSettings();
        }

        private setSchedule() {
            if (typeof this.webPartProps.textSchedule !== 'string') {
                return;
            }

            const sched = later.parse.text(this.webPartProps.textSchedule);
            if (sched.error === -1) {
                if (this.timer) {
                    this.timer.clear();
                }

                this.timer = later.setInterval(
                    () => {
                        this.setState({ isRefreshing: true });
                        setTimeout(() => { this.setState({ isRefreshing: false }); }, 1000);
                    },
                    sched
                );
            }
        }

        private onTextScheduleChanged(newValue: string) {
            this.webPartProps.textSchedule = newValue;
            this.onWebPartPropertiesChanged();
        }
    };

    interface AutoRefreshingWebPartState extends BaseWebPartState {
        isRefreshing: boolean;
    }

    interface AutoRefreshingWebPartProps {
        textSchedule: string;
    }
};

export { asAutoRefreshingWebPart };