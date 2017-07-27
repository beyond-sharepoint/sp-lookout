import * as React from 'react';
import { DropTarget, DragSource } from 'react-dnd';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { sortBy, find } from 'lodash';
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

        //Prevent folders being edited from dragging.
        if ((props.folder as any).isEditing) {
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

        //Disallow a folder's parent from picking up a drop of a file on it's containing folder.
        if (item.parentFolder !== props.folder && !monitor.isOver({ shallow: true })) {
            return false;
        }

        //Disallow dropping a folder on itself.
        if (item.folder === props.folder) {
            return false;
        }

        //Disallow dropping an item if the folder contains a folder of the same name.
        if (find(props.folder.folders, { name: item.name })) {
            return false;
        }

        //Disallow dropping an item if the folder contains a file of the same name.
        if (find(props.folder.files, { name: item.name })) {
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
    private _input: HTMLInputElement | null;

    public constructor(props: FolderProps) {
        super(props);

        this.state = {
            isSelected: this.getIsSelected(props),
            isEditing: false,
            nameInEdit: ''
        };
    }

    public componentWillReceiveProps(nextProps: FolderProps) {
        const isSelected = this.getIsSelected(nextProps);
        this.setState({
            isSelected: isSelected
        });
    }

    public render() {
        const {
            depth,
            folder,
            parentFolder,
            path,
            onCollapseChange,
            onLockChanged,
            onMovedToFolder,
            onFileSelected,
            onFolderSelected,
            onFileNameChanged,
            onFolderNameChanged,
            onFileLockChanged,
            onFileStarChanged,
            selectedPaths
        } = this.props;
        const { connectDragSource, connectDropTarget } = this.props as any;
        const { isEditing, isSelected } = this.state;

        if (!folder) {
            return null;
        }

        const rootNodeStyle: React.CSSProperties = {
            paddingLeft: depth * 10,
            backgroundColor: !depth ? '#f4f4f4' : null,
            outline: 'none'
        };

        const nodeStyle: React.CSSProperties = {
            userSelect: 'none',
            outline: 'none'
        };

        const folderLockStyle: React.CSSProperties = {
            paddingLeft: '5px',
            color: '#f4f4f4'
        };

        const addIconStyle: React.CSSProperties = {
            padding: '0 5px',
            cursor: 'pointer'
        };

        const rootSubFolderStyles: React.CSSProperties = {};

        const inputStyle: React.CSSProperties = {
            outline: 'none',
            border: 'none',
            padding: '0',
            fontSize: '14px',
            height: '21px',
            width: (this.props.folder.name.length + 2) + 'ex'
        };

        let collapseClassName = 'collapse';
        if (folder.collapsed === true) {
            collapseClassName += ' fa fa-caret-right';
        } else {
            collapseClassName += ' fa fa-caret-down';
        }

        if (parentFolder) {
            nodeStyle.cursor = 'pointer';
            nodeStyle.display = 'flex';
            nodeStyle.flexDirection = 'column';
        } else {
            rootNodeStyle.cursor = 'pointer';
            rootNodeStyle.paddingLeft = '3px';
            rootNodeStyle.display = 'flex';
            rootNodeStyle.alignItems = 'center';
            rootNodeStyle.overflow = 'hidden';

            nodeStyle.flex = 1;
            nodeStyle.display = 'flex';
            nodeStyle.flexDirection = 'column';

            folderLockStyle.color = '#0078d7';

            rootSubFolderStyles.overflow = 'auto';
            rootSubFolderStyles.flex = '1';
        }

        if (isSelected) {
            rootNodeStyle.color = 'white';
            rootNodeStyle.backgroundColor = '#0078d7';

            folderLockStyle.color = 'white';
        }

        return connectDragSource(connectDropTarget(
            <div className="folder" style={nodeStyle} tabIndex={0} onKeyUp={this.onKeyUp}>
                <div
                    title={folder.description}
                    style={rootNodeStyle}
                    onClick={this.onFolderSelected}
                    tabIndex={0}
                    onDoubleClick={this.onDoubleClick}
                    onKeyUp={this.onKeyUp}
                >
                    <span className={collapseClassName} style={{ paddingRight: '5px', width: '0.5em' }} aria-hidden="true" />
                    {folder.iconClassName ? (<span className={folder.iconClassName} style={{ paddingRight: '3px' }} />) : null}
                    {isEditing
                        ? <input
                            ref={(node) => this._input = node}
                            type="text"
                            style={inputStyle}
                            value={this.state.nameInEdit}
                            onChange={this.onFolderRename}
                            onBlur={() => this.stopEditing(true, true)}
                            onSubmit={() => this.stopEditing(true)}
                        />
                        : <span>{folder.name}</span>
                    }
                    {isSelected &&
                        <span className="file-lock" style={folderLockStyle} onClick={this.onLockChanged}>
                            <i className={'fa ' + (folder.locked ? 'fa-lock' : 'fa-unlock')} aria-hidden="true" />
                        </span>
                    }
                    {!parentFolder
                        ? (
                            <span style={{ marginLeft: 'auto' }}>
                                <span style={addIconStyle} title="Add File" onClick={this.onAddFile}>
                                    <i className="ms-Icon ms-Icon--PageAdd" aria-hidden="true" />
                                </span>
                                <span style={addIconStyle} title="Add Folder" onClick={this.onAddFolder}>
                                    <i className="ms-Icon ms-Icon--FabricNewFolder" aria-hidden="true" />
                                </span>
                                <span style={addIconStyle} title="Delete" onClick={this.onDelete}>
                                    <i className="ms-Icon ms-Icon--RecycleBin" aria-hidden="true" />
                                </span>
                            </span>
                        )
                        : null
                    }
                </div>
                <div style={rootSubFolderStyles} onClick={this.clearSelection}>
                    {
                        !folder.collapsed && folder.folders
                            ? sortBy(folder.folders, f => f.name).map((subFolder, index) => (
                                <Folder
                                    key={index}
                                    parentFolder={folder}
                                    path={path ? `${path}${subFolder.name}/` : `${subFolder.name}/`}
                                    folder={subFolder}
                                    depth={depth + 1}
                                    onCollapseChange={onCollapseChange}
                                    onLockChanged={onLockChanged}
                                    onMovedToFolder={onMovedToFolder}
                                    onFileSelected={onFileSelected}
                                    onFolderSelected={onFolderSelected}
                                    onFileNameChanged={onFileNameChanged}
                                    onFolderNameChanged={onFolderNameChanged}
                                    onFileLockChanged={onFileLockChanged}
                                    onFileStarChanged={onFileStarChanged}
                                    selectedPaths={selectedPaths}
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
                                    path={path ? `${path}${file.name}` : file.name}
                                    file={file}
                                    depth={depth + 1}
                                    onClick={onFileSelected}
                                    onFileNameChanged={onFileNameChanged}
                                    onLockChanged={onFileLockChanged}
                                    onStarChanged={onFileStarChanged}
                                    selectedPaths={selectedPaths}
                                />
                            ))
                            : null
                    }
                </div>
            </div>
        ));
    }

    @autobind
    private getIsSelected(props: FolderProps): boolean {
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

        if (this.state.isEditing) {
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
    private onFolderRename(ev: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            nameInEdit: ev.target.value
        });
    }

    private startEditing() {
        if (this.props.folder.locked) {
            return;
        }

        if (!this.state.isSelected) {
            return;
        }

        if (!this.props.parentFolder) {
            return;
        }

        this.setState({
            isEditing: true,
            nameInEdit: this.props.folder.name
        });

        (this.props.folder as any).isEditing = true;

        setTimeout(
            () => {
                if (this._input) {
                    this._input.focus();
                    this._input.setSelectionRange(0, this._input.value.lastIndexOf('.'));
                }
            },
            1
        );
    }

    private stopEditing(shouldRename: boolean, revertOnError?: boolean) {
        const newName = this.state.nameInEdit;
        if (
            !newName ||
            newName.length <= 0 ||
            newName.startsWith('.') ||
            newName.indexOf('/') > -1 ||
            !this.props.parentFolder ||
            find(this.props.parentFolder.folders, { name: newName })
        ) {
            if (!shouldRename || revertOnError) {
                delete (this.props.folder as any).isEditing;
                this.setState({
                    isEditing: false,
                    nameInEdit: ''
                });
            }
            return false;
        }

        delete (this.props.folder as any).isEditing;
        this.setState({
            isEditing: false,
            nameInEdit: ''
        });

        if (shouldRename && typeof this.props.onFolderNameChanged === 'function') {
            const { folder, path } = this.props;
            this.props.onFolderNameChanged(folder, path, newName);
        }

        return true;
    }

    @autobind
    private onFolderSelected(ev: React.MouseEvent<HTMLDivElement>) {
        ev.stopPropagation();
        const { path, folder, parentFolder, onCollapseChange, onFolderSelected, } = this.props;
        const { isSelected } = this.state;

        if (isSelected && typeof onCollapseChange === 'function') {
            onCollapseChange(folder, parentFolder);
        }

        if (typeof onFolderSelected === 'function') {
            onFolderSelected(folder, path);
        }
    }

    @autobind
    private clearSelection(ev: React.MouseEvent<HTMLDivElement>) {
        const { folder, parentFolder, onCollapseChange, onFolderSelected } = this.props;
        if (typeof onFolderSelected === 'function') {
            onFolderSelected(folder, null);
        }
    }

    @autobind
    private onLockChanged(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { folder, onLockChanged } = this.props;
        if (typeof onLockChanged === 'function') {
            onLockChanged(folder, !!!folder.locked);
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

    @autobind
    private onDelete(ev: React.MouseEvent<HTMLSpanElement>) {
        ev.stopPropagation();
        const { folder, onDelete } = this.props;
        if (typeof onDelete !== 'undefined') {
            onDelete();
        }
    }
}

export interface FolderState {
    isSelected: boolean;
    isEditing: boolean;
    nameInEdit: string;
}

export interface FolderProps {
    folder: IFolder;
    parentFolder: IFolder | null;
    path: string;
    depth: number;
    onCollapseChange?: (folder: IFolder, parentFolder: IFolder | null) => void;
    onMovedToFolder?: (sourceItem: IFolder | IFile, targetFolder: IFolder) => void;
    onAddFile?: () => void;
    onAddFolder?: () => void;
    onDelete?: () => void;
    onLockChanged?: (folder: IFolder, locked: boolean) => void;
    onFileSelected?: (file: IFile, filePath: string) => void;
    onFolderSelected?: (folder: IFolder, folderPath: string | null) => void;
    onFileNameChanged?: (file: IFile, filePath: string, newName: string) => void;
    onFolderNameChanged?: (folder: IFolder, folderPath: string, newName: string) => void;
    onFileLockChanged?: (file: IFile, locked: boolean) => void;
    onFileStarChanged?: (file: IFile, starred: boolean) => void;
    selectedPaths?: string | string[];
}