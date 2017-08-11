import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { autobind } from 'office-ui-fabric-react/lib';
import Pane from './Pane';
import Resizer from './Resizer';
import { splitType } from './index.d';
import './SplitPane.css';

export default class SplitPane extends React.Component<SplitPaneProps, SplitPaneState> {
    public static defaultProps: Partial<SplitPaneProps> = {
        allowResize: true,
        split: 'vertical',
        primaryPaneMinSize: 0,
        primaryPaneSize: '50%'
    };

    private paneWrapper: HTMLDivElement;
    private panePrimary: Pane;
    private paneSecondary: Pane;
    private resizer: Resizer;
    private resizerElement: Element;

    constructor() {
        super();

        this.state = {
            isDragging: false,
            dragStartPosition: null,
            dragStartPaneSize: null,
            calculatedMaxSize: null
        };
    }

    public componentDidMount() {
        this.resizerElement = ReactDOM.findDOMNode(this.resizer);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('touchend', this.handleMouseUp);
        window.addEventListener('resize', this.handleWindowResize);
        window.addEventListener('orientationchange', this.handleWindowResize);
    }

    public componentWillUnmount() {
        window.removeEventListener('orientationchange', this.handleWindowResize);
        window.removeEventListener('resize', this.handleWindowResize);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchend', this.handleMouseUp);
    }

    public render() {
        const {
            allowResize, children, split,
            className, primaryPaneClassName, secondaryPaneClassName,
            primaryPaneMaxSize, primaryPaneMinSize,
            primaryPaneStyle, secondaryPaneStyle,
            onResizerDoubleClick, style
        } = this.props;

        let { primaryPaneSize } = this.props;

        let rootStyle: React.CSSProperties = {
            maxWidth: '100%',
            maxHeight: '100%'
        };

        rootStyle = {
            ...rootStyle,
            ...style
        };

        let paneStyle, paneStyle2;
        switch (split) {
            case 'vertical': {

                paneStyle = {
                    flexBasis: primaryPaneSize,
                    ...primaryPaneStyle
                };

                paneStyle2 = {
                    ...secondaryPaneStyle
                };
                break;
            }
            case 'horizontal': {

                paneStyle = {
                    flexBasis: primaryPaneSize,
                    ...primaryPaneStyle
                };

                paneStyle2 = {
                    ...secondaryPaneStyle
                };
                break;
            }
            default:
                throw Error(`Unknown or unexpected split type: ${split}`);
        }

        return (
            <div
                className={`splitter ${split === 'vertical' ? 'vertical' : 'horizontal'} ${className || ''}`}
                style={rootStyle}
                ref={node => { if (node) { this.paneWrapper = node; } }}
            >
                <Pane
                    className={`primary ${primaryPaneClassName || ''}`}
                    split={split}
                    style={paneStyle}
                    ref={(node) => { if (node !== null) { this.panePrimary = node; } }}
                >
                    {!children[1] ? children : children[0]}
                </Pane>

                {
                    children[1] &&
                    <Resizer
                        split={split}
                        onMouseDown={this.handleMouseDown}
                        onDoubleClick={(e) => onResizerDoubleClick ? onResizerDoubleClick(paneStyle, e, this) : undefined}
                        ref={node => { if (node) { this.resizer = node; } }}
                        allowResize={allowResize}
                    />

                }

                {
                    children[1] &&
                    <Pane
                        className={secondaryPaneClassName || ''}
                        split={split}
                        style={paneStyle2}
                        ref={node => { if (node) { this.paneSecondary = node; } }}
                    >
                        {children[1]}
                    </Pane>
                }
            </div>
        );
    }

    private unFocus(document: any, window: any): void {
        if (document.body.createTextRange) { // All versions of IE but Edge
            const range = document.body.createTextRange();
            range.collapse();
            range.select();
        } else if (window.getSelection) { // All other browsers
            try {
                window.getSelection().removeAllRanges();
            } catch (e) {
                console.warn(e);
            }
        } else if (document.selection) { // IE < 9
            document.selection.empty();
        }
    }

    public calculateMaxSize(): number {
        const { primaryPaneMaxSize, split } = this.props;
        const resizer = ReactDOM.findDOMNode(this.resizer);
        const resizerBoundingClientRect = resizer.getBoundingClientRect();
        const resizerSize = split === 'vertical' ? resizerBoundingClientRect.width : resizerBoundingClientRect.height;

        let calculatedMaxSize: number;
        if (!primaryPaneMaxSize) {
            const paneWrapper = ReactDOM.findDOMNode(this.paneWrapper);
            const paneWrapperBoundingClientRect = paneWrapper.getBoundingClientRect();
            const paneWrapperSize = split === 'vertical' ? paneWrapperBoundingClientRect.width : paneWrapperBoundingClientRect.height;
            calculatedMaxSize = paneWrapperSize - resizerSize;
        } else {
            calculatedMaxSize = primaryPaneMaxSize - resizerSize;
        }

        return calculatedMaxSize;
    }

    @autobind
    private handleWindowResize(ev: UIEvent) {
        if (typeof this.props.onWindowResize === 'function') {
            this.props.onWindowResize(ev, this);
        }

        const calculatedMaxSize = this.calculateMaxSize();
        this.setState({
            calculatedMaxSize: calculatedMaxSize
        });
    }

    @autobind
    private handleMouseDown(e: any) {
        const { allowResize, onDragStarted, split } = this.props;
        if (e.button === 2 || allowResize === false) {
            return;
        }

        let clientX;
        let clientY;

        if (e.type === 'mousedown') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const dragStartPosition = split === 'vertical' ? clientX : clientY;
        const pane = ReactDOM.findDOMNode(this.panePrimary);
        const boundingClientRect = pane.getBoundingClientRect();
        const dragStartPaneSize = split === 'vertical' ? boundingClientRect.width : boundingClientRect.height;

        const calculatedMaxSize = this.calculateMaxSize();

        if (typeof onDragStarted === 'function') {
            onDragStarted();
        }

        this.setState({
            isDragging: true,
            dragStartPosition,
            dragStartPaneSize,
            calculatedMaxSize
        });
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('touchmove', this.handleMouseMove);
    }

    @autobind
    private handleMouseMove(e: any) {
        const { allowResize, primaryPaneMinSize, primaryPaneMaxSize, onPaneResized, split } = this.props;
        const { isDragging, dragStartPosition, dragStartPaneSize, calculatedMaxSize } = this.state;

        if (!isDragging || !allowResize || dragStartPosition == null || dragStartPaneSize == null || calculatedMaxSize == null) {
            return;
        }

        this.unFocus(document, window);

        let clientX;
        let clientY;

        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const currentPosition = split === 'vertical' ? clientX : clientY;
        const newPosition = dragStartPosition - currentPosition;
        let newPaneSize = dragStartPaneSize - newPosition;

        if (newPaneSize < primaryPaneMinSize) {
            newPaneSize = primaryPaneMinSize;
        } else if (newPaneSize > calculatedMaxSize) {
            newPaneSize = calculatedMaxSize;
        }

        if (typeof onPaneResized === 'function') {
            onPaneResized(newPaneSize);
        } else {
            throw Error('Expected onPaneResized to be a function, instead found ' + typeof onPaneResized);
        }
    }

    @autobind
    private handleMouseUp(e: any) {
        const { allowResize, onDragFinished } = this.props;
        const { isDragging, dragStartPosition } = this.state;
        if (!isDragging || !allowResize) {
            return;
        }

        this.setState({
            isDragging: false,
            dragStartPosition: null,
            dragStartPaneSize: null,
            calculatedMaxSize: null
        });

        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchmove', this.handleMouseMove);

        if (typeof onDragFinished === 'function') {
            onDragFinished();
        }
    }
}

export interface SplitPaneProps {
    allowResize?: Boolean;
    split: splitType;
    primaryPaneSize: string | any;
    primaryPaneMinSize: number;
    primaryPaneMaxSize?: number;
    className?: string;
    primaryPaneClassName?: string;
    secondaryPaneClassName?: string;
    primaryPaneStyle?: React.CSSProperties;
    secondaryPaneStyle?: React.CSSProperties;
    onPaneResized: (newSize: number) => void;
    onDragStarted?: Function;
    onDragFinished?: Function;
    onResizerDoubleClick?: (paneStyle: React.CSSProperties, e: React.MouseEvent<HTMLDivElement>, splitPane: SplitPane) => void;
    onWindowResize?: (ev: UIEvent, splitPane: SplitPane) => void;
    children: React.ReactNode[];
    style?: React.CSSProperties;
}

export interface SplitPaneState {
    isDragging: boolean;
    dragStartPosition: number | null;
    dragStartPaneSize: number | null;
    calculatedMaxSize: number | null;
}