import * as React from 'react';

export default class MonacoEditor extends React.Component<MonacoEditorProps, {}> {
    public static defaultProps: Partial<MonacoEditorProps> = {
        width: '100%',
        height: '100%',
        value: null,
        defaultValue: '',
        language: 'javascript',
        theme: 'vs',
        options: {},
        editorDidMount: () => { },
        editorWillMount: () => { },
        onChange: () => { },
        requireConfig: {}
    };

    private _currentValue: string | null;
    private _preventTriggerChangeEvent: boolean;
    private editor: any;

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

        const context = this.props.context || window;
        if (this.props.value !== this._currentValue) {
            // Always refer to the latest value
            this._currentValue = this.props.value || null;
            // Consider the situation of rendering 1+ times before the editor mounted
            if (this.editor) {
                this._preventTriggerChangeEvent = true;
                this.editor.setValue(this._currentValue);
                this._preventTriggerChangeEvent = false;
            }
        }
        if (prevProps.language !== this.props.language) {
            if (this.editor) {
                this.editor.setModelLanguage(this.editor.getModel(), this.props.language);
            }
        }
    }

    private editorWillMount(monaco) {
        const { editorWillMount } = this.props;
        if (typeof editorWillMount === 'function') {
            editorWillMount(monaco);
        }
    }

    private editorDidMount(editor, monaco) {
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
        const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
        const { language, theme, filename, options } = this.props;
        const containerElement = this.refs.container;
        const context = this.props.context || window;

        if (typeof context.monaco !== 'undefined') {
            // Before initializing monaco editor
            this.editorWillMount(context.monaco);
            this.editor = context.monaco.editor.create(containerElement, {
                value,
                language,
                theme,
                //model: context.monaco.editor.createModel(value || '', language || 'typescript', filename || './spfiddle1.tsx'),
                ...options
            });
            // After initializing monaco editor
            this.editorDidMount(this.editor, context.monaco);
        }
    }

    private destroyMonaco() {
        if (typeof this.editor !== 'undefined') {
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
            height: fixedHeight,
        };
        return (
            <div ref="container" style={style} className="react-monaco-editor-container"/>
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
    theme?: string;
    filename?: string;
    options?: Object;
    editorDidMount?: Function;
    editorWillMount?: Function;
    onChange?: Function;
    requireConfig?: any;
}