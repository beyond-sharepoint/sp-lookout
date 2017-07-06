import { autorun, observable, observe, action, runInAction, toJS } from 'mobx';

export class FiddleState {
    @observable
    id: string;

    @observable
    filename: string;

    @observable
    language: string;

    @observable
    code: string;

    @observable
    theme: string;

    @observable
    lastResult: any;

    @observable
    editorOptions: FiddleEditorOptions;

    @observable
    baseUrl: string;

    @observable
    importPaths: { [id: string]: string };

    @observable
    brewMode: 'require' | 'sandfiddle';

    @observable
    brewTimeout: number;

    constructor() {
        //Set defaults
        this.filename = 'spfiddle.ts';
        this.language = 'typescript';
        this.theme = 'vs';
        this.code = 'const foo = "Hello, world!";\nexport default foo;';
        this.importPaths = FiddleState.defaultImportPaths;
        this.editorOptions = FiddleEditorOptions.defaultFiddleEditorOptions;
        this.brewTimeout = 5000;
        this.brewMode = 'sandfiddle';
    }

    static defaultImportPaths = {
        'tslib': 'https://unpkg.co/tslib/tslib',
        'lodash': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min',
        'sp-pnp-js': 'https://cdnjs.cloudflare.com/ajax/libs/sp-pnp-js/2.0.6/pnp.min',
        'moment': 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min',
        'react': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react',
        'react-dom': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom',
        'react-dom-server': 'https://cdnjs.cloudflare.com/ajax/libs/react/15.6.1/react-dom-server',
        'Chartjs': 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min'
    };
}

export class FiddleEditorMinimapOptions {
    @observable
    enabled: boolean;

    constructor() {
        this.enabled = true;
    }
}

export class FiddleEditorOptions {
    @observable
    automaticLayout: boolean;

    @observable
    scrollBeyondLastLine: boolean;

    @observable
    folding: boolean;

    @observable
    minimap: FiddleEditorMinimapOptions;

    @observable
    jsx: string;

    static defaultFiddleEditorOptions: FiddleEditorOptions = {
        automaticLayout: true,
        scrollBeyondLastLine: false,
        folding: true,
        minimap: new FiddleEditorMinimapOptions(),
        jsx: 'react'
    };
}