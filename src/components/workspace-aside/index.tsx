import * as React from 'react';
import { matchPath } from 'react-router-dom';
import { IObservable, action, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Nav, INavLinkGroup, INavLink } from 'office-ui-fabric-react/lib/Nav';
import { autobind } from 'office-ui-fabric-react/lib';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import { find } from 'lodash';
import SplitPane from '../split-pane/SplitPane';
import { FolderView, IFolder, IFile } from '../folder-view';

import { SettingsStore, PagesStore, FiddlesStore, FiddleSettings, FiddleFolder, defaultFiddleSettings, defaultFiddleFolder } from '../../models';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    public render() {
        const {
            settingsStore,
            pagesStore,
            fiddlesStore,
            onFiddleSelected,
            onFolderSelected,
            selectedPageId,
            selectedPaths,
        } = this.props;

        let navLinks: Array<INavLink> = [];
        for (let page of pagesStore.pages) {
            navLinks.push({
                key: page.id,
                name: page.name,
                icon: page.iconClassName,
                url: '#/pages/' + page.id,
                onClick: () => { /* Without a click handler, the icon isn't rendered. nice, guys. */ }
            });
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

        return (
            <SplitPane
                split="horizontal"
                primaryPaneSize={settingsStore.visualSettings.asidePrimaryPaneHeight}
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
                <Nav
                    className="aside"
                    groups={navGroups}
                    expandedStateText={'expanded'}
                    collapsedStateText={'collapsed'}
                    selectedKey={selectedPageId}
                //onRenderLink={this.renderNavLink} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                    <FolderView
                        folder={fiddlesStore.fiddleRootFolder as IFolder}
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

    @autobind
    private onPaneResized(newSize: number | string) {
        this.props.settingsStore.visualSettings.asidePrimaryPaneHeight = newSize;
    }

    @autobind
    private onFiddleChange() {
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onAddFile(targetFolder: IFolder) {
        let newFileName = 'newFile.ts';
        let ix = 0;
        while (find(targetFolder.files, { name: newFileName })) {
            newFileName = `newFile-${String('00' + ++ix).slice(-2)}.ts`;
        }

        let newFile: FiddleSettings = observable({
            ...defaultFiddleSettings,
            name: newFileName
        });

        targetFolder.collapsed = false;
        targetFolder.files.push(newFile as IFile);
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onAddFolder(targetFolder: IFolder) {
        let newFolderName = 'new folder';
        let ix = 0;
        while (find(targetFolder.folders, { name: newFolderName })) {
            newFolderName = `new-folder-${String('00' + ++ix).slice(-2)}`;
        }

        let newFolder: FiddleFolder = observable({
            ...defaultFiddleFolder,
            name: newFolderName
        });

        targetFolder.collapsed = false;
        targetFolder.folders.push(newFolder as IFolder);
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onDeleteFile(targetFolder: IFolder, targetFile: IFile) {
        const targetIndex = targetFolder.files.indexOf(targetFile);
        if (targetIndex < 0) {
            return;
        }

        targetFolder.files.splice(targetIndex, 1);
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }

    @autobind
    private onDeleteFolder(parentFolder: IFolder, targetFolder: IFolder) {
        const targetIndex = parentFolder.folders.indexOf(targetFolder);
        if (targetIndex < 0) {
            return;
        }

        parentFolder.folders.splice(targetIndex, 1);
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }
}

export interface AsideProps {
    settingsStore: SettingsStore;
    pagesStore: PagesStore;
    fiddlesStore: FiddlesStore;
    onFolderSelected: (folder: FiddleFolder, path: string) => void;
    onFiddleSelected: (settings: FiddleSettings, path: string) => void;
    selectedPageId?: string;
    selectedPaths?: string | string[];
}