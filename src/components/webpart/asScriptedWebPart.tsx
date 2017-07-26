import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as bluebird from 'bluebird';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';
import { ComboBox, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { ISelectableOption, SelectableOptionMenuItemType } from 'office-ui-fabric-react/lib/utilities/selectableOption/SelectableOption.Props';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { BaseWebPart, BaseWebPartState } from './BaseWebPart';
import { FiddlesStore, Util } from '../../models';
import Barista from '../../services/barista/';

import { get, assign } from 'lodash';

export function asScriptedWebPart<P extends object, S extends BaseWebPartState, WP extends BaseWebPart<P, S>>(barista: Barista, webPart: WP) {
    return class ScriptedWebPart extends BaseWebPart<ScriptedWebPartProps, ScriptedWebPartState> {
        private _innerWebPart;
        private _disposed = false;

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

                const onProgress = (progress: any) => {
                    if (this._disposed) {
                        return;
                    }

                    this.setState({
                        lastProgress: progress
                    });
                };

                barista.brew({
                    fullPath: this.webPartProps.scriptPath,
                    allowDebuggerStatement: false,
                    timeout: this.webPartProps.scriptTimeout
                })
                    .then(
                    (result) => {
                        if (this._disposed) {
                            return;
                        }
                        const propsToApply = get(result.data, this.webPartProps.resultPropertyPath);
                        assign(this.webPartProps, propsToApply);
                        this.setState({
                            lastResultWasError: false,
                            lastResult: result.data
                        });
                    })
                    .catch(err => {
                        if (this._disposed) {
                            return;
                        }
                        this.setState({
                            lastResultWasError: true,
                            lastResult: err.message
                        });
                    })
                    .then(() => {
                        if (this._disposed) {
                            return;
                        }
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

        componentWillUnmount() {
            this._disposed = true;
        }

        renderWebPartContent(): JSX.Element {
            const { isLoading, lastResultWasError, lastResult, lastProgress } = this.state;
            let loadingLabel = 'Loading...';

            if(typeof lastProgress === 'string') {
                loadingLabel = lastProgress;
            }

            if (isLoading) {
                return (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spinner size={SpinnerSize.large} label='Loading...' ariaLive='assertive' />
                    </div>
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
                );
            }

            return (
                <div>Unexpected Error</div>
            );
        }

        private getFileFolderOptions() {
            const fileFolders = FiddlesStore.getFileFolderMap(barista.fiddlesStore.fiddleRootFolder);
            const fileOptions: Array<any> = [];
            const paths = Object.keys(fileFolders).sort();
            for (const path of paths) {
                const fileFolder = fileFolders[path];
                if (fileFolder.type === 'folder') {
                    fileOptions.push({
                        key: path,
                        text: path,
                        itemType: SelectableOptionMenuItemType.Header
                    });
                } else {
                    fileOptions.push({
                        key: path,
                        text: fileFolder.item.name
                    });
                }
            }
            return fileOptions;
        }

        public renderWebPartSettings() {
            return (
                <div>
                    <ComboBox
                        label='Fiddle Path:'
                        ariaLabel='Fiddle Path'
                        allowFreeform={false}
                        autoComplete={'on'}
                        options={this.getFileFolderOptions()}
                        value={this.webPartProps.scriptPath}
                        onChanged={this.onScriptPathChanged}
                    />
                    <TextField
                        label="Result Property Path"
                        disabled={!this.webPartProps.scriptPath || this.webPartProps.scriptPath.length === 0}
                        value={this.webPartProps.resultPropertyPath}
                        onChanged={this.onResultPropertyPathChanged}
                    />
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

        private onScriptPathChanged(newValue: IComboBoxOption) {
            this.webPartProps.scriptPath = newValue.key as string;
            super.onWebPartPropertiesChanged();
        }

        private onResultPropertyPathChanged(newValue: string) {
            this.webPartProps.resultPropertyPath = newValue;
            super.onWebPartPropertiesChanged();
        }

        private onScriptTimeoutChanged(newValue: string) {
            this.webPartProps.scriptTimeout = parseInt(newValue, 10);
            super.onWebPartPropertiesChanged();
        }
    };

    interface ScriptedWebPartState extends BaseWebPartState {
        isLoading: boolean;
        lastResultWasError?: boolean;
        lastResult?: any;
        lastProgress?: any;
    }

    interface ScriptedWebPartProps {
        scriptPath: string;
        resultPropertyPath: string;
        scriptTimeout: number;
    }
}