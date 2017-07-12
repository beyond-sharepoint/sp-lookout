import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { action, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as _ from 'lodash';

import { PagesStore, PageSettings } from '../../models';
import './index.css';

const Layout = ReactGridLayout.WidthProvider(ReactGridLayout);

@observer
export default class Page extends React.Component<PageProps, {}> {
    public render() {
        const { currentPage } = this.props;
        const { columns, rowHeight, locked } = currentPage;
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
                isDraggable={!locked}
                isResizable={!locked}
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
}