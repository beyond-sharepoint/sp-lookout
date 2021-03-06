/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import * as React from 'react';
import { defaultsDeep, isEqual } from 'lodash';
import { autobind } from 'office-ui-fabric-react/lib';

export default class MonacoEditor extends React.Component<MonacoEditorProps, {}> {
    public static defaultProps: Partial<MonacoEditorProps> = {
        width: '100%',
        height: '100%',
        value: null,
        defaultValue: '',
        language: 'javascript',
        theme: 'vs',
        options: {},
        editorDidMount: () => { return; },
        editorWillMount: () => { return; },
        onChange: () => { return; },
        requireConfig: {}
    };

    private _currentValue: string | null;
    private _preventTriggerChangeEvent: boolean;
    private _containerElement: HTMLDivElement | null;
    private editor: monaco.editor.ICodeEditor;

    public constructor(props: MonacoEditorProps) {
        super(props);
        this._currentValue = props.value || null;
    }

    public componentDidMount() {
        this.afterViewInit();
    }

    public componentWillUnmount() {
        this.destroyMonaco();
    }

    public componentDidUpdate(prevProps: MonacoEditorProps) {

        // Consider the situation of rendering 1+ times before the editor mounted
        if (!this.editor) {
            return;
        }

        const context = this.props.context || window;
        if (this.props.value !== this._currentValue) {
            // Always refer to the latest value
            this._currentValue = this.props.value || '';
            this._preventTriggerChangeEvent = true;
            this.editor.setValue(this._currentValue);
            this._preventTriggerChangeEvent = false;
        }

        if (prevProps.filename !== this.props.filename || prevProps.language !== this.props.language) {
            const model = this.editor.getModel();
            if (model) {
                model.dispose();
            }

            const newModel = context.monaco.editor.createModel(this.props.value || '', this.props.language || 'typescript', this.props.filename || './spfiddle.ts');
            this.editor.setModel(newModel);
        }

        if (prevProps.theme !== this.props.theme) {
            (window as any).monaco.editor.setTheme(this.props.theme);
        }

        if (this.props.options && !isEqual(prevProps.options, this.props.options)) {
            this.editor.updateOptions(this.props.options);
        }
    }

    @autobind
    private onDidScrollChange(e: monaco.IScrollEvent) {
        const { onScrollChange } = this.props;
        if (typeof onScrollChange === 'function') {
            onScrollChange(e);
        }
    }

    @autobind
    private onDidChangeCursorPosition(e: monaco.editor.ICursorPositionChangedEvent) {
        const { onCursorPositionChange } = this.props;
        if (typeof onCursorPositionChange === 'function') {
            onCursorPositionChange(e);
        }
    }

    private editorWillMount(monaco: any) {
        const { editorWillMount } = this.props;
        if (typeof editorWillMount === 'function') {
            editorWillMount(monaco);
        }
    }

    private editorDidMount(editor: monaco.editor.ICodeEditor, monaco: any) {
        const { editorDidMount, onChange } = this.props;

        if (typeof editorDidMount === 'function') {
            editorDidMount(editor, monaco);
        }

        editor.onDidChangeModelContent(event => {
            const value = editor.getValue();

            // Always refer to the latest value
            this._currentValue = value;

            // Only invoking when user input changed
            if (!this._preventTriggerChangeEvent) {
                if (typeof onChange === 'function') {
                    onChange(value, event);
                }
            }
        });
    }

    private afterViewInit() {
        const { requireConfig } = this.props;
        const loaderUrl = requireConfig.url || 'vs/loader.js';
        const context = this.props.context || window;
        const onGotAmdLoader = () => {
            if (context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__) {
                // Do not use webpack
                if (requireConfig.paths && requireConfig.paths.vs) {
                    context.require.config(requireConfig);
                }
            }

            if (!context.require) {
                return;
            }
            // Load monaco
            context.require(['vs/editor/editor.main'], () => {
                this.initMonaco();
            });

            // Call the delayed callbacks when AMD loader has been loaded
            if (context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__) {
                context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__ = false;
                let loaderCallbacks = context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__;
                if (loaderCallbacks && loaderCallbacks.length) {
                    let currentCallback = loaderCallbacks.shift();
                    while (currentCallback) {
                        currentCallback.fn.call(currentCallback.context);
                        currentCallback = loaderCallbacks.shift();
                    }
                }
            }
        };

        // Load AMD loader if necessary
        if (context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__) {
            // We need to avoid loading multiple loader.js when there are multiple editors loading concurrently
            //  delay to call callbacks except the first one
            context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__ = context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__ || [];
            context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__.push({
                context: this,
                fn: onGotAmdLoader
            });
        } else {
            if (typeof context.require === 'undefined') {
                var loaderScript = context.document.createElement('script');
                loaderScript.type = 'text/javascript';
                loaderScript.src = loaderUrl;
                loaderScript.addEventListener('load', onGotAmdLoader);
                context.document.body.appendChild(loaderScript);
                context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__ = true;
            } else {
                onGotAmdLoader();
            }
        }
    }

    private initMonaco() {
        const context = this.props.context || window;

        if (typeof context.monaco === 'undefined') {
            return;
        }

        const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
        const { language, theme, filename, options } = this.props;
        const containerElement = this._containerElement;

        // Before initializing monaco editor
        this.editorWillMount(context.monaco);

        const editorOptions: monaco.editor.IEditorOptions = defaultsDeep(
            {
                value,
                language,
                theme,
                model: context.monaco.editor.createModel(value || '', language || 'typescript', filename || './spfiddle.ts'),
            },
            options
        );

        this.editor = context.monaco.editor.create(containerElement, editorOptions);

        // After initializing monaco editor
        this.editorDidMount(this.editor, context.monaco);

        // Wire up events.
        this.editor.onDidScrollChange(this.onDidScrollChange);
        this.editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition);
    }

    private destroyMonaco() {
        if (typeof this.editor !== 'undefined') {
            //Destroy the model associated with the editor.
            const model = this.editor.getModel();
            if (model) {
                model.dispose();
            }

            if (typeof this.props.editorWillDispose === 'function') {
                this.props.editorWillDispose(this.editor);
            }

            this.editor.dispose();
        }
    }

    public render() {
        let { width, height } = this.props;
        width = width || '100%';
        height = height || '100%';

        const fixedWidth = width.toString().indexOf('%') !== -1 ? width : `${width}px`;
        const fixedHeight = height.toString().indexOf('%') !== -1 ? height : `${height}px`;
        const style = {
            width: fixedWidth,
            //height: fixedHeight,
            flex: '1 0 0%',
            ...this.props.style
        };
        return (
            <div ref={el => this._containerElement = el} style={style} className="react-monaco-editor-container" />
        );
    }
}

export interface MonacoEditorProps {
    width?: string | number;
    height?: string | number;
    value?: string | null;
    defaultValue?: string;
    context?: any;
    language?: string;
    filename?: string;
    theme?: string;
    options?: monaco.editor.IEditorOptions;
    editorDidMount?: Function;
    editorWillMount?: Function;
    editorWillDispose?: Function;
    onChange?: Function;
    onCursorPositionChange?: (e: monaco.editor.ICursorPositionChangedEvent) => void;
    onScrollChange?: (e: monaco.IScrollEvent) => void;
    requireConfig?: any;
    style?: React.CSSProperties;
}