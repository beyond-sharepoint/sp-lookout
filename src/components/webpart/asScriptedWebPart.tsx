import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as bluebird from 'bluebird';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { ComboBox, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import MonacoEditor from '../monaco-editor';

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
            this.showScriptPropsEditorModal = this.showScriptPropsEditorModal.bind(this);
            this.hideScriptPropsEditorModal = this.hideScriptPropsEditorModal.bind(this);
            this.updateScriptPropsInEdit = this.updateScriptPropsInEdit.bind(this);
        }

        getDefaultWebPartProps() {
            return {
                scriptPath: '',
                resultPropertyPath: 'default',
                scriptTimeout: 5000,
                scriptProps: {}
            };
        }

        async componentDidMount() {
            const result = await baristaScriptStoreUtils.performBaristaCall(
                barista,
                this.setState,
                toJS(this.webPartProps.scriptPath),
                toJS(this.webPartProps.scriptTimeout),
                toJS(this.webPartProps.scriptProps),
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

            if (isBrewing) {
                return (
                    <div style={{ flex: '1 0 0%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spinner size={SpinnerSize.large} label={loadingLabel} ariaLive="assertive" />
                    </div>
                );
            }

            if (lastResultWasError) {
                return (
                    <div>An error occurred: {JSON.stringify(lastResult)}</div>
                );
            }

            const WebPart = webPart as any;

            if (typeof webPart !== 'function') {
                return (
                    <div>Unexpected Error</div>
                );
            }

            return (
                <WebPart
                    {...this.props}
                    disableChrome={true}
                />
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
                    <DefaultButton text="Edit Script Properties" onClick={this.showScriptPropsEditorModal} />
                    <Modal
                        isOpen={this.state.showScriptPropsEditorModal}
                        onDismiss={this.hideScriptPropsEditorModal}
                        isBlocking={true}
                        containerClassName="script-props-editor-web-part-modal-container"
                    >
                        <div className="script-props-editor-web-part-modal-header">
                            <span>Script Props Editor - Json Content</span>
                        </div>
                        <div className="script-editor-web-part-modal-body">
                            <MonacoEditor
                                value={this.state.scriptPropsInEdit}
                                language="json"
                                onChange={this.updateScriptPropsInEdit}
                                options={{
                                    automaticLayout: true,
                                    cursorBlinking: 'blink',
                                    folding: true,
                                    minimap: {
                                        enabled: false
                                    },
                                    readOnly: false,
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'off'
                                }}
                            />
                        </div>
                        <div className="script-editor-web-part-modal-footer">
                            <PrimaryButton text="OK" onClick={this.hideScriptPropsEditorModal} />
                        </div>
                    </Modal>
                </div>
            );
        }

        protected showScriptPropsEditorModal() {
            this.setState({
                showScriptPropsEditorModal: true,
                scriptPropsInEdit: JSON.stringify(this.webPartProps.scriptProps, null, 4)
            });
        }

        protected hideScriptPropsEditorModal() {
            try {
                this.webPartProps.scriptProps = observable(JSON.parse(this.state.scriptPropsInEdit));
            } catch (ex) {
                //Do nothing
            }
            super.onWebPartPropertiesChanged();

            this.setState({
                showScriptPropsEditorModal: false,
                scriptPropsInEdit: ''
            });
        }

        private updateScriptPropsInEdit(newValue: string) {
            this.setState({
                scriptPropsInEdit: newValue
            });
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
        showScriptPropsEditorModal: boolean;
        scriptPropsInEdit: string;
        lastResultWasError?: boolean;
        lastResult?: any;
        lastProgress?: any;
    }

    interface ScriptedWebPartProps {
        scriptPath: string;
        resultPropertyPath: string;
        scriptTimeout: number;
        scriptProps: any;
    }
};

export { asScriptedWebPart };