import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { BaseWebPart, BaseWebPartState } from './BaseWebPart'
import { Util } from '../../models';
import Barista from '../../services/barista/';

import { get } from 'lodash';

export function asScriptedWebPart<P extends object, S extends BaseWebPartState, WP extends BaseWebPart<P, S>>(barista: Barista, webPart: WP) {
    return class ScriptedWebPart extends BaseWebPart<ScriptedWebPartProps, ScriptedWebPartState> {
        private _innerWebPart: WP;

        public constructor(props) {
            super(props);

            this._innerWebPart = new (webPart as any)();
            this.onScriptPathChanged = this.onScriptPathChanged.bind(this);
        }

        getDefaultWebPartProps() {
            return {
                scriptPath: '',
                resultPropertyPath: 'default',
                scriptTimeout: 5000,
                innerProps: this._innerWebPart.getDefaultWebPartProps(),
            };
        }

        componentDidMount() {
            if (typeof super.componentDidMount === 'function') {
                super.componentDidMount();
            }

            this.setState({
                isLoading: true
            });

            barista.brew({
                fullPath: this.webPartProps.scriptPath,
                allowDebuggerStatement: false,
                timeout: this.webPartProps.scriptTimeout
            }).then((result) => {
                this.webPartProps.innerProps = get(result.data, this.webPartProps.resultPropertyPath);
                this.setState({
                    lastResultWasError: false,
                    lastResult: result.data
                });
            }, (err) => {
                this.setState({
                    lastResultWasError: true,
                    lastResult: err
                });
            }).then(() => {
                this.setState({
                    isLoading: false
                });
            });
        }

        renderWebPartContent(props: ScriptedWebPartProps): JSX.Element {
            const { isLoading } = this.state;

            if (isLoading) {
                return (
                    <span>Loading...</span>
                );
            }

            if (typeof this._innerWebPart.renderWebPartContent === 'function') {
                return this._innerWebPart.renderWebPartContent(props.innerProps);
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
        innerProps: P | null;
    }
}