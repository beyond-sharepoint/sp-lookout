import { FiddleSettings, defaultFiddleSettings, defaultEditorOptions, defaultPaths } from './FiddleSettings';

export interface FiddleFolder {
    name: string;
    description: string;
    collapsed: boolean;
    locked: boolean;
    starred: boolean;
    iconClassName: string;
    files: Array<FiddleSettings>;
    folders: Array<FiddleFolder>;
}

export const defaultFiddleFolder: FiddleFolder = {
    name: 'SPFiddle',
    description: '',
    collapsed: false,
    locked: false,
    starred: false,
    iconClassName: '',
    files: [],
    folders: []
};

export const defaultFiddleRootFolder: FiddleFolder = {
    ...defaultFiddleFolder,
    name: 'SPFiddle',
    description: '',
    iconClassName: 'fa fa-code',
    folders: [
        {
            ...defaultFiddleFolder,
            name: 'examples',
            description: 'Contains examples of common usages.',
            locked: true,
            starred: true,
            files: [
                {
                    ...defaultFiddleSettings,
                    name: '01-helloWorld.ts',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    code: `export default 'hello, world!';`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '02-importLodash.ts',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    code: `import * as _ from 'lodash';
export default _.kebabCase('Hello, World!');`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '03-getRootWeb-fetch.ts',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    code: `const runner = async () => {
    const response = await fetch(location.origin + "/_api/web", {
        method: "GET",
        headers: {
            "accept": "application/json",
            "content-type": "application/json;odata=verbose;charset=utf-8"
        },
        credentials: 'same-origin'
    });

    return await response.json();
}

export default runner();`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '04-getRootWeb-sp-pnp.ts',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    code: `import * as _ from 'lodash';
import * as pnp from 'sp-pnp-js';

let web = new pnp.Web(location.origin);

export default web.get();`,
                },
                {
                    ...defaultFiddleSettings,
                    name: '12-customComponents.tsx',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    code: `import * as React from 'react';
import * as ReactDOMServer from 'react-dom-server';

class MyComponent {
    render() {
        const foo = "Hello, world!";
        const styles = {
            backgroundColor: 'blue'
        };
        return (
            <div style={styles}>{foo}</div>
        )
    }
}

export default ReactDOMServer.renderToStaticMarkup((new MyComponent()).render());
`,
                }
            ]
        },
        {
            ...defaultFiddleFolder,
            name: 'built-in',
            description: 'Scripts that provide data to built-in webparts. Changes made will be reverted on next app reload.',
            collapsed: true,
            locked: true,
            files: [
                {
                    ...defaultFiddleSettings,
                    name: 'node.js',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    locked: true,
                },
                {
                    ...defaultFiddleSettings,
                    name: 'react-ui-tree.css',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    locked: true,
                },
                {
                    ...defaultFiddleSettings,
                    name: 'react-ui-tree.js',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    locked: true,
                },
                {
                    ...defaultFiddleSettings,
                    name: 'tree.js',
                    cursorColumn: 1,
                    cursorLineNumber: 1,
                    locked: true,
                }
            ]
        },
    ],
};