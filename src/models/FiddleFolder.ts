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
                    name: '01-helloWorld.ts',
                    code: `export default 'hello, world!';`
                },
                {
                    id: 'example-002',
                    name: '02-importLodash.ts',
                    code: `import * as _ from 'lodash';
export default _.kebabCase('Hello, World!');`
                },
                {
                    id: 'example-003',
                    name: '03-getRootWeb-fetch.ts',
                },
                {
                    id: 'example-003',
                    name: '03-getRootWeb-sp-pnp.ts',
                    code: `"import * as _ from 'lodash';
import * as pnp from 'sp-pnp-js';

let web = new pnp.Web(location.origin);

export default web.get();"`
                },
                {
                    id: 'example-012',
                    name: '12-customComponents-ts',
                    code: `import * from 'react-dom-server`
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