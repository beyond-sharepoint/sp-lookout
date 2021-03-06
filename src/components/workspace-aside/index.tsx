import * as React from 'react';
import { matchPath } from 'react-router-dom';
import { IObservable, action, observable } from 'mobx';
import { observer } from 'mobx-react';
import { find, defaultsDeep } from 'lodash';

import { Nav, INavLinkGroup, INavLink } from 'office-ui-fabric-react/lib/Nav';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import { autobind, css } from 'office-ui-fabric-react/lib/Utilities';

import SplitPane from '../split-pane/SplitPane';
import { FolderView, Folder, File } from '../folder-view';

import {
    AppSettingsStore,
    PagesStore,
    PageSettings,
    ScriptsStore,
    ScriptFile,
    ScriptFolder,
    Util
} from '../../models';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    public render() {
        const {
            appSettingsStore,
            pagesStore,
            fiddlesStore,
            onFiddleSelected,
            onFolderSelected,
            selectedPageId,
            selectedPaths,
        } = this.props;

        let navLinks: Array<INavLink> = [];
        for (let page of pagesStore.pages) {
            const newNavLink: INavLink = this.createNavLinkFromPageSettings(page);
            navLinks.push(newNavLink);
        }

        const navGroups: Array<INavLinkGroup> = [
            {
                links: navLinks
            }
        ];

        const starredDivStyle: React.CSSProperties = {
        };

        if (fiddlesStore.starred.length > 0) {
            starredDivStyle.display = null;
            starredDivStyle.paddingBottom = '5px';
            starredDivStyle.overflowX = 'auto';
        }

        const pagesHeaderStyle: React.CSSProperties = {
            paddingLeft: 10,
            backgroundColor: '#f4f4f4',
            outline: 'none',
            display: 'flex',
            alignItems: 'center'
        };

        const addPageIconStyle: React.CSSProperties = {
            padding: '0 5px',
            cursor: 'pointer'
        };

        const addSubPageIconStyle: React.CSSProperties = {
            ...addPageIconStyle
        };

        if (!this.props.selectedPageId) {
            addSubPageIconStyle.color = 'grey';
        }

        return (
            <SplitPane
                split="horizontal"
                primaryPaneSize={appSettingsStore.appSettings.asidePrimaryPaneHeight}
                primaryPaneMinSize={250}
                onPaneResized={this.onPaneResized}
                onResizerDoubleClick={(paneStyle, e, splitPane) => {
                    if (paneStyle.flexBasis === '60%') {
                        this.onPaneResized(splitPane.calculateMaxSize());
                    } else {
                        this.onPaneResized('60%');
                    }
                }}
            >
                <div className="pages ms-fontColor-themePrimary" style={{ maxHeight: '100%' }}>
                    <div className="pagesHeader" style={pagesHeaderStyle}>
                        <span className="fa fa-th" aria-hidden="true" style={{ paddingRight: '3px' }} />
                        <span>Pages</span>
                        <div style={{ marginLeft: 'auto' }}>
                            <span style={addPageIconStyle} onClick={this.onAddPage} title="Add Page">
                                <i className="fa fa-plus-circle" aria-hidden="true" />
                            </span>
                            {/* <span style={addSubPageIconStyle} onClick={this.onAddSubPage} title="Add Sub Page">
                                    <i className="fa fa-level-down" aria-hidden="true" />
                                </span> */}
                        </div>
                    </div>
                    <div style={{ flex: '1 1 auto', overflow: 'auto' }}>
                        <Nav
                            className="aside"
                            groups={navGroups}
                            selectedKey={selectedPageId}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 0%' }}>
                    {fiddlesStore.starred.length > 0 &&
                        <div style={starredDivStyle}>
                            {fiddlesStore.starred.map((fiddleSettings, index) => {
                                return (
                                    <div key={index} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => onFiddleSelected(fiddleSettings, this.props.fiddlesStore.getPathForFiddleSettings(fiddleSettings) || '')}>
                                        <span style={{ color: 'orange', paddingLeft: '5px', paddingRight: '5px' }}>
                                            <i className="fa fa-star" aria-hidden="true" />
                                        </span>{fiddleSettings.name}
                                    </div>
                                );
                            })
                            }
                        </div>
                    }
                    <FolderView
                        folder={fiddlesStore.fiddleRootFolder as Folder}
                        onFileSelected={onFiddleSelected}
                        onFolderSelected={onFolderSelected}
                        onAddFile={this.onAddFile}
                        onAddFolder={this.onAddFolder}
                        onDeleteFile={this.onDeleteFile}
                        onDeleteFolder={this.onDeleteFolder}
                        onChange={this.onFiddleChange}
                        selectedPaths={selectedPaths}
                    />
                </div>
            </SplitPane>
        );
    }

    private createNavLinkFromPageSettings(page: PageSettings): INavLink {
        let newNavLink: INavLink = {
            key: page.id,
            name: page.name,
            isExpanded: page.isExpanded,
            icon: page.iconClassName,
            url: '#/pages/' + page.id,
            onClick: this.props.onPageSelected
        };

        newNavLink.links = [];
        for (let subPage of page.subPages) {
            newNavLink.links.push(this.createNavLinkFromPageSettings(subPage));
        }

        return newNavLink;
    }

    @autobind
    private onPaneResized(newSize: number | string) {
        this.props.appSettingsStore.appSettings.asidePrimaryPaneHeight = newSize;
    }

    @action.bound
    private onAddPage() {
        const newPageSettings: PageSettings = new PageSettings('New Page');

        this.props.pagesStore.pages.push(newPageSettings);
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @action.bound
    private onAddSubPage() {
        if (!this.props.selectedPageId) {
            return;
        }

        const newPageSettings: PageSettings = new PageSettings('New Sub Page');

        let selectedPage = this.props.pagesStore.getPageSettings(this.props.selectedPageId);
        if (!selectedPage) {
            return;
        }
        selectedPage.subPages.push(observable(newPageSettings));
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @autobind
    private onFiddleChange() {
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onAddFile(targetFolder: Folder) {
        let newFileName = 'newFile.ts';
        let ix = 0;
        while (find(targetFolder.files, { name: newFileName })) {
            newFileName = `newFile-${String('00' + ++ix).slice(-2)}.ts`;
        }

        let newFile = new ScriptFile();
        newFile.name = newFileName;

        targetFolder.collapsed = false;
        targetFolder.files.push(newFile as File);
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onAddFolder(targetFolder: Folder) {
        let newFolderName = 'newFolder';
        let ix = 0;
        while (find(targetFolder.folders, { name: newFolderName })) {
            newFolderName = `new-folder-${String('00' + ++ix).slice(-2)}`;
        }

        let newFolder = new ScriptFolder();
        newFolder.name = newFolderName;

        targetFolder.collapsed = false;
        targetFolder.folders.push(newFolder as Folder);
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onDeleteFile(targetFolder: Folder, targetFile: File) {
        const targetIndex = targetFolder.files.indexOf(targetFile);
        if (targetIndex < 0) {
            return;
        }

        targetFolder.files.splice(targetIndex, 1);
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onDeleteFolder(parentFolder: Folder, targetFolder: Folder) {
        const targetIndex = parentFolder.folders.indexOf(targetFolder);
        if (targetIndex < 0) {
            return;
        }

        parentFolder.folders.splice(targetIndex, 1);
        ScriptsStore.saveToLocalStorage(this.props.fiddlesStore);
    }
}

export interface AsideProps {
    appSettingsStore: AppSettingsStore;
    pagesStore: PagesStore;
    fiddlesStore: ScriptsStore;
    onPageSelected: (ev?: React.MouseEvent<HTMLElement>, item?: INavLink) => void;
    onFolderSelected: (folder: ScriptFolder, path: string) => void;
    onFiddleSelected: (settings: ScriptFile, path: string) => void;
    selectedPageId?: string;
    selectedPaths?: string | string[];
}