import { FiddleSettings } from './FiddleSettings';

export interface FiddleFolder {
    name: string;
    collapsed?: boolean;
    locked?: boolean;
    starred?: boolean;
    iconClassName?: string;
    files: Array<FiddleSettings>;
    folders: Array<FiddleFolder>;
}

export const defaultFiddleFolder: FiddleFolder = {
    name: 'SPFiddle',
    collapsed: false,
    locked: false,
    starred: false,
    files: [],
    folders: []
}

export const defaultFiddleRootFolder: FiddleFolder = {
    name: 'SPFiddle',
    collapsed: false,
    iconClassName: 'fa fa-code',
    folders: [
        {
            name: 'examples',
            locked: true,
            folders: [],
            files: [
                {
                    name: '01-helloWorld.ts',
                    code: `export default 'hello, world!';`
                },
                {
                    name: '02-importLodash.ts',
                    code: `import * as _ from 'lodash';
export default _.kebabCase('Hello, World!');`
                },
                {
                    name: '03-getRootWeb-fetch.ts',
                },
                {
                    name: '04-getRootWeb-sp-pnp.ts',
                    code: `import * as _ from 'lodash';
import * as pnp from 'sp-pnp-js';

let web = new pnp.Web(location.origin);

export default web.get();`
                },
                {
                    name: '12-customComponents-ts',
                    code: `import * as ReactDOMServer from 'react-dom-server'`
                }
            ]
        },
        {
            name: 'built-in',
            collapsed: true,
            locked: true,
            folders: [],
            files: [
                {
                    name: 'node.js',
                },
                {
                    name: 'react-ui-tree.css',
                },
                {
                    name: 'react-ui-tree.js',
                },
                {
                    name: 'tree.js',
                }
            ]
        },
    ],
    files: []
};