import * as React from 'react';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { DragSource } from 'react-dnd';
import { find } from 'lodash';
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
    private _input: HTMLInputElement | null;

    public constructor(props: FileProps) {
        super(props);

        this.state = {
            isSelected: this.getIsSelected(props),
            isEditing: false,
            nameInEdit: ''
        };
    }

    public componentWillReceiveProps(nextProps: FileProps) {
        const isSelected = this.getIsSelected(nextProps);
        this.setState({
            isSelected: isSelected
        });
    }

    public render() {
        const { parentFolder, path, file, isDragging, depth, selectedPaths } = this.props;
        const { connectDragSource } = this.props as any;
        const { isEditing, isSelected } = this.state;
        const style: React.CSSProperties = {
            paddingLeft: depth * 10,
            width: '100%',
            outline: 'none'
        };

        const fileStarStyle: React.CSSProperties = {
            paddingLeft: '10px',
            color: '#f4f4f4'
        };

        const fileLockStyle: React.CSSProperties = {
            paddingLeft: '5px',
            color: '#f4f4f4'
        };

        if (isSelected) {
            style.color = 'white';
            style.backgroundColor = '#0078d7';

            fileLockStyle.color = 'white';
        }

        if (file.starred) {
            fileStarStyle.color = 'yellow';
        }

        const inputStyle: React.CSSProperties = {
            outline: 'none',
            border: 'none',
            padding: '0',
            fontSize: '14px',
            height: '21px',
            width: (this.state.nameInEdit.length + 2) + 'ex'
        }

        return connectDragSource(
            <div
                className="file"
                title={file.description || file.name}
                style={style}
                tabIndex={0}
                onClick={this.onClick}
                onDoubleClick={this.onDoubleClick}
                onKeyUp={this.onKeyUp}
            >
                {isEditing
                    ? <input
                        ref={(node) => this._input = node}
                        type="text"
                        style={inputStyle}
                        value={this.state.nameInEdit}
                        onChange={this.onFileRename}
                        onBlur={() => this.stopEditing(true)}
                        onSubmit={() => this.stopEditing(true)}
                    />
                    : <span>{file.name}</span>
                }
                {isSelected ?
                    <span className="file-star" style={fileStarStyle} onClick={this.onStarChanged}>
                        <i className={'fa ' + (file.starred ? 'fa-star' : 'fa-star-o')} aria-hidden="true" />
                    </span>
                    : null
                }
                {isSelected ?
                    <span className="file-lock" style={fileLockStyle} onClick={this.onLockChanged}>
                        <i className={'fa ' + (file.locked ? 'fa-lock' : 'fa-unlock')} aria-hidden="true" />
                    </span>
                    : null
                }
            </div>
        );
    }

    @autobind
    private getIsSelected(props: FileProps): boolean {
        const { path, selectedPaths } = props;

        let isSelected = false;
        if (selectedPaths instanceof Array) {
            isSelected = !!find(selectedPaths, path);
        } else {
            isSelected = (selectedPaths === path);
        }
        return isSelected;
    }

    @autobind
    private onDoubleClick(ev: React.MouseEvent<HTMLDivElement>) {
        if (!this.state.isSelected) {
            return;
        }

        ev.preventDefault();
        this.startEditing();
    }

    @autobind
    private onKeyUp(ev: React.KeyboardEvent<HTMLDivElement>) {
        if (!this.state.isSelected) {
            return;
        }

        if (ev.keyCode === 13) {
            if (!this.state.isEditing) {
                this.startEditing();
            } else {
                this.stopEditing(true);
            }
        } else if (ev.keyCode === 27) {
            this.stopEditing(false);
        }
    }

    @autobind
    private onFileRename(ev: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            nameInEdit: ev.target.value
        });
    }

    private startEditing() {
        if (this.props.file.locked) {
            return;
        }

        this.setState({
            isEditing: true,
            nameInEdit: this.props.file.name
        });

        setTimeout(() => {
            if (this._input) {
                this._input.focus();
                this._input.setSelectionRange(0, this._input.value.lastIndexOf('.'));
            }
        }, 1);
    }

    private stopEditing(shouldRename: boolean) {
        const newName = this.state.nameInEdit;

        if (
            !newName ||
            newName.length <= 0 ||
            newName.startsWith('.') ||
            newName.indexOf('/') > -1 ||
            find(this.props.parentFolder.files, { name: newName })
        ) {
            return;
        }

        this.setState({
            isEditing: false,
            nameInEdit: ''
        });

        if (shouldRename && typeof this.props.onFileNameChanged === 'function') {
            const { file, path } = this.props;
            this.props.onFileNameChanged(file, path, newName);
        }
    }

    @autobind
    private onClick(ev: React.MouseEvent<HTMLDivElement>) {
        ev.stopPropagation();
        const { path, file, onClick } = this.props;
        if (typeof onClick === 'function') {
            onClick(file, path);
        }
    }

    @autobind
    private onStarChanged(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { file, onStarChanged } = this.props;
        if (typeof onStarChanged === 'function') {
            onStarChanged(file, !!!file.starred);
        }
    }

    @autobind
    private onLockChanged(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { file, onLockChanged } = this.props;
        if (typeof onLockChanged === 'function') {
            onLockChanged(file, !!!file.locked);
        }
    }
}

export interface FileState {
    isSelected: boolean;
    isEditing: boolean;
    nameInEdit: string;
}

export interface FileProps {
    parentFolder: IFolder;
    path: string;
    file: IFile;
    isDragging?: boolean;
    depth: number;
    onClick?: (file: IFile, filePath: string) => void;
    onFileNameChanged?: (file: IFile, filePath: string, newName: string) => void;
    onStarChanged?: (file: IFile, starred: boolean) => void;
    onLockChanged?: (file: IFile, locked: boolean) => void;
    selectedPaths?: string | string[];
}