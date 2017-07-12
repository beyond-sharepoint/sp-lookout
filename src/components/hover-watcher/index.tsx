import * as React from 'react';
import { autobind } from 'office-ui-fabric-react/lib';
import { omit } from 'lodash';

export default class HoverWatcher extends React.Component<HoverWatcherProps, HoverWatcherState> {
    public static defaultProps: Partial<HoverWatcherProps> = {
        hoverDelayInMs: 0,
        hoverOffDelayInMs: 0,
        onMouseEnter: ({ setIsHovering }) => setIsHovering(),
        onMouseLeave: ({ unsetIsHovering }) => unsetIsHovering(),
        shouldDecorateChildren: true
    };

    private _timerIds: Array<any>;
    
    constructor(props) {
        super(props);

        this.state = {
            isHovering: false
        };

        this._timerIds = [];
    }

    @autobind
    private onMouseEnter(e) {
        if (typeof this.props.onMouseEnter === 'function') {
            this.props.onMouseEnter({
                e,
                setIsHovering: this.setIsHovering,
                unsetIsHovering: this.unsetIsHovering
            });
        }
    }

    @autobind
    private onMouseLeave(e) {
        if (typeof this.props.onMouseLeave === 'function') {
            this.props.onMouseLeave({
                e,
                setIsHovering: this.setIsHovering,
                unsetIsHovering: this.unsetIsHovering
            });
        }
    }

    @autobind
    private onMouseOver(e) {
        if (typeof this.props.onMouseOver === 'function') {
            this.props.onMouseOver({
                e,
                setIsHovering: this.setIsHovering,
                unsetIsHovering: this.unsetIsHovering
            });
        }
    }

    @autobind
    private onMouseOut(e) {
        if (typeof this.props.onMouseOut === 'function') {
            this.props.onMouseOut({
                e,
                setIsHovering: this.setIsHovering,
                unsetIsHovering: this.unsetIsHovering
            });
        }
    }

    @autobind
    private setIsHovering() {
        this.clearTimers();

        const hoverScheduleId = setTimeout(() => {
            const newState = { isHovering: true };
            this.setState(newState, () => {
                if (typeof this.props.onHoverChanged === 'function') {
                    this.props.onHoverChanged(newState)
                }
            });
        }, this.props.hoverDelayInMs);

        this._timerIds.push(hoverScheduleId);
    }

    @autobind
    private unsetIsHovering() {
        this.clearTimers();

        const hoverOffScheduleId = setTimeout(() => {
            const newState = { isHovering: false };
            this.setState(newState, () => {
                if (typeof this.props.onHoverChanged === 'function') {
                    this.props.onHoverChanged(newState);
                }
            });
        }, this.props.hoverOffDelayInMs);

        this._timerIds.push(hoverOffScheduleId);
    }

    private clearTimers() {
        const ids = this._timerIds;
        while (ids.length) {
            clearTimeout(ids.pop());
        }
    }

    private isReactComponent(reactElement) {
        return typeof reactElement.type === 'function';
    }

    private shouldDecorateChild(child) {
        return this.isReactComponent(child) && this.props.shouldDecorateChildren;
    }

    private decorateChild(child, props) {
        return React.cloneElement(child, props);
    }

    private renderChildrenWithProps(children, props) {
        return React.Children.map(children, (child) => {
            return this.shouldDecorateChild(child) ? this.decorateChild(child, props) : child;
        });
    }

    @autobind
    public componentWillUnmount() {
        this.clearTimers();
    }

    public render() {
        const { children, className } = this.props;
        const childProps = {
            isHovering: this.state.isHovering,
            ...omit(this.props, [
                'children',
                'className',
                'hoverDelayInMs',
                'hoverOffDelayInMs',
                'onHoverChanged',
                'onMouseEnter',
                'onMouseLeave',
                'onMouseOver',
                'onMouseOut',
                'shouldDecorateChildren'
            ])
        };

        return (
            <div { ...{
                className,
                onMouseEnter: this.onMouseEnter,
                onMouseLeave: this.onMouseLeave,
                onMouseOver: this.onMouseOver,
                onMouseOut: this.onMouseOut
            }}>
                {this.renderChildrenWithProps(children, childProps)}
            </div>
        );
    }
};

export interface HoverWatcherState {
    isHovering: boolean;
}

export interface HoverWatcherProps {
    className?: string;
    hoverDelayInMs?: number;
    hoverOffDelayInMs?: number;
    onHoverChanged?: Function
    onMouseEnter?: Function;
    onMouseLeave?: Function;
    onMouseOver?: Function;
    onMouseOut?: Function;
    shouldDecorateChildren?: boolean
}