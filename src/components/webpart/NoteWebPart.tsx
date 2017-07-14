import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';

import { WebPartBase } from './WebPartBase'
import { Util } from '../../models';

@observer
export class NoteWebPart extends WebPartBase {

    renderWebPartContent(props) {
        return (
            <textarea 
                value={props.text}
                onChange={this.onNoteChanged}
                style={{
                    flex: '1',
                    resize: 'none',
                    border: 'none',
                    outline: 'none'
                }}
            />
        )
    }

    @action.bound
    private onNoteChanged(newValue: any) {
        if (!isObservable(this.props.settings.props.text)) {
            extendObservable(this.props.settings.props, {
                text: newValue.target.value
            });
        }
        super.onWebPartSettingsChanged();
    }
}