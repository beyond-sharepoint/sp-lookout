import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { action, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { find } from 'lodash';

import { PagesStore, PageSettings } from '../../models';
import './index.css';

const Layout = ReactGridLayout.WidthProvider(ReactGridLayout);

@observer
export default class Page extends React.Component<PageProps, {}> {
    public render() {
        const { currentPage } = this.props;
        const { columns, rowHeight, locked } = currentPage;
        const webParts = toJS(currentPage.webParts);
        let layout: Array<any> = [];
        for(let webPart of webParts) {
            layout.push({
                ...webPart,
                x: webPart.x,
                y: webPart.y,
                w: webPart.w,
                h: webPart.h,
                i: webPart.id
            });
        }
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
                {layout.map((webPart, ix) => {
                    return (<div key={ix}><span className="text">{webPart.text}</span></div>);
                })}
            </Layout>
        );
    }

    @action.bound
    private onLayoutChange(layout: any) {
        for(let position of layout) {
            const webPart = find(this.props.currentPage.webParts, { id: position.i });
            if (!webPart) {
                continue;
            }

            webPart.x = position.x;
            webPart.y = position.y;
            webPart.h = position.h;
            webPart.w = position.w;
        }
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }
}

export interface PageProps {
    pagesStore: PagesStore;
    currentPage: PageSettings;
}