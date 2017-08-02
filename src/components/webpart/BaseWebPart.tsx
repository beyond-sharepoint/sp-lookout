import * as React from 'react';
import { action, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { defaultsDeep, cloneDeep, pull } from 'lodash';

import { autobind } from 'office-ui-fabric-react/lib';
import { Panel, PanelType, IPanelProps } from 'office-ui-fabric-react/lib/Panel';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { ColorPicker } from 'office-ui-fabric-react/lib/ColorPicker';
import { IRenderFunction } from 'office-ui-fabric-react/lib/Utilities';

import { WebPartSettings } from '../../models';
import Barista from '../../services/barista';

import './index.css';

/**
 * Represents a component that renders a dynamic component on a Page
 */
export abstract class BaseWebPart<P extends object, S extends BaseWebPartState> extends React.Component<BaseWebPartProps, S> {
    protected disposed: boolean = false;

    public constructor(props: any) {
        super(props);

        if (!this.state) {
            (this.state as BaseWebPartState) = {
                showWebPartSettingsPanel: false
            };
        }

        const originalSetState = this.setState;
        this.setState = ((...args) => {
            if (this.disposed) {
                return;
            }
            originalSetState.apply(this, args);
        }).bind(this);
    }

    public get webPartProps(): P {
        return this.props.settings.props as P;
    }

    public componentWillMount() {
        this.initializeWebPartProperties(this.props);
    }

    public componentWillReceiveProps(nextProps: BaseWebPartProps) {
        this.initializeWebPartProperties(nextProps);
    }

    public componentWillUnmount() {
        this.disposed = true;
    }

    private renderWebPartTitle() {
        const { locked, settings, children } = this.props;

        return (
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
        );
    }

    public render() {
        const { locked, settings, children } = this.props;

        let containerStyle: React.CSSProperties = {};
        if (typeof this.getWebPartContainerStyle === 'function') {
            containerStyle = this.getWebPartContainerStyle() || {};
        }

        containerStyle.backgroundColor = settings.backgroundColor;

        if (this.props.disableChrome === true) {
            if (typeof this.renderWebPartContent === 'function') {
                return this.renderWebPartContent();
            }
            return null;
        }

        return (
            <div className="webpart-main">
                {locked && settings.chromeStyle === 'hiddenOnPageLocked'
                    ? null
                    : this.renderWebPartTitle()
                }
                <div className="webpart-container" style={containerStyle}>
                    {typeof this.renderWebPartContent === 'function' ? this.renderWebPartContent() : null}
                </div>
                <Panel
                    isOpen={this.state.showWebPartSettingsPanel}
                    type={PanelType.medium}
                    onDismiss={this.hideWebPartSettings}
                    onRenderFooterContent={this.renderWebPartSettingsFooter}
                    headerText="WebPart Settings"
                    className="web-part-settings"
                >
                    {this.renderBaseWebPartSettings()}
                </Panel>
            </div>
        );
    }

    public abstract getDefaultWebPartProps(): P | null;

    public abstract renderWebPartContent?(): JSX.Element | null;

    @autobind
    private renderBaseWebPartSettings(): JSX.Element {
        return (
            <div>
                <Pivot>
                    <PivotItem linkText="Base Web Part Settings">
                        <TextField label="WebPart Title" value={this.props.settings.title} onChanged={this.onWebPartTitleChanged} />
                        <Dropdown
                            label="WebPart Type"
                            selectedKey={this.props.settings.type}
                            onChanged={this.onWebPartTypeChanged}
                            options={this.props.webPartTypeOptions}
                        />
                        <Checkbox
                            label="Use Script"
                            checked={this.props.settings.attributes && this.props.settings.attributes.indexOf('useScript') > -1}
                            onChange={this.useScriptChanged}
                        />
                        <Checkbox
                            label="Auto Refresh"
                            checked={this.props.settings.attributes && this.props.settings.attributes.indexOf('autoRefresh') > -1}
                            onChange={this.autoRefreshChanged}
                        />
                    </PivotItem>
                    <PivotItem linkText="Settings">
                        {typeof this.renderWebPartSettings === 'function' ? this.renderWebPartSettings() : <i>No Settings</i>}
                    </PivotItem>
                    <PivotItem linkText="Appearance">
                        <ColorPicker
                            color={this.props.settings.backgroundColor || '#ccc'}
                            onColorChanged={this.updateBackgroundColor}
                        />
                        <Dropdown
                            label="Chrome Style"
                            selectedKey={this.props.settings.chromeStyle}
                            onChanged={this.updateChromeStyle}
                            options={[
                                { key: 'default', text: 'Default (visible)' },
                                { key: 'hiddenOnPageLocked', text: 'Hidden When Page Locked' }
                            ]}
                        />
                    </PivotItem>
                </Pivot>
            </div>
        );
    }

    public renderWebPartSettings?(): JSX.Element;

    @autobind
    protected renderWebPartSettingsFooter(props: IPanelProps): JSX.Element {
        return (
            <div>
                <DefaultButton
                    onClick={this.onDuplicateWebPart}
                    style={{ 'marginRight': '8px' }}
                >
                    Duplicate
                </DefaultButton>
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

    public getWebPartContainerStyle?(): React.CSSProperties | undefined;

    @autobind
    protected showWebPartSettings() {
        this.setState({
            showWebPartSettingsPanel: true
        });
    }

    @autobind
    protected hideWebPartSettings() {
        this.setState({
            showWebPartSettingsPanel: false
        });
    }

    @autobind
    private initializeWebPartProperties(props: BaseWebPartProps): void {
        if (typeof this.getDefaultWebPartProps !== 'function') {
            return;
        }

        const defaultProps = cloneDeep(this.getDefaultWebPartProps());

        if (typeof props.settings.props === 'undefined' || props.settings.props === null) {
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

    @autobind
    private onDuplicateWebPart() {
        if (typeof this.props.onDuplicateWebPart === 'function') {
            this.props.onDuplicateWebPart();
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
        (this.props.settings.type as any) = dropDownOption.key;
        this.initializeWebPartProperties(this.props);
        this.onWebPartPropertiesChanged(true);
    }

    @autobind
    protected useScriptChanged(ev: any, checked: boolean) {
        if (checked === true) {
            pull(this.props.settings.attributes, 'useScript');
            this.props.settings.attributes.push('useScript');
        } else {
            pull(this.props.settings.attributes, 'useScript');
        }

        this.onWebPartPropertiesChanged(true);
    }

    @autobind
    protected autoRefreshChanged(ev: any, checked: boolean) {
        if (checked === true) {
            pull(this.props.settings.attributes, 'autoRefresh');
            this.props.settings.attributes.push('autoRefresh');
        } else {
            pull(this.props.settings.attributes, 'autoRefresh');
        }

        this.onWebPartPropertiesChanged(true);
    }

    @autobind
    protected updateBackgroundColor(newColor: string) {
        this.props.settings.backgroundColor = newColor;

        this.onWebPartPropertiesChanged();
    }

    @autobind
    protected updateChromeStyle(dropDownOption: IDropdownOption) {
        this.props.settings.chromeStyle = dropDownOption.key as string;
        this.onWebPartPropertiesChanged();
    }

    @autobind
    protected onWebPartPropertiesChanged(volatile?: boolean) {
        if (typeof this.props.onWebPartPropertiesChanged === 'function') {
            this.props.onWebPartPropertiesChanged(volatile);
        }
    }
}

export interface BaseWebPartState {
    showWebPartSettingsPanel: boolean;
}

export interface BaseWebPartProps {
    barista?: Barista;
    locked: boolean;
    disableChrome?: boolean;
    settings: WebPartSettings;
    webPartTypeOptions: Array<IDropdownOption>;
    onWebPartPropertiesChanged?: (volatile?: boolean) => void;
    onDeleteWebPart?: () => void;
    onDuplicateWebPart?: () => void;
}