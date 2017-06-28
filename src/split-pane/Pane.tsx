import * as React from 'react';
import { splitType } from './Common';

export default class Pane extends React.Component<PaneProps, any> {
    public render() {
        const { hasDetailPane, id, style, split, className } = this.props;
        const isDetailPane = hasDetailPane ? 'bottom-detail-pane' : '';
        let paneStyle: React.CSSProperties = {
            ...style,
            ...{
                overflow: 'hidden'
            }
        };

        return (
            <div id={id} className={`pane ${split} ${isDetailPane} ${className || ''}`} style={paneStyle}>
                {this.props.children}
            </div>
        );
    }
}

export interface PaneProps {
    split: splitType;
    hasDetailPane?: boolean;
    id?: string;
    style?: CSSStyleRule | any;
    className?: string;
}