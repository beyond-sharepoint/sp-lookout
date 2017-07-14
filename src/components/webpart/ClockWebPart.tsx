import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { autobind } from 'office-ui-fabric-react/lib';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as moment from 'moment';
import { WebPartBase, WebPartState } from './WebPartBase';

export class ClockWebPart extends WebPartBase {
    private _timer;

    public componentWillMount() {
        this._timer = setInterval(this.tick, 500);
        if (!isObservable(this.props.settings.props.format)) {
            extendObservable(this.props.settings.props, {
                format: 'MMMM Do YYYY, h:mm:ss a'
            });
        }
    }

    public componentWillUnmount() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    public getWebPartContainerStyle(): React.CSSProperties | undefined {
        return {
            alignItems: 'center'
        };
    }

    public renderWebPartContent(props: any) {
        return (
            <div style={{ alignItems: 'center' }}>{this.state.time}</div>
        );
    }

    public renderWebPartSettings() {
        return (
            <div>
                {super.renderWebPartSettings()}
                <TextField label="Date Format" value={this.props.settings.props.format} onChanged={this.onFormatChanged} />
            </div>
        );
    }

    @autobind
    private tick() {
        this.setState({
            time: moment().format(this.props.settings.props.format || undefined)
        });
    }

    @action.bound
    private onFormatChanged(newFormat: string) {
        if (!isObservable(this.props.settings.props.format)) {
            extendObservable(this.props.settings.props, {
                format: newFormat
            });
        }
        super.onWebPartSettingsChanged();
    }
}

export interface ClockWebPartState extends WebPartState {
    time: string;
}