import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get } from 'lodash';
import * as FileSaver from 'file-saver';

import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';
import { ComboBox, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { baristaScriptStoreUtils } from './baristaScriptStoreUtils';
import { BaseWebPart, BaseWebPartState } from './BaseWebPart';

@observer
export class DownloadButtonWebPart extends BaseWebPart<DownloadButtonWebPartProps, DownloadButtonWebPartState> {
    getDefaultWebPartProps() {
        return defaultDownloadButtonWebPartProps;
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    public renderWebPartContent() {
        const { isBrewing, lastResultWasError, lastResult, lastProgress } = this.state;
        let brewingLabel = 'Processing...';

        if (lastProgress && lastProgress.data && lastProgress.data.message) {
            brewingLabel = lastProgress.data.message;
        }

        return (
            <div>
                {!isBrewing &&
                    <PrimaryButton
                        disabled={!this.webPartProps.scriptPath}
                        text={this.webPartProps.buttonText}
                        onClick={this.performAction}
                    />
                }
                {isBrewing &&
                    <Spinner size={SpinnerSize.large} label={brewingLabel} ariaLive="assertive" />
                }
            </div>
        );
    }

    public renderWebPartSettings() {
        const { scriptPath } = this.webPartProps;

        return (
            <div>
                <TextField
                    label="Text to Display on Button"
                    value={this.webPartProps.buttonText}
                    onChanged={this.onButtonTextChanged}
                />
                <ComboBox
                    label="Script Path:"
                    ariaLabel="Script Path"
                    allowFreeform={false}
                    autoComplete={'on'}
                    options={baristaScriptStoreUtils.getFileFolderOptions(this.props.barista)}
                    selectedKey={scriptPath}
                    onRenderOption={this.renderItem}
                    onChanged={this.onScriptPathChanged}
                />
                <TextField
                    label="Result Property Path"
                    disabled={!scriptPath || scriptPath.length === 0}
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
                <TextField
                    label="Result File Name"
                    value={this.webPartProps.resultFileName}
                    onChanged={this.onResultFileNameChanged}
                />
            </div>
        );
    }

    private renderItem(option: IComboBoxOption) {
        return (
            <span>{(option as any).data.item.name}</span>
        );
    }

    @action.bound
    private async performAction() {
        if (!this.props.barista || !this.webPartProps.scriptPath) {
            return;
        }

        const result = await baristaScriptStoreUtils.performBaristaCall(
            this.props.barista,
            this.setState,
            this.webPartProps.scriptPath,
            this.webPartProps.scriptTimeout
        );

        if (result) {
            let resultToDownload = result.data;
            if (this.webPartProps.resultPropertyPath) {
                resultToDownload = get(resultToDownload, this.webPartProps.resultPropertyPath);
            }
            FileSaver.saveAs(new Blob([resultToDownload]), this.webPartProps.resultFileName);
        }
    }

    @action.bound
    private onButtonTextChanged(newValue: any) {
        this.webPartProps.buttonText = newValue;
        super.onWebPartPropertiesChanged();
    }

    @action.bound
    private onScriptPathChanged(newValue: IComboBoxOption, index: number, value: string) {
        this.webPartProps.scriptPath = newValue.key as string;
        super.onWebPartPropertiesChanged();
    }

    @action.bound
    private onResultPropertyPathChanged(newValue: string) {
        this.webPartProps.resultPropertyPath = newValue;
        this.onWebPartPropertiesChanged();
    }

    @action.bound
    private onScriptTimeoutChanged(newValue: string) {
        this.webPartProps.scriptTimeout = parseInt(newValue, 10);
        this.onWebPartPropertiesChanged();
    }

    @action.bound
    private onResultFileNameChanged(newValue: string) {
        this.webPartProps.resultFileName = newValue;
        this.onWebPartPropertiesChanged();
    }
}

export interface DownloadButtonWebPartState extends BaseWebPartState {
    isBrewing: boolean;
    lastResultWasError?: boolean;
    lastResult?: any;
    lastProgress?: any;
}

export interface DownloadButtonWebPartProps {
    scriptPath: string;
    scriptTimeout: number;
    resultPropertyPath: string;
    resultFileName: string;
    buttonText: string;
}

export const defaultDownloadButtonWebPartProps: DownloadButtonWebPartProps = {
    scriptPath: '',
    scriptTimeout: 5000,
    resultPropertyPath: 'default',
    resultFileName: 'output.json',
    buttonText: 'Perform Download Action'
};