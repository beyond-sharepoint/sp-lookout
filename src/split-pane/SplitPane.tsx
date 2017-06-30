import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { autobind } from 'office-ui-fabric-react/lib';
import Pane from './Pane';
import Resizer from './Resizer';
import { splitType } from './Common';
import './SplitPane.css';

// TODO: Make this stateless.

export default class SplitPane extends React.Component<SplitPaneProps, SplitPaneState> {
    public static defaultProps: Partial<SplitPaneProps> = {
        split: 'vertical',
        postponed: false,
        dispatchResize: false,
        primaryPaneMaxWidth: '80%',
        primaryPaneMinWidth: 300,
        primaryPaneWidth: '50%',
        primaryPaneMaxHeight: '80%',
        primaryPaneMinHeight: 300,
        primaryPaneHeight: '50%'
    };

    private paneWrapper: any;
    private panePrimary: any;
    private paneSecondary: any;
    private resizer: any;

    constructor() {
        super();

        this.state = {
            isDragging: false
        };
    }

    public componentDidMount() {
        /********************************
        * Sets event listeners after component is mounted.
        * If there is only one pane, the resize event listener won't be added
        ********************************/
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('touchend', this.handleMouseUp);
        if (React.Children.count(this.props.children) > 1) {
            window.addEventListener('resize', this.getSize);
        }
    }

    public render() {
        /********************************
         * set width of primary pane according to props, or state
        ********************************/
        const {
            children, split,
            primaryPaneMinWidth, primaryPaneWidth, primaryPaneMaxWidth,
            primaryPaneMinHeight, primaryPaneHeight, primaryPaneMaxHeight,
            className, primaryPaneClassName, secondaryPaneClassName,
            maximizedPrimaryPane, minimalizedPrimaryPane, postponed, allowResize,
            onResizerDoubleClick
        } = this.props;

        const {
            handleBarClonePosition,
            isVisible
        } = this.state;

        let paneStyle;
        switch (split) {
            case 'vertical': {
                if (maximizedPrimaryPane) {
                    paneStyle = {
                        width: '100%',
                        minWidth: primaryPaneMinWidth,
                        maxWidth: '100%'
                    };
                } else if (minimalizedPrimaryPane) {
                    paneStyle = {
                        width: '0px',
                        minWidth: 0,
                        maxWidth: primaryPaneMaxWidth
                    };
                } else {
                    paneStyle = {
                        width: primaryPaneWidth,
                        minWidth: primaryPaneMinWidth,
                        maxWidth: primaryPaneMaxWidth
                    };
                }
                break;
            }
            case 'horizontal': {
                if (maximizedPrimaryPane) {
                    paneStyle = {
                        height: '100%',
                        minHeight: 0,
                        maxHeight: '100%'
                    };
                } else if (minimalizedPrimaryPane) {
                    paneStyle = {
                        height: '0px',
                        minHeight: 0,
                        maxHeight: primaryPaneMaxHeight
                    };
                } else {
                    paneStyle = {
                        height: primaryPaneHeight,
                        minHeight: primaryPaneMinHeight,
                        maxHeight: primaryPaneMaxHeight
                    };
                }
                break;
            }
            default:
                throw Error(`Unknown or unexpected split type: ${split}`);
        }

        if (!children[1]) {
            var onePaneStyle: any = {
                width: '100%',
                maxWidth: '100%',
                height: '100%'
            };
        }

        let handlebarClone;
        if (React.Children.count(children) > 1 && postponed) {
            handlebarClone = {
                [split === 'vertical' ? 'left' : 'top']: handleBarClonePosition + 'px'
            };
        }

        return (
            <div
                className={`splitter ${split === 'vertical' ? 'vertical' : 'horizontal'} ${className || ''}`}
                style={onePaneStyle !== 'undefined' ? onePaneStyle : null}
                ref={node => this.paneWrapper = node}
            >
                <Pane
                    className={`primary ${primaryPaneClassName || ''}`}
                    split={split}
                    style={paneStyle}
                    ref={(node) => this.panePrimary = node}
                >
                    {!children[1] ? children : children[0]}
                </Pane>

                {
                    children[1]
                        ? <Resizer
                            split={split}
                            onMouseDown={this.handleMouseDown}
                            onDoubleClick={(e) => onResizerDoubleClick ? onResizerDoubleClick(e, this) : undefined}
                            ref={node => this.resizer = node}
                            allowResize={allowResize}
                        />
                        : null
                }

                {
                    postponed && isVisible
                        ? <div
                            className={`resizer resizer_clone ${split === 'vertical' ? 'vertical' : 'horizontal'} `}
                            style={handlebarClone}
                        />
                        : null
                }

                {
                    children[1]
                        ? <Pane
                            className={secondaryPaneClassName || ''}
                            split={split}
                            hasDetailPane={this.props.hasDetailPane}
                            ref={node => this.paneSecondary = node}
                        >
                            {children[1]}
                        </Pane>
                        : null
                }
            </div>
        );
    }

    private unselectAll(): void {
        try {
            window.getSelection().removeAllRanges();
        } catch (e) {
            console.warn(e);
        }
    }

    private getPrimaryPaneWidth(
        position: string,
        lastX: number,
        lastY: number,
        maxMousePosition: number,
        resizerOffsetFromParent: number,
        primaryPaneMinHeight: number,
        primaryPaneMinWidth: number
    ): number {

        let primaryPanePosition;

        switch (position) {
            case 'horizontal': {
                if (lastY > maxMousePosition) {
                    primaryPanePosition = maxMousePosition - resizerOffsetFromParent;
                } else if ((lastY - resizerOffsetFromParent) <= primaryPaneMinHeight) {
                    primaryPanePosition = primaryPaneMinHeight + 0.001;
                } else {
                    primaryPanePosition = lastY - resizerOffsetFromParent;
                }
                break;
            }
            case 'vertical':
            default: {
                if (lastX >= maxMousePosition) {
                    primaryPanePosition = maxMousePosition - resizerOffsetFromParent;
                } else if ((lastX - resizerOffsetFromParent) <= primaryPaneMinWidth) {
                    primaryPanePosition = primaryPaneMinWidth + 0.001;
                } else {
                    primaryPanePosition = lastX - resizerOffsetFromParent;
                }
                break;
            }
        }

        return primaryPanePosition;
    }

    /**
     * Calculates the max position of a mouse in the current splitter from given percentage.
     * @param cX 
     * @param cY 
     */
    @autobind
    private getSize(cX?: Number | any, cY?: Number | any) {
        let maxMousePosition;
        let nodeWrapperSize;
        let primaryPaneOffset;
        let wrapper = ReactDOM.findDOMNode(this.paneWrapper).getBoundingClientRect();
        let primaryPane = ReactDOM.findDOMNode(this.panePrimary).getBoundingClientRect();
        let resizerSize = ReactDOM.findDOMNode(this.resizer).getBoundingClientRect();
        const posInHandleBar = this.props.split === 'vertical'
            ? resizerSize.left - cX
            : resizerSize.top - cY;

        // find only letters from string
        const regEx = new RegExp(/\D+/gi);

        if (this.props.split === 'vertical') {
            // split the maxWidth/maxHeight string to string and numbers
            let maxWidthStr = this.props.primaryPaneMaxWidth.match(regEx)[0].toLowerCase();
            let maxWidthNum = parseFloat(this.props.primaryPaneMaxWidth.split(regEx)[0]);
            nodeWrapperSize = wrapper.width;
            primaryPaneOffset = primaryPane.left;

            if (maxWidthStr === '%') {
                maxMousePosition =
                    Math.floor((nodeWrapperSize * (maxWidthNum / 100)) + primaryPaneOffset - (resizerSize.width + posInHandleBar));
            } else if (maxWidthStr === 'px') {
                maxMousePosition =
                    Math.floor((maxWidthNum + primaryPaneOffset) - resizerSize.width);
            }
        } else {
            let maxHeightStr = this.props.primaryPaneMaxHeight.match(regEx)[0].toLowerCase();
            let maxHeightNum = parseFloat(this.props.primaryPaneMaxHeight.split(regEx)[0]);
            nodeWrapperSize = wrapper.height;
            primaryPaneOffset = primaryPane.top;

            if (maxHeightStr === '%') {
                maxMousePosition =
                    Math.floor((nodeWrapperSize * (maxHeightNum / 100)) + primaryPaneOffset - (resizerSize.height + posInHandleBar));
            } else if (maxHeightStr === 'px') {
                maxMousePosition =
                    Math.floor((maxHeightNum + primaryPaneOffset) - resizerSize.height);
            }
        }

        this.setState({
            maxMousePosition
        });
    }

    @autobind
    private handleMouseDown(e: any) {
        /********************************
        * If the right button was clicked - stop the function
        * If there is more then one pane, we get the sizes of panes + max pos of mouse in splitter
        * add event listener for touch move and mouse move
        ********************************/
        if (e.button === 2 || this.props.allowResize === false) {
            return;
        }

        let handleBarOffsetFromParent;
        let clientX;
        let clientY;

        if (e.type === 'mousedown') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (React.Children.count(this.props.children) > 1) {
            this.getSize(clientX, clientY);
        }

        if (this.props.split === 'horizontal') {
            handleBarOffsetFromParent = clientY - e.target.offsetTop;
        } else if (this.props.split === 'vertical') {
            handleBarOffsetFromParent = clientX - e.target.offsetLeft;
        }

        this.setState({
            isDragging: true,
            handleBarOffsetFromParent
        });
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('touchmove', this.handleMouseMove);
    }

    @autobind
    private handleMouseMove(e: any) {
        /********************************
        * check if the state is still isDragging, if not, stop the function
        * unselectAll - unselect all selected text
        * check position of mouse in the splitter and and set the width or height of primary pane
        * save last positions of X and Y coords (that is necessary for touch screen)
        ********************************/
        if (!this.state.isDragging) {
            return;
        }

        this.unselectAll();

        const {
            handleBarOffsetFromParent,
            maxMousePosition
        } = this.state;

        const {
            split,
            onPaneResized,
            primaryPaneMinWidth,
            primaryPaneMinHeight,
            postponed
        } = this.props;

        let clientX;
        let clientY;

        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const primaryPanePosition = this.getPrimaryPaneWidth(split, clientX, clientY, maxMousePosition, handleBarOffsetFromParent, primaryPaneMinHeight, primaryPaneMinWidth);

        if (postponed) {
            this.setState({
                handleBarClonePosition: primaryPanePosition,
                lastX: clientX,
                lastY: clientY,
                isVisible: true
            });
        } else {
            onPaneResized(primaryPanePosition);
            this.setState({
                lastX: clientX,
                lastY: clientY
            });
        }
    }

    @autobind
    private handleMouseUp(e: any) {
        if (!this.state.isDragging) {
            return;
        }

        const {
            handleBarOffsetFromParent,
            lastX, lastY, maxMousePosition
        } = this.state;

        const {
            split,
            onPaneResized,
            primaryPaneMinWidth,
            primaryPaneMinHeight,
            postponed
        } = this.props;

        const primaryPanePosition = this.getPrimaryPaneWidth(split, lastX, lastY, maxMousePosition, handleBarOffsetFromParent, primaryPaneMinHeight, primaryPaneMinWidth);

        if (postponed) {
            this.setState({
                isDragging: false,
                isVisible: false
            });
        } else {
            onPaneResized(primaryPanePosition);
            this.setState({
                isDragging: false
            });
        }

        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchmove', this.handleMouseMove);

        // call resize event to trigger method for updating of DataGrid width
        // TODO: add this event for IE11
        if (typeof this.props.dispatchResize === 'boolean') {
            window.dispatchEvent(new Event('resize'));
        }

        // callback function from parent component
        if (typeof this.props.onDragFinished === 'function') {
            this.props.onDragFinished();
        }

        if (React.Children.count(this.props.children) > 1) {
            this.getSize(lastX, lastY);
        }
    }
}

export interface SplitPaneProps {
    children?: {} | any;
    split: splitType;
    hasDetailPane?: boolean;
    primaryPaneMinWidth?: number | any;
    primaryPaneWidth?: string | any;
    primaryPaneMaxWidth?: string | any;
    primaryPaneMinHeight?: number | any;
    primaryPaneHeight?: string | any;
    primaryPaneMaxHeight?: string | any;
    className?: string;
    primaryPaneClassName?: string;
    secondaryPaneClassName?: string;
    dispatchResize?: Boolean;
    maximizedPrimaryPane?: Boolean;
    minimalizedPrimaryPane?: Boolean;
    postponed?: Boolean;
    onPaneResized: Function;
    onDragFinished?: Function;
    onResizerDoubleClick?: (e: React.MouseEvent<HTMLDivElement>, splitPane: SplitPane) => void;
    allowResize?: Boolean;
}

export interface SplitPaneState {
    isDragging?: boolean;
    maxMousePosition?: number | any;
    handleBarOffsetFromParent?: number | any;
    //primaryPane?: number | any;
    lastX?: number | any;
    lastY?: number | any;
    handleBarClonePos?: number | any;
    isVisible?: Boolean;
    handleBarClonePosition?: number;
}