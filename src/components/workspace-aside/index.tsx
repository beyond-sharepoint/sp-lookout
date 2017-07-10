import * as React from 'react';
import { observable, action, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { FolderView } from '../folderview';
import { Nav, INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { autobind } from 'office-ui-fabric-react/lib';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import testFolderData from './test-tree.js';

import * as _ from 'lodash';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _rootFolder;

    constructor() {
        super();
        this._rootFolder = {};

        this._actionsItems = {
            near: [{
                key: 'title',
                name: 'Actions',
            }],
            far: []
        };

        this._spFiddleItems = {
            near: [{
                key: 'title',
                name: 'SPFiddle',
                href: '#/spfiddle',
                icon: 'Embed'
            }],
            far: []
        }
    }

    componentWillMount() {
        let rootFolder = _.cloneDeep(testFolderData);
        rootFolder.toggleCollapsed = action((folder: any, parentFolder: any) => {
            if (typeof folder.collapsed === 'undefined') {
                extendObservable(folder, {
                    collapsed: true
                });
            } else {
                folder.collapsed = !folder.collapsed;
            }
        });
        rootFolder.moveItemToFolder = action((sourceItem, targetFolder) => {
            const parentFolder = sourceItem.parentFolder;
            if (sourceItem.kind === 'file') {
                parentFolder.files.splice(parentFolder.files.indexOf(sourceItem.file), 1);
                targetFolder.files.push(sourceItem.file);
            } else if (sourceItem.kind === 'folder') {
                parentFolder.folders.splice(parentFolder.folders.indexOf(sourceItem.folder), 1);
                targetFolder.folders.push(sourceItem.folder);
            }
        });
        this._rootFolder = observable(rootFolder);
    }

    @autobind
    private onFileClicked(file) {
        console.log("file clicked.");
    }

    @autobind
    private onCollapseChange(folder, parentFolder) {
        this._rootFolder.toggleCollapsed(folder, parentFolder);
    }

    @autobind
    private onMovedToFolder(sourceItem, targetFolder) {
        this._rootFolder.moveItemToFolder(sourceItem, targetFolder);
    }

    public render() {
        return (
            <div>
                <Nav
                    className="aside"
                    groups={this.props.navItems}
                    expandedStateText={'expanded'}
                    collapsedStateText={'collapsed'}
                    selectedKey={'dashboard'}
                //onRenderLink={this.renderNavLink} 
                />
                <CommandBar
                    className="fiddle"
                    isSearchBoxVisible={false}
                    items={this._spFiddleItems.near}
                />
                <FolderView
                    folder={this._rootFolder}
                    onCollapseChange={this.onCollapseChange}
                    onMovedToFolder={this.onMovedToFolder}
                    onFileClicked={this.onFileClicked}></FolderView>
            </div>
        );
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
}