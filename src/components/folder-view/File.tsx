import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import { DragSource } from 'react-dnd';
import { IFolder, IFile, FolderViewTypes } from './index';

const FileSource = {
    beginDrag(props: FileProps) {
        return {
            kind: FolderViewTypes.File,
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
        const { file, isDragging, depth, onClick, isSelected } = this.props;
        const { connectDragSource } = this.props as any;
        const style: React.CSSProperties = {
            paddingLeft: depth * 10
        };

        if (isSelected) {
            style.color = 'white';
            style.backgroundColor = '#0078d7';
        }

        return connectDragSource(
            <div className="file" style={style} onClick={this.onClick} title={file.description || file.name}>
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
    parentFolder: IFolder | null;
    file: IFile;
    isDragging?: boolean;
    depth: number;
    onClick?: (file: IFile) => void;
    isSelected: boolean;
}