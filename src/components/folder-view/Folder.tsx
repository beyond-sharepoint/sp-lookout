import * as React from 'react';
import { DropTarget, DragSource } from 'react-dnd';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { sortBy } from 'lodash';
import { IFolder, IFile, FolderViewTypes } from './index';
import { File } from './File';

const folderSource = {
    canDrag(props: FolderProps) {
        //Prevent the root folder from dragging.
        if (!props.parentFolder) {
            return false;
        }

        //Prevent locked folders from dragging.
        if (props.folder.locked === true) {
            return false;
        }

        return true;
    },
    beginDrag(props: FolderProps) {
        return {
            kind: FolderViewTypes.Folder,
            name: props.folder.name,
            parentFolder: props.parentFolder,
            folder: props.folder,
        };
    },
};

const folderTarget = {
    canDrop(props: FolderProps, monitor: any) {
        const item = monitor.getItem();

        if (props.folder.locked === true) {
            return false;
        }

        //Disallow the root folder from being dropped.
        if (!item.parentFolder) {
            return false;
        }

        //Disallow locked items from being dropped.
        if (item.locked === true) {
            return false;
        }

        //Disallow dropping a file on it's containing folder.
        if (item.parentFolder === props.folder) {
            return false;
        }

        //Prevent a folder's parent from picking up a drop of a file on it's containing folder.
        if (item.parentFolder !== props.folder && !monitor.isOver({ shallow: true })) {
            return false;
        }

        //Disallow dropping a folder on itself.
        if (item.folder === props.folder) {
            return false;
        }

        return true;
    },
    drop(props: FolderProps, monitor: any, component: any) {
        const hasDroppedOnChild = monitor.didDrop();
        if (hasDroppedOnChild) {
            return;
        }

        const item = monitor.getItem();
        if (typeof props.onMovedToFolder === 'function') {
            props.onMovedToFolder(item, props.folder);
        }
    },
};

@DropTarget([FolderViewTypes.File, FolderViewTypes.Folder], folderTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
}))
@DragSource(FolderViewTypes.Folder, folderSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
}))
@observer
export class Folder extends React.Component<FolderProps, FolderState> {

    public render() {
        const {
            depth,
            folder,
            parentFolder,
            onCollapseChange,
            onLockChanged,
            onMovedToFolder,
            onFileClicked,
            onFileLockChanged,
            onFileStarChanged,
            selectedFileId
        } = this.props;
        const { connectDragSource, connectDropTarget } = this.props as any;
        const innerDepth = (depth || 0) + 1;

        if (!folder) {
            return null;
        }

        const rootNodeStyle: any = {
            paddingLeft: innerDepth * 10,
            backgroundColor: !depth ? '#f4f4f4' : null,
            flex: '1'
        };

        if (!parentFolder) {
            rootNodeStyle.display = 'flex';
        }

        const nodeStyle: any = {
            cursor: 'pointer',
            userSelect: 'none',
        };

        if (parentFolder) {
            nodeStyle.display = 'flex';
            nodeStyle.flexDirection = 'column';
        } else {
            nodeStyle.flex = '1';
        }

        const folderLockStyle: React.CSSProperties = {
            paddingLeft: '5px',
            color: '#f4f4f4'
        }

        if (!parentFolder) {
            folderLockStyle.color = '#0078d7';
        }

        let collapseClassName = 'collapse';
        if (folder.collapsed === true) {
            collapseClassName += ' fa fa-caret-right';
        } else {
            collapseClassName += ' fa fa-caret-down';
        }

        let addIconStyle: React.CSSProperties = {
            padding: '0 5px',
            cursor: 'pointer'
        };

        const rootSubFolderStyles: any = {};
        if (!parentFolder) {
            rootSubFolderStyles.overflow = 'auto';
        }

        return connectDragSource(connectDropTarget(
            <div className="folder" style={nodeStyle}>
                <div style={rootNodeStyle} onClick={this.onCollapseChange}>
                    <span className={collapseClassName} style={{ paddingRight: '5px', width: '0.5em' }} aria-hidden="true" />
                    {folder.iconClassName ? (<span className={folder.iconClassName} style={{ paddingRight: '3px' }} />) : null}
                    <span>{folder.name}</span>
                    <span className="file-lock" style={folderLockStyle} onClick={this.onLockChanged}>
                        <i className={'fa ' + (folder.locked ? 'fa-lock' : 'fa-unlock')} aria-hidden="true"></i>
                    </span>
                    {!parentFolder
                        ? (
                            <span style={{ marginLeft: 'auto' }}>
                                <span style={addIconStyle} title="Add File" onClick={this.onAddFile}>
                                    <i className="ms-Icon ms-Icon--PageAdd" aria-hidden="true" />
                                </span>
                                <span style={addIconStyle} title="Add Folder" onClick={this.onAddFolder}>
                                    <i className="ms-Icon ms-Icon--FabricNewFolder" aria-hidden="true" />
                                </span>
                            </span>
                        )
                        : null
                    }
                </div>
                <div style={rootSubFolderStyles}>
                    {
                        !folder.collapsed && folder.folders
                            ? sortBy(folder.folders, f => f.name).map((subFolder, index) => (
                                <Folder
                                    key={index}
                                    parentFolder={folder}
                                    folder={subFolder}
                                    depth={innerDepth}
                                    onCollapseChange={onCollapseChange}
                                    onLockChanged={onLockChanged}
                                    onMovedToFolder={onMovedToFolder}
                                    onFileClicked={onFileClicked}
                                    onFileLockChanged={onFileLockChanged}
                                    onFileStarChanged={onFileStarChanged}
                                    selectedFileId={selectedFileId}
                                />
                            ))
                            : null
                    }
                    {
                        !folder.collapsed && folder.files
                            ? sortBy(folder.files, f => f.name).map((file, index) => (
                                <File
                                    key={index}
                                    parentFolder={folder}
                                    file={file}
                                    depth={innerDepth + 1}
                                    onClick={onFileClicked}
                                    onLockChanged={onFileLockChanged}
                                    onStarChanged={onFileStarChanged}
                                    isSelected={!!file.id && file.id === selectedFileId}
                                />
                            ))
                            : null
                    }
                </div>
            </div>
        ));
    }

    @autobind
    private onCollapseChange() {
        const { folder, parentFolder, onCollapseChange } = this.props;
        if (typeof onCollapseChange === 'function') {
            const wasCollapsedUndefined = typeof folder.collapsed === 'undefined';
            onCollapseChange(folder, parentFolder);
            if (wasCollapsedUndefined) {
                this.forceUpdate();
            }
        }
    }

    @autobind
    private onLockChanged(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { folder, onLockChanged } = this.props;
        if (typeof onLockChanged === 'function') {
            const wasLockedUndefined = typeof folder.locked === 'undefined';
            onLockChanged(folder, !!!folder.locked);
            if (wasLockedUndefined) {
                this.forceUpdate();
            }
        }
    }

    @autobind
    private onAddFile(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { folder, onAddFile } = this.props;
        if (typeof onAddFile !== 'undefined') {
            onAddFile();
        }
    }

    @autobind
    private onAddFolder(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { folder, onAddFolder } = this.props;
        if (typeof onAddFolder !== 'undefined') {
            onAddFolder();
        }
    }
}

export interface FolderState {
}

export interface FolderProps {
    folder: IFolder;
    parentFolder: IFolder | null;
    depth: number;
    onCollapseChange?: (folder: IFolder, parentFolder: IFolder | null) => void;
    onMovedToFolder?: (sourceItem: IFolder | IFile, targetFolder: IFolder) => void;
    onAddFile?: () => void;
    onAddFolder?: () => void;
    onLockChanged?: (folder: IFolder, locked: boolean) => void;
    onFileClicked?: (file: IFile) => void;
    onFileLockChanged?: (file: IFile, locked: boolean) => void;
    onFileStarChanged?: (file: IFile, starred: boolean) => void;
    selectedFileId?: string;
}