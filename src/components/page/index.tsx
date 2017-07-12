import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { action, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { PagesStore, PageSettings } from '../../models';
import './index.css';

const Layout = ReactGridLayout.WidthProvider(ReactGridLayout);

@observer
export default class Page extends React.Component<PageProps, any> {
    public static defaultProps: Partial<PageProps> = {
        columns: 12,
        rowHeight: 30,
        isLocked: false
    };

    public constructor(props: PageProps) {
        super(props);

        this.state = {
            layout: _.map(new Array(50), function (item, i) {
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
        const { columns, rowHeight, isLocked, currentPage } = this.props;
        const layout = toJS(currentPage.webParts);
        console.dir(layout);
        return (
            <Layout
                className="dashboard"
                layout={layout}
                cols={columns}
                rowHeight={rowHeight}
                verticalCompact={false}
                onLayoutChange={this.onLayoutChange}
                isDraggable={!isLocked}
                isResizable={!isLocked}
                style={{ height: '100%' }}
                {...this.props}
            >
                {_.map(layout, function (webPart, ix) {
                    return (<div key={ix}><span className="text">{webPart.text}</span></div>);
                })}
            </Layout>
        );
    }

    @action.bound
    private onLayoutChange(layout: any) {
        this.props.currentPage.webParts = layout;
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }
}

export interface PageProps {
    pagesStore: PagesStore;
    currentPage: PageSettings;
    columns?: number;
    rowHeight?: number;
    isLocked?: boolean;
}