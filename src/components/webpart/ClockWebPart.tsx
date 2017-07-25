import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as moment from 'moment';
import { BaseWebPart, BaseWebPartState } from './BaseWebPart';

@observer
export class ClockWebPart extends BaseWebPart<ClockWebPartProps, ClockWebPartState> {
    private _timer;

    public componentWillMount() {
        super.componentWillMount();
        this.tick();
        this._timer = setInterval(this.tick, 500);
    }

    public componentWillUnmount() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    getDefaultWebPartProps() {
        return {
            format: 'MMMM Do YYYY, h:mm:ss a'
        };
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    public renderWebPartContent() {
        return (
            <div>{this.state.time}</div>
        );
    }

    public renderWebPartSettings() {
        return (
            <div>
                <TextField label="Date Format" value={this.webPartProps.format} onChanged={this.onFormatChanged} />
            </div>
        );
    }

    @action.bound
    private tick() {
        this.setState({
            time: moment().format(this.webPartProps.format || undefined)
        });
    }

    @action.bound
    private onFormatChanged(newFormat: string) {
        this.webPartProps.format = newFormat;
        super.onWebPartPropertiesChanged();
    }
}

export interface ClockWebPartState extends BaseWebPartState {
    time: string;
}

export interface ClockWebPartProps {
    format: string;
}