/// <reference path="../../node_modules/@types/requirejs/index.d.ts" />
/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />
import { observable, map } from 'mobx';

export class ScriptFile {

    @observable
    name: string = '';

    @observable
    description: string = '';

    @observable
    locked: boolean = false;

    @observable
    starred: boolean = false;

    @observable
    code: string = 'const foo = "Hello, world!";\nexport default foo;';

    @observable
    defaultScriptProps: any = {};

    @observable
    cursorLineNumber: number = 1;

    @observable
    cursorColumn: number = 1;

    @observable
    theme: string = 'vs';

    @observable
    lastResult: any = {};

    @observable
    editorOptions: monaco.editor.IEditorOptions = defaultEditorOptions;

    @observable
    requireConfig: RequireConfig = {
        paths: defaultPaths
    };

    @observable
    brewTimeout: number = 5000;

    @observable
    autoSaveArrayBufferResults: boolean = true;
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
    'jszip': 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.1/jszip.min',
    'punycode': 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/punycode.min',
    'IPv6': 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/IPv6.min',
    'SecondLevelDomains': 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/SecondLevelDomains.min',
    'urijs': 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI',
    'xlsx': 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.11.0/xlsx.full.min',
    'rrule': require('file-loader!rrule')
};