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

import { WebPartSettings } from '../../models';

import './index.css';

/**
 * Represents a component that renders a dynamic component on a Page
 */
export abstract class BaseWebPart<P extends object, S extends BaseWebPartState> extends React.Component<BaseWebPartProps, S> {
    public constructor(props: BaseWebPartProps) {
        super(props);

        if (!this.state) {
            (this.state as BaseWebPartState) = {
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

    public componentWillReceiveProps(nextProps: BaseWebPartProps) {
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
                    {this.renderBaseWebPartSettings()}
                    {typeof this.renderWebPartSettings === 'function' ? this.renderWebPartSettings() : null}
                </Panel>
            </div>
        );
    }

    protected abstract getDefaultWebPartProps(): P;

    protected abstract renderWebPartContent?(webPartProps: P): JSX.Element;

    @autobind
    private renderBaseWebPartSettings(): JSX.Element {
        return (
            <div>
                <TextField label="WebPart Title" value={this.props.settings.title} onChanged={this.onWebPartTitleChanged} />
                <Dropdown
                    label="WebPart Type"
                    selectedKey={this.props.settings.type}
                    onChanged={this.onWebPartTypeChanged}
                    options={this.props.webPartTypeNames}
                />
            </div>
        );
    }

    protected renderWebPartSettings?(): JSX.Element

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
    private initializeWebPartProperties(props: BaseWebPartProps) {
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
        this.onWebPartPropertiesChanged();
    }

    @action.bound
    private onWebPartTitleChanged(newTitle: string) {
        this.props.settings.title = newTitle;
        this.onWebPartPropertiesChanged();
    }

    @action.bound
    private onWebPartTypeChanged(dropDownOption: IDropdownOption) {
        console.dir(dropDownOption);
        (this.props.settings.type as any) = dropDownOption.key;
        this.props.settings.props = this.initializeWebPartProperties(this.props);
        this.onWebPartPropertiesChanged();
    }

    @autobind
    protected onWebPartPropertiesChanged() {
        if (typeof this.props.onWebPartSettingsChanged === 'function') {
            this.props.onWebPartSettingsChanged();
        }
    }
}

export interface BaseWebPartState {
    showPanel: boolean;
}

export interface BaseWebPartProps {
    locked: boolean;
    settings: WebPartSettings;
    webPartTypeNames: Array<{ key: string, text: string}>;
    onWebPartSettingsChanged?: () => void;
    onDeleteWebPart?: () => void;
}