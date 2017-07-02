import * as React from 'react';
import SplitPane from '../../split-pane/SplitPane';
import MonacoEditor from '../../monaco-editor';

export default class Fiddle extends React.Component<FiddleProps, any> {
    private editorOptions;
    public constructor(props) {
        super(props);

        this.state = {
            fiddlePaneSize: '50%'
        }

        this.editorOptions = {
            automaticLayout: true
        };
    }
    public render() {
        return (
            <SplitPane
                split="vertical"
                className="left-sidebar"
                primaryPaneSize={this.state.fiddlePaneSize}
                primaryPaneMinSize={0}
                onPaneResized={(size) => { this.setState({ fiddlePaneSize: size }); }}
                onResizerDoubleClick={() => { this.setState({ fiddlePaneSize: '50%' }); }}
            >
                <MonacoEditor
                    options={this.editorOptions}
                ></MonacoEditor>
                <div>fdsa</div>
            </SplitPane>
        )
    }
}

export interface FiddleProps {
}