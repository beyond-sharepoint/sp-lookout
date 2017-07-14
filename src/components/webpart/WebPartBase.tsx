import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { Panel, PanelType, IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { IRenderFunction } from 'office-ui-fabric-react/lib/Utilities';

import { WebPartSettings, WebPartType } from '../../models';

import './index.css';

/**
 * Represents a component that renders a dynamic component on a Page
 */
@observer
export class WebPartBase extends React.Component<WebPartProps, WebPartState & any> {
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
                            <span className="action" onClick={this.onToggleLock} title="Lock/Unlock WebPart">
                                <i className={`ms-Icon ms-Icon--${settings.locked ? 'Lock' : 'Unlock'}`} aria-hidden="true"></i>
                            </span>
                            <span className="action" onClick={this.showWebPartSettings} title="Show WebPart Settings">
                                <i className="ms-Icon ms-Icon--Settings" aria-hidden="true"></i>
                            </span>
                            <span className="action" onClick={this.onDeleteWebPart} title="Delete WebPart">
                                <i className="ms-Icon ms-Icon--ChromeClose" aria-hidden="true"></i>
                            </span>
                        </span>
                        : null
                    }
                </div>
                <div className="webpart-container">
                    {typeof this.renderWebPartContent === 'function' ? this.renderWebPartContent(settings.props || {}) : null}
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
    public renderWebPartContent(webPartProps: any): JSX.Element {
        return (
            <span>{webPartProps.text}</span>
        )
    }

    public renderWebPartSettings() {
        return (
            <div>
                <TextField label='WebPart Title' value={this.props.settings.title} onChanged={this.onWebPartTitleChanged} />
                <Dropdown
                    label='WebPart Type'
                    selectedKey={WebPartType[this.props.settings.type]}
                    onChanged={this.onWebPartTypeChanged}
                    options={
                        [
                            { key: 'clock', text: 'Clock' },
                            { key: 'note', text: 'Note' },
                            { key: 'text', text: 'Text' }
                        ]
                    }
                />
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
    public showWebPartSettings() {
        this.setState({
            showPanel: true
        });
    }

    @autobind
    public hideWebPartSettings() {
        this.setState({
            showPanel: false
        });
    }

    @action.bound
    private onWebPartTitleChanged(newTitle: string) {
        this.props.settings.title = newTitle;
        this.onWebPartSettingsChanged();
    }

    @action.bound
    private onWebPartTypeChanged(dropDownOption: IDropdownOption) {
        this.props.settings.type = WebPartType[dropDownOption.key];
        this.onWebPartSettingsChanged();
    }

    @action.bound
    private onToggleLock() {
        this.props.settings.locked = !this.props.settings.locked;
        this.onWebPartSettingsChanged();
    }

    @autobind
    public onWebPartSettingsChanged() {
        if (typeof this.props.onWebPartSettingsChanged === 'function') {
            this.props.onWebPartSettingsChanged();
        }
    }

    @autobind
    private onDeleteWebPart() {
        if (typeof this.props.onDeleteWebPart === 'function') {
            this.props.onDeleteWebPart();
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
    onDeleteWebPart?: () => void;
}