import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { action, extendObservable, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { Menu, MainButton, ChildButton } from 'react-mfb';
import { find } from 'lodash';

import { PagesStore, PageSettings, WebPartType, defaultWebPartSettings, Util } from '../../models';

import './index.css';

const Layout = ReactGridLayout.WidthProvider(ReactGridLayout);

@observer
export default class Page extends React.Component<PageProps, {}> {
    public render() {
        const { currentPage } = this.props;
        const { columns, rowHeight, locked } = currentPage;
        const webParts = toJS(currentPage.webParts);
        let layout: Array<any> = [];
        for (let webPart of webParts) {
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
            <div>
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
                        return (<div key={webPart.id}><span className="text">{webPart.text}</span></div>);
                    })}
                </Layout>
                <Menu effect={'zoomin'} method={'hover'} position={'br'}>
                    <MainButton iconResting="ms-Icon ms-Icon--Add" iconActive="ms-Icon ms-Icon--Cancel" />
                    <ChildButton
                        onClick={this.startAddWebPart}
                        icon="ms-Icon ms-Icon--Checkbox"
                        label="Add WebPart"
                    />
                </Menu>
            </div>
        );
    }

    @action.bound
    private startAddWebPart() {
        const { currentPage } = this.props;
        currentPage.webParts.push(observable({
            ...defaultWebPartSettings,
            id: Util.makeId(8),
            x: 0,
            y: 0,
            w: 2,
            h: 2,
            type: WebPartType.text,
            text: "asdf"
        }));
    }

    @action.bound
    private onLayoutChange(layout: any) {
        console.dir(layout);
        for (let position of layout) {
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