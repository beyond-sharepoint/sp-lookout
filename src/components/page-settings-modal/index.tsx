import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { IconCodes } from '@uifabric/styling';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ComboBox, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { ISelectableOption, SelectableOptionMenuItemType } from 'office-ui-fabric-react/lib/utilities/selectableOption/SelectableOption.Props';

import { startCase, sortBy } from 'lodash';

import { PagesStore, PageSettings } from '../../models';
import './index.css';

const iconOptions = sortBy(Object.keys(IconCodes).map((iconCode) => {
    return {
        key: iconCode,
        iconClass: startCase(iconCode).replace(/\s/g, ''),
        text: startCase(iconCode)
    };
}), ['text']);

@observer
export class PageSettingsModal extends React.Component<PageSettingsProps, any> {
    public render() {
        const {
            showPageSettingsModal,
            onDismiss,
            pagesStore,
            currentPage
        } = this.props;

        return (
            <Modal
                isOpen={showPageSettingsModal}
                onDismiss={onDismiss}
                isBlocking={false}
                containerClassName="page-settings-modal-container"
            >
                <div className="page-settings-modal-header">
                    <span>Page Settings</span>
                </div>
                <div className="page-settings-modal-body">
                    <Pivot>
                        <PivotItem linkText="Page Options">
                            <TextField
                                label="Name"
                                value={currentPage.name}
                                onChanged={this.updatePageName}
                            />
                            <ComboBox
                                defaultSelectedKey={currentPage.iconClassName}
                                label='Icon Class Name:'
                                selectedKey={currentPage.iconClassName}
                                ariaLabel='Icon Class Name'
                                allowFreeform={true}
                                autoComplete={true}
                                options={iconOptions}
                                onChanged={this.updateIconClassName}
                                onRenderOption={this.renderIconOption}
                            />
                            <TextField
                                label="Columns"
                                value={currentPage.columns.toString()}
                                onChanged={this.updateColumns}
                            />
                            <TextField
                                label="Row Height"
                                value={currentPage.rowHeight.toString()}
                                onChanged={this.updateRowHeight}
                            />
                        </PivotItem>
                    </Pivot>
                </div>
                <div className="page-settings-modal-footer">
                    {currentPage.id !== 'dashboard'
                        ? <PrimaryButton text="Delete Page" onClick={this.deletePage} style={{ backgroundColor: '#a80000' }} />
                        : null
                    }
                </div>
            </Modal>
        );
    }

    @action.bound
    private renderIconOption(item: ISelectableOption): JSX.Element {
        return (
            <span><i className={'ms-Icon ms-Icon--' + (item as any).iconClass}>&nbsp;{item.text}</i></span>
        );
    }

    @action.bound
    private updatePageName(newValue: string) {
        this.props.currentPage.name = newValue;
    }

    @action.bound
    private updateIconClassName(newValue: IComboBoxOption) {
        this.props.currentPage.iconClassName = newValue.key.toString() || '';
    }

    @action.bound
    private updateColumns(newValue: string) {
        this.props.currentPage.columns = parseInt(newValue, 10);
    }

    @action.bound
    private updateRowHeight(newValue: string) {
        this.props.currentPage.rowHeight = parseInt(newValue, 10);
    }

    @action.bound
    private deletePage(ev) {
        this.props.onDismiss(ev);
        this.props.onDeletePage(this.props.currentPage);
    }
}

export interface PageSettingsProps {
    showPageSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    onDeletePage: (currentPage: PageSettings) => void;
    pagesStore: PagesStore;
    currentPage: PageSettings;
}