import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import ReactHtmlParser from 'react-html-parser';
import { autobind } from 'office-ui-fabric-react/lib';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Modal } from 'office-ui-fabric-react/lib/Modal';

import { BaseWebPart, BaseWebPartState } from './BaseWebPart';
import MonacoEditor from '../monaco-editor';

@observer
export class ScriptEditorWebPart extends BaseWebPart<ScriptEditorWebPartProps, ScriptEditorWebPartState> {

    getDefaultWebPartProps() {
        return {
            htmlContent: "<div>Hello, world!</div>"
        }
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    public renderWebPartContent(props: ScriptEditorWebPartProps) {
        return (
            <div>{ReactHtmlParser(props.htmlContent)}</div>
        );
    }

    public renderWebPartSettings() {

        return (
            <div>
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
                            value={this.webPartProps.htmlContent}
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
            showScriptEditorModal: true
        });
    }

    @autobind
    protected hideScriptEditorModal() {
        this.setState({
            showScriptEditorModal: false
        });
    }

    @action.bound
    private onHtmlContentChanged(newHtmlContent: string) {
        this.webPartProps.htmlContent = newHtmlContent;
        super.onWebPartPropertiesChanged();
    }
}

export interface ScriptEditorWebPartState extends BaseWebPartState {
    showScriptEditorModal: boolean;
}

export interface ScriptEditorWebPartProps {
    htmlContent: string;
}