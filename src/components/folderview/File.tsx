import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import { DragSource } from 'react-dnd';

const FileSource = {
    beginDrag(props) {
        return {
            name: props.file.name,
            parentFolder: props.parentFolder,
            file: props.file
        };
    },
};

@DragSource(props => 'file', FileSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
}))
export class File extends React.Component<FileProps, FileState> {
    public render() {
        const { file, isDragging } = this.props;
        const { connectDragSource } = this.props as any;

        return connectDragSource(
            <div>
                {file.name}
            </div>
        )
    }
}

export interface FileState {
}

export interface FileProps {
    parentFolder: any;
    file: any;
    isDragging?: boolean
    depth: number;
}