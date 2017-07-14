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
    }

    public componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchend', this.handleMouseUp);
    }

    public render() {
        const {
            allowResize, children, split,
            primaryPaneSize, primaryPaneMinSize, primaryPaneMaxSize,
            className, primaryPaneClassName, secondaryPaneClassName,
            primaryPaneStyle, secondaryPaneStyle,
            onResizerDoubleClick
        } = this.props;

        let paneStyle, paneStyle2;
        switch (split) {
            case 'vertical': {
                paneStyle = {
                    width: primaryPaneSize,
                    minWidth: primaryPaneMinSize,
                    maxWidth: primaryPaneMaxSize,
                    ...primaryPaneStyle
                };

                let paneStyle2Width: number | string | undefined = undefined;
                if (typeof paneStyle.width === 'string' && paneStyle.width.endsWith('%')) {
                    paneStyle2Width = (100 - parseInt(paneStyle.width.replace('%', ''), 10)) + '%';
                } else if (typeof paneStyle.width === 'number' && this.paneWrapper) {
                    const clientRect = this.paneWrapper.getBoundingClientRect();
                    const resizerRect = this.resizerElement.getBoundingClientRect();
                    paneStyle2Width = clientRect.width - (paneStyle.width + resizerRect.width);
                }

                paneStyle2 = {
                    width: paneStyle2Width,
                    ...secondaryPaneStyle
                };
                break;
            }
            case 'horizontal': {
                paneStyle = {
                    height: primaryPaneSize,
                    minHeight: primaryPaneMinSize,
                    maxHeight: primaryPaneMaxSize,
                    ...primaryPaneStyle
                };

                let paneStyle2Height: number | string | undefined = undefined;
                if (typeof paneStyle.height === 'string' && paneStyle.height.endsWith('%')) {
                    paneStyle2Height = (100 - parseInt(paneStyle.height.replace('%', ''), 10)) + '%';
                } else if (typeof paneStyle.height === 'number' && this.paneWrapper) {
                    const clientRect = this.paneWrapper.getBoundingClientRect();
                    const resizerRect = this.resizerElement.getBoundingClientRect();
                    paneStyle2Height = clientRect.height - (paneStyle.height + resizerRect.height);
                }

                paneStyle2 = {
                    height: paneStyle2Height,
                    ...secondaryPaneStyle
                };
                break;
            }
            default:
                throw Error(`Unknown or unexpected split type: ${split}`);
        }

        let onePaneStyle: any;
        if (!children || children.length < 2) {
            onePaneStyle = {
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                ...primaryPaneStyle
            };
        }

        return (
            <div
                className={`splitter ${split === 'vertical' ? 'vertical' : 'horizontal'} ${className || ''}`}
                style={onePaneStyle !== 'undefined' ? onePaneStyle : null}
                ref={node => { if (node !== null) { this.paneWrapper = node; } }}
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
                    children[1]
                        ? <Resizer
                            split={split}
                            onMouseDown={this.handleMouseDown}
                            onDoubleClick={(e) => onResizerDoubleClick ? onResizerDoubleClick(paneStyle, e, this) : undefined}
                            ref={node => { if (node !== null) { this.resizer = node; } }}
                            allowResize={allowResize}
                        />
                        : null
                }

                {
                    children[1]
                        ? <Pane
                            className={secondaryPaneClassName || ''}
                            split={split}
                            style={paneStyle2}
                            ref={node => { if (node !== null) { this.paneSecondary = node; } }}
                        >
                            {children[1]}
                        </Pane>
                        : null
                }
            </div>
        );
    }

    private unFocus(document: any, window: any): void {
        if (document.selection) {
            document.selection.empty();
        } else {
            try {
                window.getSelection().removeAllRanges();
            } catch (e) {
                console.warn(e);
            }
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
}

export interface SplitPaneState {
    isDragging: boolean;
    dragStartPosition: number | null;
    dragStartPaneSize: number | null;
    calculatedMaxSize: number | null;
}