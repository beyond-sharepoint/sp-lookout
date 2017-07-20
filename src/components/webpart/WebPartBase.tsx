import * as React from 'react';
import { action, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { Panel, PanelType, IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { IRenderFunction } from 'office-ui-fabric-react/lib/Utilities';
import { defaultsDeep, cloneDeep } from 'lodash';

import { WebPartSettings, WebPartType } from '../../models';

import './index.css';

export const webPartTypeNames = [
    { key: 'chart', text: 'Chart' },
    { key: 'clock', text: 'Clock' },
    { key: 'note', text: 'Note' },
    { key: 'text', text: 'Text' }
];

/**
 * Represents a component that renders a dynamic component on a Page
 */
export abstract class WebPartBase<P extends object, S extends WebPartState> extends React.Component<WebPartProps, S> {
    public constructor(props: WebPartProps) {
        super(props);

        if (!this.state) {
            (this.state as WebPartState) = {
                showPanel: false
            };
        }
    }

    public get webPartProps(): P {
        return this.props.settings.props;
    }

    public componentWillMount() {
        this.initializeWebPartProperties(this.props);
    }

    public componentWillReceiveProps(nextProps: WebPartProps) {
        this.initializeWebPartProperties(nextProps);
    }

    public render() {
        const { locked, settings, children } = this.props;

        let containerStyle: React.CSSProperties | undefined = undefined;
        if (typeof this.getWebPartContainerStyle === 'function') {
            containerStyle = this.getWebPartContainerStyle();
        }

        return (
            <div className="webpart-main">
                <div className="webpart-title">
                    <span className="webpart-title-text">
                        {settings.title}
                    </span>
                    {!locked ?
                        <span className="webpart-title-actions">
                            <span className="action" onClick={this.onToggleLock} title="Lock/Unlock WebPart">
                                <i className={`ms-Icon ms-Icon--${settings.locked ? 'Lock' : 'Unlock'}`} aria-hidden="true" />
                            </span>
                            {!settings.locked ?
                                <span className="action" onClick={this.showWebPartSettings} title="Show WebPart Settings">
                                    <i className="ms-Icon ms-Icon--Settings" aria-hidden="true" />
                                </span>
                                : null
                            }
                            {!settings.locked ?
                                <span className="action" onClick={this.onDeleteWebPart} title="Delete WebPart">
                                    <i className="ms-Icon ms-Icon--ChromeClose" aria-hidden="true" />
                                </span>
                                : null
                            }
                        </span>
                        : null
                    }
                </div>
                <div className="webpart-container" style={containerStyle}>
                    {typeof this.renderWebPartContent === 'function' ? this.renderWebPartContent(settings.props || {}) : null}
                </div>
                <Panel
                    isOpen={this.state.showPanel}
                    type={PanelType.smallFixedFar}
                    onDismiss={this.hideWebPartSettings}
                    onRenderFooterContent={this.renderWebPartSettingsFooter}
                    headerText="WebPart Settings"
                >
                    {typeof this.renderWebPartSettings === 'function' ? this.renderWebPartSettings() : null}
                </Panel>
            </div>
        );
    }

    protected abstract getDefaultWebPartProps(): P;

    protected abstract renderWebPartContent?(webPartProps: P): JSX.Element;

    @autobind
    protected renderWebPartSettings(): JSX.Element {
        return (
            <div>
                <TextField label="WebPart Title" value={this.props.settings.title} onChanged={this.onWebPartTitleChanged} />
                <Dropdown
                    label="WebPart Type"
                    selectedKey={WebPartType[this.props.settings.type]}
                    onChanged={this.onWebPartTypeChanged}
                    options={webPartTypeNames}
                />
            </div>
        );
    }

    @autobind
    protected renderWebPartSettingsFooter(props: IPanelProps): JSX.Element {
        return (
            <div>
                <PrimaryButton
                    onClick={this.hideWebPartSettings}
                    style={{ 'marginRight': '8px' }}
                >
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

    protected getWebPartContainerStyle?(): React.CSSProperties | undefined;

    @autobind
    protected showWebPartSettings() {
        this.setState({
            showPanel: true
        });
    }

    @autobind
    protected hideWebPartSettings() {
        this.setState({
            showPanel: false
        });
    }

    @autobind
    private initializeWebPartProperties(props: WebPartProps) {
        if (typeof this.getDefaultWebPartProps !== 'function') {
            return;
        }

        const defaultProps = cloneDeep(this.getDefaultWebPartProps());

        if (typeof props.settings.props === 'undefined') {
            props.settings.props = observable(defaultProps);
        } else {
            props.settings.props = observable(defaultsDeep(props.settings.props, defaultProps));
        }
    }

    @autobind
    private onDeleteWebPart() {
        if (typeof this.props.onDeleteWebPart === 'function') {
            this.props.onDeleteWebPart();
        }
    }

    @action.bound
    private onToggleLock() {
        this.props.settings.locked = !this.props.settings.locked;
        this.onWebPartSettingsChanged();
    }

    @action.bound
    private onWebPartTitleChanged(newTitle: string) {
        this.props.settings.title = newTitle;
        this.onWebPartSettingsChanged();
    }

    @action.bound
    private onWebPartTypeChanged(dropDownOption: IDropdownOption) {
        this.props.settings.type = WebPartType[dropDownOption.key];
        this.props.settings.props = this.initializeWebPartProperties(this.props);
        this.onWebPartSettingsChanged();
    }

    @autobind
    protected onWebPartSettingsChanged() {
        if (typeof this.props.onWebPartSettingsChanged === 'function') {
            this.props.onWebPartSettingsChanged();
        }
    }
}

export interface WebPartState {
    showPanel: boolean;
}

export interface WebPartProps {
    locked: boolean;
    settings: WebPartSettings;
    onWebPartSettingsChanged?: () => void;
    onDeleteWebPart?: () => void;
}