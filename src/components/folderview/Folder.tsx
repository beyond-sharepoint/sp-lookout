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
      folder: props.folder,
    };
  },
};

const folderTarget = {
    drop(props, monitor, component) {
        const hasDroppedOnChild = monitor.didDrop();
        if (hasDroppedOnChild) {
            return;
        }
        const item =  monitor.getItem()
        let source;
        if (item.file) {
            source = item.file.name;
        } else {
            source = item.folder.name;
        }
        console.log(`${source} dropped on ${props.folder.name}`);
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
                        <Folder key={index} folder={subFolder} depth={innerDepth} />
                    )) : null}
                    {
                        folder.files ? folder.files.map((file, index) => (
                            <File key={index} file={file} depth={0} />
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
    depth?: number;
    onChange?: Function;
}