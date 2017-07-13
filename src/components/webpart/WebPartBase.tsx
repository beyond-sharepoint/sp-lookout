import * as React from 'react';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { Panel, PanelType, IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { IRenderFunction } from 'office-ui-fabric-react/lib/Utilities';

import { WebPartSettings } from '../../models';

import './index.css';

/**
 * Represents a component that renders a dynamic component on a Page
 */
@observer
export class WebPartBase extends React.Component<WebPartProps, WebPartState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            showPanel: false
        }
    }

    public render() {
        const { locked, settings, children } = this.props;

        return (
            <div className="webpart-main">
                <div className="webpart-title">
                    <span className="webpart-title-text">
                        {settings.title}
                    </span>
                    {!locked ?
                        <span className="webpart-title-actions">
                            <span className="action" onClick={this.showWebPartSettings}>
                                <i className="ms-Icon ms-Icon--Settings" aria-hidden="true"></i>
                            </span>
                            <span className="action">
                                <i className="ms-Icon ms-Icon--ChromeClose" aria-hidden="true"></i>
                            </span>
                        </span>
                        : null
                    }
                </div>
                <div className="webpart-container">
                    {children}
                </div>
                <Panel
                    isOpen={this.state.showPanel}
                    type={PanelType.smallFixedFar}
                    onDismiss={this.hideWebPartSettings}
                    onRenderFooterContent={this.renderWebPartSettingsFooter}
                    headerText='WebPart Settings'
                >
                    {typeof this.renderWebPartSettings === 'function' ? this.renderWebPartSettings() : null}
                </Panel>
            </div>
        );
    }

    @autobind
    public renderWebPartSettings() {
        return (
            <div>
                <TextField label='WebPart Title' value={this.props.settings.title} onChanged={this.onWebPartTitleChanged} />
            </div>
        )
    }

    @autobind
    public renderWebPartSettingsFooter(props: IPanelProps) {
        return (
            <div>
                <PrimaryButton
                    onClick={this.hideWebPartSettings}
                    style={{ 'marginRight': '8px' }} >
                    Save
                </PrimaryButton>
                <DefaultButton
                    onClick={this.hideWebPartSettings}
                >
                    Cancel
                </DefaultButton>
            </div>
        );
    }

    @autobind
    private showWebPartSettings() {
        this.setState({
            showPanel: true
        });
    }

    @autobind
    private hideWebPartSettings() {
        this.setState({
            showPanel: false
        });
    }

    @autobind
    private onWebPartTitleChanged(newTitle: string) {
        this.props.settings.title = newTitle;
        this.onWebPartSettingsChanged();
    }

    @autobind
    private onWebPartSettingsChanged() {
        if (typeof this.props.onWebPartSettingsChanged === 'function') {
            this.props.onWebPartSettingsChanged();
        }
    }
}

export interface WebPartState {
    showPanel: boolean
}

export interface WebPartProps {
    locked: boolean
    settings: WebPartSettings,
    onWebPartSettingsChanged?: () => void;
}