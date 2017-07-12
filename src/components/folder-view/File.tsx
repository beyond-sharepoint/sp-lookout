import * as React from 'react';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { DragSource } from 'react-dnd';
import { IFolder, IFile, FolderViewTypes } from './index';

const FileSource = {
    canDrag(props: FileProps) {
        //Prevent files in locked foldersfrom dragging.
        if (props.parentFolder && props.parentFolder.locked === true) {
            return false;
        }

        //Prevent locked files from dragging.
        if (props.file.locked === true) {
            return false;
        }

        return true;
    },
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
@observer
export class File extends React.Component<FileProps, FileState> {
    public render() {
        const { file, isDragging, depth, isSelected } = this.props;
        const { connectDragSource } = this.props as any;
        const style: React.CSSProperties = {
            paddingLeft: depth * 10
        };

        const fileStarStyle: React.CSSProperties = {
            paddingLeft: '10px',
            color: '#f4f4f4'
        }

        const fileLockStyle: React.CSSProperties = {
            paddingLeft: '5px',
            color: '#f4f4f4'
        }

        if (isSelected) {
            style.color = 'white';
            style.backgroundColor = '#0078d7';

            fileLockStyle.color = 'white';
        }

        if (file.starred) {
            fileStarStyle.color = 'yellow';
        }

        return connectDragSource(
            <div className="file" style={style} onClick={this.onClick} title={file.description || file.name}>
                {file.name}
                {isSelected ?
                    <span className="file-star" style={fileStarStyle} onClick={this.onStarChanged}>
                        <i className={'fa ' + (file.starred ? 'fa-star' : 'fa-star-o')} aria-hidden="true"></i>
                    </span>
                    : null
                }
                {isSelected ?
                    <span className="file-lock" style={fileLockStyle} onClick={this.onLockChanged}>
                        <i className={'fa ' + (file.locked ? 'fa-lock' : 'fa-unlock')} aria-hidden="true"></i>
                    </span>
                    : null
                }
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

    @autobind
    private onStarChanged(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { file, onStarChanged } = this.props;
        if (typeof onStarChanged === 'function') {
            const wasStarUndefined = typeof file.starred === 'undefined';
            onStarChanged(file, !!!file.starred);
            if (wasStarUndefined) {
                this.forceUpdate();
            }
        }
    }

    @autobind
    private onLockChanged(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { file, onLockChanged } = this.props;
        if (typeof onLockChanged === 'function') {
            const wasLockedUndefined = typeof file.locked === 'undefined';
            onLockChanged(file, !!!file.locked);
            if (wasLockedUndefined) {
                this.forceUpdate();
            }
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
    onStarChanged?: (file: IFile, starred: boolean) => void;
    onLockChanged?: (file: IFile, locked: boolean) => void;
    isSelected: boolean;
}