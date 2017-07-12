import { FiddleSettings } from './FiddleSettings';

export interface FiddleFolder {
    name: string;
    collapsed?: boolean;
    iconClassName?: string;
    files: Array<FiddleSettings>;
    folders: Array<FiddleFolder>;
}

export const defaultFiddleRootFolder: FiddleFolder = {
    name: 'SPFiddle',
    collapsed: false,
    iconClassName: 'fa fa-code',
    folders: [
        {
            name: 'examples',
            folders: [],
            files: [
                {
                    id: 'example-001',
                    name: 'getRootWebFolders.js',
                    code: 'foo, bar'
                },
                {
                    id: 'example-002',
                    name: 'app.less',
                },
                {
                    id: 'example-003',
                    name: 'index.html',
                }
            ]
        },
        {
            name: 'built-in',
            collapsed: true,
            folders: [],
            files: [
                {
                    id: 'builtin-001',
                    name: 'node.js',
                },
                {
                    id: 'builtin-002',
                    name: 'react-ui-tree.css',
                },
                {
                    id: 'builtin-003',
                    name: 'react-ui-tree.js',
                },
                {
                    id: 'builtin-004',
                    name: 'tree.js',
                }
            ]
        },
    ],
    files: []
};