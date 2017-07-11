import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { action, extendObservable } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { Folder } from './Folder';
import { File } from './File';

import './FolderView.css';

@DragDropContext(HTML5Backend)
@observer
export class FolderView extends React.Component<FolderViewProps, FolderViewState> {
    public render() {
        const { folder, onFileClicked } = this.props;

        return (
            <div className="folder-view ms-fontColor-themePrimary" style={{ display: 'flex' }}>
                <Folder
                    folder={folder}
                    parentFolder={null}
                    depth={0}
                    onCollapseChange={this.onCollapseChange}
                    onMovedToFolder={this.onMovedToFolder}
                    onFileClicked={onFileClicked}
                />
            </div>
        );
    }

    @action.bound
    private onCollapseChange(folder: any, parentFolder: any) {
        if (typeof folder.collapsed === 'undefined') {
            extendObservable(folder, {
                collapsed: true
            });
        } else {
            folder.collapsed = !folder.collapsed;
        }
    }

    @action.bound
    private onMovedToFolder(sourceItem: any, targetFolder: any) {
        const parentFolder = sourceItem.parentFolder;
        if (sourceItem.kind === 'file') {
            parentFolder.files.splice(parentFolder.files.indexOf(sourceItem.file), 1);
            targetFolder.files.push(sourceItem.file);
        } else if (sourceItem.kind === 'folder') {
            parentFolder.folders.splice(parentFolder.folders.indexOf(sourceItem.folder), 1);
            targetFolder.folders.push(sourceItem.folder);
        }
    }
}

export interface FolderViewState {
}

export interface FolderViewProps {
    folder: any;
    onFileClicked?: (file: any) => void;
}