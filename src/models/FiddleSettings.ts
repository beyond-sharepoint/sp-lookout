/// <reference path="../../node_modules/@types/requirejs/index.d.ts" />
/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

export interface FiddleSettings {
    name: string;
    description: string;
    locked: boolean;
    starred: boolean;
    code: string;
    theme: string;
    lastResult: any;
    editorOptions: monaco.editor.IEditorOptions;
    requireConfig: RequireConfig;
    brewMode: 'require' | 'sandfiddle';
    brewTimeout: number;
}

export const defaultEditorOptions: monaco.editor.IEditorOptions = {
    automaticLayout: true,
    scrollBeyondLastLine: false,
    folding: true,
    minimap: {
        enabled: true
    }
};

export const defaultPaths = {
    'tslib': 'https://unpkg.co/tslib/tslib',
    'lodash': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min',
    'sp-pnp-js': 'https://cdnjs.cloudflare.com/ajax/libs/sp-pnp-js/2.0.6/pnp.min',
    'moment': 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min',
    'react': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react',
    'react-dom': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom',
    'react-dom-server': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom-server',
    'Chartjs': 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min',
    'rrule': require('file-loader!rrule')
};

export const defaultFiddleSettings: FiddleSettings = {
    name: '',
    description: '',
    locked: false,
    starred: false,
    code: 'const foo = "Hello, world!";\nexport default foo;',
    lastResult: null,
    theme: 'vs',
    editorOptions: defaultEditorOptions,
    requireConfig: {
        paths: defaultPaths
    },
    brewTimeout: 5000,
    brewMode: 'sandfiddle',
};