import * as React from 'react';
import { action, observable, isObservable, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { autobind } from 'office-ui-fabric-react/lib';

import { BaseWebPart } from './BaseWebPart'
import { Util } from '../../models';

@observer
export class BaristaWebPart extends BaseWebPart<BaristaWebPartProps, any> {

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