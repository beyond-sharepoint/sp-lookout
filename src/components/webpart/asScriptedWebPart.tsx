import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as bluebird from 'bluebird';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';
import { ComboBox, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { baristaScriptStoreUtils } from './baristaScriptStoreUtils';
import { BaseWebPart, BaseWebPartState } from './BaseWebPart';
import { FiddlesStore, Util } from '../../models';
import Barista from '../../services/barista/';

import { get, assign } from 'lodash';

const asScriptedWebPart = function <P extends object, S extends BaseWebPartState, WP extends BaseWebPart<P, S>>(barista: Barista, webPart: WP) {
    return class ScriptedWebPart extends BaseWebPart<ScriptedWebPartProps, ScriptedWebPartState> {
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

        async componentDidMount() {
            const result = await baristaScriptStoreUtils.performBaristaCall(
                barista,
                this.setState,
                this.webPartProps.scriptPath,
                this.webPartProps.scriptTimeout
            );

            if (result) {
                const propsToApply = get(result.data, this.webPartProps.resultPropertyPath);
                assign(this.webPartProps, propsToApply);
            }
        }

        renderWebPartContent(): JSX.Element {
            const { isBrewing, lastResultWasError, lastResult, lastProgress } = this.state;
            let loadingLabel = 'Loading...';

            if (lastProgress && lastProgress.data && lastProgress.data.message) {
                loadingLabel = lastProgress.data.message;
            }

            const WebPart = webPart as any;

            return (
                <div>
                    {isBrewing === true &&
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Spinner size={SpinnerSize.large} label={loadingLabel} ariaLive="assertive" />
                        </div>
                    }
                    {!isBrewing && lastResultWasError === true &&
                        <div>An error occurred: {JSON.stringify(lastResult)}</div>
                    }
                    {
                        !isBrewing && !lastResultWasError && typeof WebPart === 'function'
                            ? <WebPart
                                {...this.props}
                                disableChrome={true}
                            />
                            : !isBrewing && <div>Unexpected Error</div>
                    }
                </div>
            );
        }

        public renderWebPartSettings() {
            return (
                <div>
                    <ComboBox
                        label="Script Path:"
                        ariaLabel="Script Path"
                        allowFreeform={false}
                        autoComplete={'on'}
                        options={baristaScriptStoreUtils.getFileFolderOptions(barista)}
                        selectedKey={this.webPartProps.scriptPath}
                        onRenderOption={this.renderItem}
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
                        onValidate={this.onScriptTimeoutChanged}
                        onIncrement={this.onScriptTimeoutChanged}
                        onDecrement={this.onScriptTimeoutChanged}
                    />
                </div>
            );
        }

        private renderItem(option: IComboBoxOption) {
            return (
                <span>{(option as any).data.item.name}</span>
            );
        }

        private onScriptPathChanged(newValue: IComboBoxOption) {
            this.webPartProps.scriptPath = newValue.key as string;
            this.onWebPartPropertiesChanged();
        }

        private onResultPropertyPathChanged(newValue: string) {
            this.webPartProps.resultPropertyPath = newValue;
            this.onWebPartPropertiesChanged();
        }

        private onScriptTimeoutChanged(newValue: string) {
            this.webPartProps.scriptTimeout = parseInt(newValue, 10);
            this.onWebPartPropertiesChanged();
        }
    };

    interface ScriptedWebPartState extends BaseWebPartState {
        isBrewing: boolean;
        lastResultWasError?: boolean;
        lastResult?: any;
        lastProgress?: any;
    }

    interface ScriptedWebPartProps {
        scriptPath: string;
        resultPropertyPath: string;
        scriptTimeout: number;
    }
};

export { asScriptedWebPart };