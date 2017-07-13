import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { action, extendObservable } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { IFolder, IFile } from './index';
import { Folder } from './Folder';
import { File } from './File';

import './FolderView.css';

@DragDropContext(HTML5Backend)
@observer
export class FolderView extends React.Component<FolderViewProps, FolderViewState> {
    public render() {
        const { folder, onFileSelected, onFolderSelected, selectedItemId } = this.props;

        return (
            <div className="folder-view ms-fontColor-themePrimary">
                <Folder
                    folder={folder}
                    parentFolder={null}
                    depth={0}
                    onCollapseChange={this.onCollapseChange}
                    onLockChanged={this.onLockChanged}
                    onMovedToFolder={this.onMovedToFolder}
                    onAddFile={this.onAddFile}
                    onAddFolder={this.onAddFolder}
                    onDelete={this.onDelete}
                    onFileSelected={onFileSelected}
                    onFolderSelected={onFolderSelected}
                    onFileLockChanged={this.onFileLockChanged}
                    onFileStarChanged={this.onFileStarChanged}
                    selectedItemId={selectedItemId}
                />
            </div>
        );
    }

    @action.bound
    private onCollapseChange(folder: IFolder, parentFolder: IFolder) {
        if (typeof folder.collapsed === 'undefined') {
            extendObservable(folder, {
                collapsed: true
            });
        } else {
            folder.collapsed = !folder.collapsed;
        }

        this.props.onChange(this.props.folder);
    }

    @action.bound
    private onLockChanged(folder: IFolder, locked: boolean) {
        if (typeof folder.locked === 'undefined') {
            extendObservable(folder, {
                locked: locked
            });
        } else {
            folder.locked = locked;
        }

        this.props.onChange(this.props.folder);
    }

    @action.bound
    private onMovedToFolder(sourceItem: any, targetFolder: IFolder) {
        const parentFolder = sourceItem.parentFolder;
        if (sourceItem.kind === 'file') {
            parentFolder.files.splice(parentFolder.files.indexOf(sourceItem.file), 1);
            targetFolder.files.push(sourceItem.file);
        } else if (sourceItem.kind === 'folder') {
            parentFolder.folders.splice(parentFolder.folders.indexOf(sourceItem.folder), 1);
            targetFolder.folders.push(sourceItem.folder);
        }

        this.props.onChange(this.props.folder);
    }

    public getFlattenedFolders(folder: IFolder): Array<IFolder> {
        if (!folder) {
            return [];
        }

        let result: Array<IFolder> = [];
        for (let f of folder.folders) {
            result.push(f);
            result = result.concat(this.getFlattenedFolders(f));
        }
        return result;
    }

    private getTargetFolder(folder: IFolder, fileId?: string | string[]) {
        if (!fileId) {
            return {
                folder: this.props.folder,
                file: undefined
            }
        }

        for (let file of folder.files) {
            if (file.id === fileId) {
                return {
                    folder: folder,
                    file: file
                }
            }
        }

        let results: Array<{ folder: IFolder, file: IFile }> = [];
        const flattenedFolders = this.getFlattenedFolders(folder);
        for (let innerFolder of flattenedFolders) {
            for (let file of innerFolder.files) {
                if (file.id === fileId) {
                    return {
                        folder: innerFolder,
                        file: file
                    }
                }
            }
        }

        return {
            folder: this.props.folder,
            file: undefined
        }
    }

    @action.bound
    private onAddFile() {
        const target = this.getTargetFolder(this.props.folder, this.props.selectedItemId);
        if (target.folder.locked) {
            return;
        }

        if (typeof this.props.onAddFile !== 'undefined') {
            this.props.onAddFile(target.folder);
        }
    }

    @action.bound
    private onAddFolder() {
        const target = this.getTargetFolder(this.props.folder, this.props.selectedItemId);
        if (target.folder.locked) {
            return;
        }

        if (typeof this.props.onAddFolder !== 'undefined') {
            this.props.onAddFolder(target.folder);
        }
    }

    @action.bound
    private onDelete() {
        const target = this.getTargetFolder(this.props.folder, this.props.selectedItemId);
        if (target.file && !target.file.locked && !target.folder.locked) {
            if (typeof this.props.onDeleteFile !== 'undefined') {
                this.props.onDeleteFile(target.folder, target.file);
                return;
            }
        }

        //TODO: Delete Folder
    }

    @action.bound
    private onFileLockChanged(file: IFile, locked: boolean) {
        if (typeof file.locked === 'undefined') {
            extendObservable(file, {
                locked: locked
            });
        } else {
            file.locked = locked;
        }

        this.props.onChange(this.props.folder);
    }

    @action.bound
    private onFileStarChanged(file: IFile, starred: boolean) {
        if (typeof file.starred === 'undefined') {
            extendObservable(file, {
                starred: starred
            });
        } else {
            file.starred = starred;
        }

        this.props.onChange(this.props.folder);
    }
}

export interface FolderViewState {
}

export interface FolderViewProps {
    folder: IFolder;
    onChange: (folder: IFolder) => void;
    onFileSelected?: (file: IFile) => void;
    onFolderSelected?: (folder: IFolder) => void;
    onAddFile?: (targetFolder: IFolder) => void;
    onAddFolder?: (targetFolder: IFolder) => void;
    onDeleteFile?: (parentFolder: IFolder, targetFile: IFile) => void;
    onDeleteFolder?: (parentFolder: IFolder, targetFolder: IFolder) => void;
    selectedItemId?: string | string[];
}
