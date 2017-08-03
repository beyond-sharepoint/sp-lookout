/// <reference path="../../node_modules/@types/requirejs/index.d.ts" />
/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

export interface FiddleSettings {
    name: string;
    description: string;
    locked: boolean;
    starred: boolean;
    code: string;
    cursorLineNumber: number;
    cursorColumn: number;
    theme: string;
    lastResult: any;
    editorOptions: monaco.editor.IEditorOptions;
    requireConfig: RequireConfig;
    brewTimeout: number;
    autoSaveArrayBufferResults: boolean;
}

export const defaultEditorOptions: monaco.editor.IEditorOptions = {
    automaticLayout: true,
    cursorBlinking: 'blink',
    folding: true,
    minimap: {
        enabled: true
    },
    readOnly: false,
    scrollBeyondLastLine: false,
    wordWrap: 'off'
};

export const defaultPaths = {
    'lodash': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min',
    'sp-pnp-js': 'https://cdnjs.cloudflare.com/ajax/libs/sp-pnp-js/2.0.6/pnp.min',
    'moment': 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min',
    'react': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react',
    'react-dom': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom',
    'react-dom-server': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom-server',
    'chartjs': 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min',
    'async': 'https://cdnjs.cloudflare.com/ajax/libs/async/2.5.0/async.min',
    'bluebird': 'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.5.0/bluebird.min',
    'jszip': 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min',
    'urijs': 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI.min',
    'xlsx': 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.11.0/xlsx.min',
    'rrule': require('file-loader!rrule')
};

export const defaultFiddleSettings: FiddleSettings = {
    name: '',
    description: '',
    locked: false,
    starred: false,
    code: 'const foo = "Hello, world!";\nexport default foo;',
    cursorLineNumber: 1,
    cursorColumn: 1,
    lastResult: null,
    theme: 'vs',
    editorOptions: defaultEditorOptions,
    requireConfig: {
        paths: defaultPaths
    },
    brewTimeout: 5000,
    autoSaveArrayBufferResults: true
};