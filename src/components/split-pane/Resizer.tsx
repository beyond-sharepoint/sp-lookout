import * as React from 'react';
import { splitType } from './index.d';

export default class Resizer extends React.Component<ResizerProps, any> {
    public static defaultProps: Partial<ResizerProps> = {
        allowResize: true
    };

    public render() {
        const { split, onMouseDown, onClick, onDoubleClick, allowResize } = this.props;
        let allowResizeClass = allowResize ? '' : 'resize-not-allowed';
        return (
            <div
                className={`resizer ${split} ${allowResizeClass} ms-bgColor-neutralLighter`}
                onMouseDown={(e) => {
                    onMouseDown(e);
                }}
                onTouchStart={(e) => {
                    e.preventDefault();
                    onMouseDown(e);
                }}
                onClick={(event) => {
                    if (onClick) {
                        event.preventDefault();
                        onClick(event, this);
                    }
                }}
                onDoubleClick={(event) => {
                    if (onDoubleClick) {
                        event.preventDefault();
                        onDoubleClick(event, this);
                    }
                }}
            >
                <span className="resizer_drag" />
            </div>
        );
    }
}

export interface ResizerProps {
    split: splitType;
    onMouseDown?: Function | any;
    onClick?: (e: React.MouseEvent<HTMLDivElement>, resizer: Resizer) => void;
    onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>, resizer: Resizer) => void;
    allowResize?: Boolean;
}