import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { get, set } from 'lodash';

import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { PagesStore, PageSettings } from '../../models';
import './index.css';

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
                            <TextField
                                label="Icon Class Name"
                                value={currentPage.iconClassName}
                                onChanged={this.updateIconClassName}
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
            </Modal>
        );
    }

    @action.bound
    private updatePageName(newValue: string) {
        this.props.currentPage.name = newValue;
    }

    @action.bound
    private updateIconClassName(newValue: string) {
        this.props.currentPage.iconClassName = newValue;
    }

    @action.bound
    private updateColumns(newValue: string) {
        this.props.currentPage.columns = parseInt(newValue);
    }

    @action.bound
    private updateRowHeight(newValue: string) {
        this.props.currentPage.rowHeight = parseInt(newValue);
    }
}

export interface PageSettingsProps {
    showPageSettingsModal: boolean;
    onDismiss: (ev?: React.MouseEvent<HTMLButtonElement>) => any;
    pagesStore: PagesStore;
    currentPage: PageSettings;
}