import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';

import { WebPartBase } from './WebPartBase'
import { Util } from '../../models';

@observer
export class BaristaWebPart extends WebPartBase<BaristaWebPartProps, any> {

    getDefaultWebPartProps() {
        return {};
    }

    renderWebPartContent(props) {
        return (
            <span></span>
        )
    }
}

export interface BaristaWebPartProps {
}