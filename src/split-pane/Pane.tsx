import * as React from 'react';
import { splitType } from './Common';

export default class Pane extends React.Component<PaneProps, any> {
    public render() {
        const { id, style, split, className } = this.props;
        let paneStyle: React.CSSProperties = {
            ...style,
            ...{
                overflow: 'hidden'
            }
        };

        return (
            <div id={id} className={`pane ${split} ${className || ''}`} style={paneStyle}>
                {this.props.children}
            </div>
        );
    }
}

export interface PaneProps {
    split: splitType;
    id?: string;
    style?: CSSStyleRule | any;
    className?: string;
}