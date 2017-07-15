export interface IFolder {
    name: string;
    description: string;
    collapsed?: boolean;
    locked?: boolean;
    starred?: boolean;
    iconClassName?: string;
    folders: Array<IFolder>;
    files: Array<IFile>;
}

export interface IFile {
    name: string;
    description?: string;
    locked?: boolean;
    starred?: boolean;
}

export const FolderViewTypes = {
    File: 'file',
    Folder: 'folder'
};

export * from './FolderView';