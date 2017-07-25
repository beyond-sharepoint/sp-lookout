import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';

import { BaseWebPart, BaseWebPartState } from './BaseWebPart'
import { Util } from '../../models';
import Barista from '../../services/barista/';

import { get, assign } from 'lodash';

export function asScriptedWebPart<P extends object, S extends BaseWebPartState, WP extends BaseWebPart<P, S>>(barista: Barista, webPart: WP) {
    return class ScriptedWebPart extends BaseWebPart<ScriptedWebPartProps, ScriptedWebPartState> {
        private _innerWebPart;

        public constructor(props: ScriptedWebPartProps) {
            super(props);

            this.onScriptPathChanged = this.onScriptPathChanged.bind(this);
            this.onResultPropertyPathChanged = this.onResultPropertyPathChanged.bind(this);
            this.onScriptTimeoutChanged = this.onScriptTimeoutChanged.bind(this);
        }

        getDefaultWebPartProps() {
            return {
                scriptPath: '',
                resultPropertyPath: 'default',
                scriptTimeout: 5000
            };
        }

        componentDidMount() {
            this.setState({
                isLoading: true
            });

            if (barista) {
                barista.brew({
                    fullPath: this.webPartProps.scriptPath,
                    allowDebuggerStatement: false,
                    timeout: this.webPartProps.scriptTimeout
                }).then((result) => {
                    const propsToApply = get(result.data, this.webPartProps.resultPropertyPath);
                    assign(this.webPartProps, propsToApply);
                    this.setState({
                        lastResultWasError: false,
                        lastResult: result.data
                    });
                }, (err) => {
                    this.setState({
                        lastResultWasError: true,
                        lastResult: err.message
                    });
                }).then(() => {
                    this.setState({
                        isLoading: false
                    });
                });
            } else {
                this.setState({
                    isLoading: false,
                    lastResultWasError: true,
                    lastResult: 'Could not establish connection with SharePoint. Ensure that a tenant url has been specified.'
                });
            }

        }

        renderWebPartContent(): JSX.Element {
            const { isLoading, lastResultWasError, lastResult } = this.state;

            if (isLoading) {
                return (
                    <div>Loading...</div>
                );
            }

            if (lastResultWasError === true) {
                return (
                    <div>An error occurred: {JSON.stringify(lastResult)}</div>
                );
            }

            const WebPart = webPart as any;

            if (typeof WebPart === 'function') {
                return (
                    <WebPart
                        {...this.props}
                        disableChrome={true}
                    />
                )
            }

            return (
                <div>Unexpected Error</div>
            );
        }

        public renderWebPartSettings() {
            return (
                <div>
                    <TextField label="Fiddle Path" value={this.webPartProps.scriptPath} onChanged={this.onScriptPathChanged} />
                    <TextField label="Result Property Path" value={this.webPartProps.resultPropertyPath} onChanged={this.onResultPropertyPathChanged} />
                    <SpinButton
                        label="Script Timeout"
                        min={0}
                        max={600000}
                        step={1}
                        value={this.webPartProps.scriptTimeout.toString()}
                        onIncrement={this.onScriptTimeoutChanged}
                        onDecrement={this.onScriptTimeoutChanged}
                    />
                </div>
            );
        }

        private onScriptPathChanged(newValue: string) {
            this.webPartProps.scriptPath = newValue;
            super.onWebPartPropertiesChanged();
        }

        private onResultPropertyPathChanged(newValue: string) {
            this.webPartProps.resultPropertyPath = newValue;
            super.onWebPartPropertiesChanged();
        }

        private onScriptTimeoutChanged(newValue: string) {
            this.webPartProps.scriptTimeout = parseInt(newValue);
            super.onWebPartPropertiesChanged();
        }
    }

    interface ScriptedWebPartState extends BaseWebPartState {
        isLoading: boolean;
        lastResultWasError?: boolean;
        lastResult?: any;
    }

    interface ScriptedWebPartProps {
        scriptPath: string;
        resultPropertyPath: string;
        scriptTimeout: number;
    }
}