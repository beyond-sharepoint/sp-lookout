import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import * as _ from 'lodash';
import './index.css';

const Layout = ReactGridLayout.WidthProvider(ReactGridLayout);

export default class SPLookoutPage extends React.Component<SPLookoutPageProps, any> {
    public static defaultProps: Partial<SPLookoutPageProps> = {
        items: 50,
        columns: 12,
        rowHeight: 30,
        isLocked: false
    };

    public constructor(props: SPLookoutPageProps) {
        super(props);

        const { items } = props;

        this.state = {
            layout: _.map(new Array(items), function (item, i) {
                let y = Math.ceil(Math.random() * 4) + 1;
                return {
                    x: i * 2 % 12,
                    y: Math.floor(i / 6) * y,
                    w: 2,
                    h: y,
                    i: i.toString()
                };
            })
        };
    }

    public render() {
        const { items, columns, rowHeight, onLayoutChange, isLocked } = this.props;

        return (
            <Layout
                className="dashboard"
                layout={this.state.layout}
                cols={columns}
                rowHeight={rowHeight}
                verticalCompact={false}
                onLayoutChange={onLayoutChange}
                isDraggable={!isLocked}
                isResizable={!isLocked}
                {...this.props}
            >
                {_.map(_.range(items || 50), function (i) {
                    return (<div key={i}><span className="text">{i}</span></div>);
                })}
            </Layout>
        );
    }
}

export interface SPLookoutPageProps {
    items?: number;
    columns?: number;
    rowHeight?: number;
    isLocked?: boolean;
    onLayoutChange?: (Layout: any) => void;
}