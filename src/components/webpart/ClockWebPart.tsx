import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import * as moment from 'moment';
import { WebPartBase } from './WebPartBase'

export class ClockWebPart extends WebPartBase {
    private _timer;
    
    componentDidMount() {
        this._timer = setInterval(this.tick, 500);
    }

    componentWillUnmount() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    @autobind
    private tick() {
        this.setState({
            time: moment().format()
        });
    }

    renderWebPartContent(props) {
        return (
            <div style={{flex: '1'}}>{this.state.time}</div>
        )
    }
}