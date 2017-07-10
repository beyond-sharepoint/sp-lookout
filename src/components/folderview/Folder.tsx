import * as React from 'react';
import { DropTarget, DragSource } from 'react-dnd';
import { autobind } from 'office-ui-fabric-react/lib';
import { File } from './File';

export const FolderItemTypes = {
    File: 'file',
    Folder: 'folder'
};

const folderSource = {
    beginDrag(props) {
        return {
            name: props.folder.name,
            parentFolder: props.parentFolder,
            folder: props.folder,
        };
    },
};

const folderTarget = {
    canDrop(props, monitor) {
        const item = monitor.getItem();
        if (item.parentFolder === props.folder) {
            return false;
        }

        if (item.parentFolder !== props.folder && !monitor.isOver({shallow: true})) {
            return false;
        }
        return true;
    },
    drop(props, monitor, component) {
        const hasDroppedOnChild = monitor.didDrop();
        if (hasDroppedOnChild) {
            return;
        }
        console.log(monitor.isOver());
        console.log(monitor.isOver({ shallow: true }));
        const item = monitor.getItem();
        console.log(`${item.name} dropped on ${props.folder.name}`);
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
export class Folder extends React.Component<FolderViewProps, FolderViewState> {
    public render() {
        const { depth, folder } = this.props;
        const { connectDragSource, connectDropTarget } = this.props as any;
        const innerDepth = (depth || 0) + 1;

        if (!connectDropTarget) {
            return null;
        }
        let treeNodeStyle = {
            paddingLeft: innerDepth * 10,
            cursor: 'pointer',
            userSelect: 'none'
        }

        let rootNodeStyle = {
            backgroundColor: !depth ? '#f4f4f4' : null,
            color: '#0078d7'
        }

        return connectDragSource(connectDropTarget(
            <div style={{ flex: 1 }}>
                <div style={rootNodeStyle}>{folder.name}</div>
                <div style={treeNodeStyle}>
                    {folder.folders ? folder.folders.map((subFolder, index) => (
                        <Folder key={index} parentFolder={folder} folder={subFolder} depth={innerDepth} />
                    )) : null}
                    {
                        folder.files ? folder.files.map((file, index) => (
                            <File key={index} parentFolder={folder} file={file} depth={0} />
                        ))
                            : null
                    }
                </div>
            </div>
        ))
    }
}

export interface FolderViewState {
}

export interface FolderViewProps {
    folder: any;
    parentFolder?: any;
    depth?: number;
    onChange?: Function;
}