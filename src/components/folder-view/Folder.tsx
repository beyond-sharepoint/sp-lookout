import * as React from 'react';
import { DropTarget, DragSource } from 'react-dnd';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { IFolder, IFile, FolderViewTypes } from './index';
import { File } from './File';

const folderSource = {
    canDrag(props: FolderViewProps) {
        //Prevent the root folder from dragging.
        if (!props.parentFolder) {
            return false;
        }

        return true;
    },
    beginDrag(props: FolderViewProps) {
        return {
            kind: FolderViewTypes.Folder,
            name: props.folder.name,
            parentFolder: props.parentFolder,
            folder: props.folder,
        };
    },
};

const folderTarget = {
    canDrop(props: FolderViewProps, monitor: any) {
        const item = monitor.getItem();

        //Disallow the root folder from being dropped.
        if (!item.parentFolder) {
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
    drop(props: FolderViewProps, monitor: any, component: any) {
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
export class Folder extends React.Component<FolderViewProps, FolderViewState> {

    public render() {
        const { depth, folder, onCollapseChange, onMovedToFolder, onFileClicked, selectedFileId } = this.props;
        const { connectDragSource, connectDropTarget } = this.props as any;
        const innerDepth = (depth || 0) + 1;

        if (!folder) {
            return null;
        }

        const treeNodeStyle = {
            cursor: 'pointer',
            userSelect: 'none'
        };

        const rootNodeStyle = {
            paddingLeft: innerDepth * 10,
            backgroundColor: !depth ? '#f4f4f4' : null,
        };

        let collapseClassName = 'collapse';
        if (folder.collapsed === true) {
            collapseClassName += ' fa fa-caret-right';
        } else {
            collapseClassName += ' fa fa-caret-down';
        }

        return connectDragSource(connectDropTarget(
            <div className="folder" style={{ flex: 1 }}>
                <div style={rootNodeStyle} onClick={this.onCollapseChange}>
                    <span className={collapseClassName} style={{ paddingRight: '5px', width: '0.5em' }} aria-hidden="true" />
                    {folder.iconClassName ? (<span className={folder.iconClassName} style={{ paddingRight: '3px' }} />) : null}
                    {folder.name}</div>
                <div style={treeNodeStyle}>
                    {
                        !folder.collapsed ?
                            folder.folders ? folder.folders.map((subFolder, index) => (
                                <Folder
                                    key={index}
                                    parentFolder={folder}
                                    folder={subFolder}
                                    depth={innerDepth}
                                    onCollapseChange={onCollapseChange}
                                    onMovedToFolder={onMovedToFolder}
                                    onFileClicked={onFileClicked}
                                    selectedFileId={selectedFileId}
                                />
                            )) : null
                            : null
                    }
                    {
                        !folder.collapsed && folder.files
                            ? folder.files.map((file, index) => {
                                return (
                                    <File
                                        key={index}
                                        parentFolder={folder}
                                        file={file}
                                        depth={innerDepth + 1}
                                        onClick={onFileClicked}
                                        isSelected={!!file.id && file.id === selectedFileId}
                                    />
                                );
                            })
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
}

export interface FolderViewState {
}

export interface FolderViewProps {
    folder: IFolder;
    parentFolder: IFolder | null;
    depth: number;
    onCollapseChange?: (folder: IFolder, parentFolder: IFolder | null) => void;
    onMovedToFolder?: (sourceItem: IFolder | IFile, targetFolder: IFolder) => void;
    onFileClicked?: (file: IFile) => void;
    selectedFileId?: string;
}