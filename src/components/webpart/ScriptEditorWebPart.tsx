import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import ReactHtmlParser from 'react-html-parser';
import { autobind } from 'office-ui-fabric-react/lib';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Modal } from 'office-ui-fabric-react/lib/Modal';

import { BaseWebPart, BaseWebPartState } from './BaseWebPart';
import MonacoEditor from '../monaco-editor';

@observer
export class ScriptEditorWebPart extends BaseWebPart<ScriptEditorWebPartProps, ScriptEditorWebPartState> {
    private _rootDiv;

    getDefaultWebPartProps() {
        return {
            htmlContent: '<div>Hello, world!</div>',
            rootStyle: '',
            rootClass: ''
        };
    }

    componentDidMount() {
        if (this.webPartProps.rootStyle) {
            this._rootDiv.setAttribute('style', this.webPartProps.rootStyle);
        }
    }

    componentDidUpdate() {
        if (this.webPartProps.rootStyle) {
            this._rootDiv.setAttribute('style', this.webPartProps.rootStyle);
        }
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    public renderWebPartContent() {
        return (
            <div ref={(e) => this._rootDiv = e} className={this.webPartProps.rootClass || undefined}>{ReactHtmlParser(this.webPartProps.htmlContent)}</div>
        );
    }

    public renderWebPartSettings() {

        return (
            <div>
                <TextField label="Root Class" value={this.webPartProps.rootClass} onChanged={this.onRootClassChanged} />
                <TextField label="Root Style" value={this.webPartProps.rootStyle} onChanged={this.onRootStyleChanged} />
                <DefaultButton text="Edit Html Content" onClick={this.showScriptEditorModal} />
                <Modal
                    isOpen={this.state.showScriptEditorModal}
                    onDismiss={this.hideScriptEditorModal}
                    isBlocking={true}
                    containerClassName="script-editor-web-part-modal-container"
                >
                    <div className="script-editor-web-part-modal-header">
                        <span>Script Editor - Html Content</span>
                    </div>
                    <div className="script-editor-web-part-modal-body">
                        <MonacoEditor
                            value={this.state.htmlContentInEdit}
                            language="html"
                            onChange={this.onHtmlContentChanged}
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
                        <PrimaryButton text="OK" onClick={this.hideScriptEditorModal} />
                    </div>
                </Modal>
            </div>
        );
    }

    @autobind
    protected showScriptEditorModal() {
        this.setState({
            showScriptEditorModal: true,
            htmlContentInEdit: this.webPartProps.htmlContent
        });
    }

    @autobind
    protected hideScriptEditorModal() {
        this.webPartProps.htmlContent = this.state.htmlContentInEdit;
        super.onWebPartPropertiesChanged();

        this.setState({
            showScriptEditorModal: false,
            htmlContentInEdit: ''
        });
    }

    @action.bound
    private onHtmlContentChanged(newHtmlContent: string) {
        this.setState({
            htmlContentInEdit: newHtmlContent
        });
    }

    @action.bound
    private onRootClassChanged(newValue: string) {
        this.webPartProps.rootClass = newValue;
        super.onWebPartPropertiesChanged();
    }

    @action.bound
    private onRootStyleChanged(newValue: string) {
        this.webPartProps.rootStyle = newValue;
        super.onWebPartPropertiesChanged();
    }
}

export interface ScriptEditorWebPartState extends BaseWebPartState {
    showScriptEditorModal: boolean;
    htmlContentInEdit: string;
}

export interface ScriptEditorWebPartProps {
    htmlContent: string;
    rootStyle: string;
    rootClass: string;
}