import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { BaseWebPart } from './BaseWebPart';
import { Util } from '../../models';

@observer
export class TextWebPart extends BaseWebPart<TextWebPartProps, any> {

    getDefaultWebPartProps() {
        return defaultTextWebPartProps;
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    public renderWebPartContent(props: any) {
        return (
            <div>{this.webPartProps.text}</div>
        );
    }

    public renderWebPartSettings() {
        return (
            <div>
                <TextField label="Text to Display" value={this.webPartProps.text} onChanged={this.onTextChanged} />
            </div>
        );
    }

    @action.bound
    private onTextChanged(newValue: any) {
        this.webPartProps.text = newValue;
        super.onWebPartPropertiesChanged();
    }
}

export interface TextWebPartProps {
    text: string;
}

export const defaultTextWebPartProps: TextWebPartProps = {
    text: ''
};