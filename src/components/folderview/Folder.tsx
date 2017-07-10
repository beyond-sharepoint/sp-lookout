import * as React from 'react';
import { DropTarget, DragSource } from 'react-dnd';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { File } from './File';

export const FolderItemTypes = {
    File: 'file',
    Folder: 'folder'
};

const folderSource = {
    beginDrag(props) {
        return {
            kind: 'folder',
            name: props.folder.name,
            parentFolder: props.parentFolder,
            folder: props.folder,
        };
    },
};

const folderTarget = {
    canDrop(props, monitor) {
        const item = monitor.getItem();

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
    drop(props, monitor, component) {
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

@DropTarget([FolderItemTypes.File, FolderItemTypes.Folder], folderTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
}))
@DragSource(FolderItemTypes.Folder, folderSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
}))
@observer
export class Folder extends React.Component<FolderViewProps, FolderViewState> {

    public render() {
        const { depth, folder, onCollapseChange, onMovedToFolder, onFileClicked } = this.props;
        const { connectDragSource, connectDropTarget } = this.props as any;
        const innerDepth = (depth || 0) + 1;

        const treeNodeStyle = {
            paddingLeft: innerDepth * 10,
            cursor: 'pointer',
            userSelect: 'none'
        }

        const rootNodeStyle = {
            backgroundColor: !depth ? '#f4f4f4' : null,
        }

        let collapseClassName = "collapse";
        if (folder.collapsed === true)
            collapseClassName += " fa fa-caret-right";
        else
            collapseClassName += " fa fa-caret-down";

        return connectDragSource(connectDropTarget(
            <div className="folder" style={{ flex: 1 }}>
                <div style={rootNodeStyle} onClick={this.onCollapseChange}><span className={collapseClassName} style={{ paddingRight: '5px' }} aria-hidden="true"></span>{folder.name}</div>
                <div style={treeNodeStyle}>
                    {
                        !folder.collapsed ?
                            folder.folders ? folder.folders.map((subFolder, index) => (
                                <Folder
                                    key={index}
                                    parentFolder={folder}
                                    folder={subFolder}
                                    depth={innerDepth}
                                    index={index}
                                    onCollapseChange={onCollapseChange}
                                    onMovedToFolder={onMovedToFolder}
                                    onFileClicked={onFileClicked}
                                />
                            )) : null
                            : null
                    }
                    {
                        !folder.collapsed ?
                            folder.files ? folder.files.map((file, index) => (
                                <File key={index} parentFolder={folder} file={file} depth={0} index={index} onClick={onFileClicked} />
                            )) : null
                            : null
                    }
                </div>
            </div>
        ))
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
    folder: any;
    parentFolder: any | null;
    depth: number;
    index: number;
    onCollapseChange?: (folder: any, parentFolder: any) => void;
    onMovedToFolder?: (sourceItem: any, targetFolder: any) => void;
    onFileClicked?: (file: any) => void;
}