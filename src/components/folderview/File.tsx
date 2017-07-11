import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import { DragSource } from 'react-dnd';

const FileSource = {
    beginDrag(props: FileProps) {
        return {
            kind: 'file',
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
        const { file, isDragging, onClick } = this.props;
        const { connectDragSource } = this.props as any;

        return connectDragSource(
            <div className="file" onClick={this.onClick}>
                {file.name}
            </div>
        );
    }

    @autobind
    private onClick() {
        const { file, onClick } = this.props;
        if (typeof onClick === 'function') {
            onClick(file);
        }
    }
}

export interface FileState {
}

export interface FileProps {
    parentFolder: any;
    file: any;
    isDragging?: boolean;
    depth: number;
    onClick?: (file: any) => void;
}