export interface Folder {
    name: string;
    description: string;
    collapsed?: boolean;
    locked?: boolean;
    starred?: boolean;
    iconClassName?: string;
    folders: Array<Folder>;
    files: Array<File>;
}

export interface File {
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