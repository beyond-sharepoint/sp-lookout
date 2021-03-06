import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';

import { BaseWebPart } from './BaseWebPart';
import { Util } from '../../models';

@observer
export class NoteWebPart extends BaseWebPart<NoteWebPartProps, any> {
    
    getDefaultWebPartProps() {
        return defaultNoteWebPartProps;
    }

    renderWebPartContent() {
        return (
            <textarea
                value={this.webPartProps.text}
                onChange={this.onNoteChanged}
                style={{
                    flex: '1 0 0%',
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent'
                }}
            />
        );
    }

    @action.bound
    private onNoteChanged(newValue: any) {
        this.webPartProps.text = newValue.target.value;
        super.onWebPartPropertiesChanged();
    }
}

export interface NoteWebPartProps {
    text: string;
}

export const defaultNoteWebPartProps: NoteWebPartProps = {
    text: ''
};