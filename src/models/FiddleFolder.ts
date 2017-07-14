import { FiddleSettings, defaultFiddleSettings, defaultEditorOptions, defaultPaths } from './FiddleSettings';

export interface FiddleFolder {
    name: string;
    collapsed: boolean;
    locked: boolean;
    starred: boolean;
    iconClassName: string;
    files: Array<FiddleSettings>;
    folders: Array<FiddleFolder>;
}

export const defaultFiddleFolder: FiddleFolder = {
    name: 'SPFiddle',
    collapsed: false,
    locked: false,
    starred: false,
    iconClassName: '',
    files: [],
    folders: []
}

export const defaultFiddleRootFolder: FiddleFolder = {
    ...defaultFiddleFolder,
    name: 'SPFiddle',
    iconClassName: 'fa fa-code',
    folders: [
        {
            ...defaultFiddleFolder,
            name: 'examples',
            locked: true,
            starred: true,
            files: [
                {
                    ...defaultFiddleSettings,
                    name: '01-helloWorld.ts',
                    code: `export default 'hello, world!';`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '02-importLodash.ts',
                    code: `import * as _ from 'lodash';
export default _.kebabCase('Hello, World!');`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '03-getRootWeb-fetch.ts',
                    code: '',
                },
                {
                    ...defaultFiddleSettings,
                    name: '04-getRootWeb-sp-pnp.ts',
                    code: `import * as _ from 'lodash';
import * as pnp from 'sp-pnp-js';

let web = new pnp.Web(location.origin);

export default web.get();`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '12-customComponents-ts',
                    code: `import * as ReactDOMServer from 'react-dom-server'`,
                }
            ]
        },
        {
            ...defaultFiddleFolder,
            name: 'built-in',
            collapsed: true,
            locked: true,
            files: [
                {
                    ...defaultFiddleSettings,
                    name: 'node.js',
                },
                {
                    ...defaultFiddleSettings,
                    name: 'react-ui-tree.css',
                },
                {
                    ...defaultFiddleSettings,
                    name: 'react-ui-tree.js',
                },
                {
                    ...defaultFiddleSettings,
                    name: 'tree.js',
                }
            ]
        },
    ],
};