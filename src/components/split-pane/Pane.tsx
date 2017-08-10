import * as React from 'react';
import { splitType } from './index.d';

export default class Pane extends React.Component<PaneProps, any> {
    public render() {
        const { id, style, split, className } = this.props;
        let paneStyle: React.CSSProperties = {
            overflow: 'hidden',
            display: 'flex',
            flexDirection: split === 'horizontal' ? 'column' : 'row',
            ...style
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