import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { action, extendObservable, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { Menu, MainButton, ChildButton } from 'react-mfb';
import { find } from 'lodash';

import * as WebParts from '../webpart';

import { PagesStore, PageSettings, WebPartSettings, WebPartType, defaultWebPartSettings, Util } from '../../models';

import './index.css';

const Layout = ReactGridLayout.WidthProvider(ReactGridLayout);

@observer
export default class Page extends React.Component<PageProps, {}> {
    public render() {
        const { currentPage } = this.props;
        const { columns, rowHeight, locked } = currentPage;
        let layout: Array<any> = [];
        for (let webPart of currentPage.webParts) {
            layout.push({
                x: webPart.x,
                y: webPart.y,
                w: webPart.w,
                h: webPart.h,
                i: webPart.id,
                isDraggable: !webPart.locked,
                isResizable: !webPart.locked,
                settings: webPart
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
                        return (
                            <div key={webPart.i}>
                                {this.renderWebPart(webPart.settings)}
                            </div>
                        );
                    })}
                </Layout>
                {currentPage.locked
                    ?
                    <Menu effect={'zoomin'} method={'hover'} position={'br'}>
                        <MainButton iconResting="ms-Icon ms-Icon--Lock" iconActive="ms-Icon ms-Icon--Cancel" />
                        <ChildButton
                            onClick={this.unlockPage}
                            icon="ms-Icon ms-Icon--Unlock"
                            label="Unlock Page"
                        />
                    </Menu>
                    :
                    <Menu effect={'zoomin'} method={'hover'} position={'br'}>
                        <MainButton iconResting="ms-Icon ms-Icon--Add" iconActive="ms-Icon ms-Icon--Cancel" />
                        <ChildButton
                            onClick={this.startAddWebPart}
                            icon="ms-Icon ms-Icon--Checkbox"
                            label="Add WebPart"
                        />
                        <ChildButton
                            onClick={this.lockPage}
                            icon="ms-Icon ms-Icon--Lock"
                            label="Lock Page"
                        />
                    </Menu>
                }
            </div>
        );
    }

    private renderWebPart(webPartSettings: WebPartSettings) {
        const { currentPage } = this.props;

        let commonWebPartProps = {
            locked: currentPage.locked,
            settings: webPartSettings,
            onWebPartSettingsChanged: () => { this.onWebPartSettingsChanged(webPartSettings); },
            onDeleteWebPart: () => { this.onDeleteWebPart(webPartSettings.id); }
        }
        switch (webPartSettings.type) {
            case WebPartType.chart:
                return (
                    <WebParts.ChartWebPart
                        {...commonWebPartProps}
                    />
                );
            case WebPartType.clock:
                return (
                    <WebParts.ClockWebPart
                        {...commonWebPartProps}
                    />
                );
            case WebPartType.note:
                return (
                    <WebParts.NoteWebPart
                        {...commonWebPartProps}
                    />
                );
            case WebPartType.text:
            default:
                return (
                    <WebParts.WebPartBase
                        {...commonWebPartProps}
                    />
                );
        }
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
            title: 'New WebPart',
            locked: false,
            props: {}
        }));
    }

    @action.bound
    private onDeleteWebPart(webPartId: string) {
        const { currentPage } = this.props;
        let webPart = find(currentPage.webParts, { id: webPartId });
        if (!webPart) {
            return;
        }

        currentPage.webParts.splice(currentPage.webParts.indexOf(webPart), 1);
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @action.bound
    private lockPage() {
        this.props.currentPage.locked = true;
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @action.bound
    private unlockPage() {
        this.props.currentPage.locked = false;
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @action.bound
    private onLayoutChange(layout: any) {
        console.dir(layout);
        for (let position of layout) {
            const webPart = find(this.props.currentPage.webParts, { id: position.i });
            if (!webPart || webPart.locked) {
                continue;
            }

            webPart.x = position.x;
            webPart.y = position.y;
            webPart.h = position.h;
            webPart.w = position.w;
        }
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @action.bound
    private onWebPartSettingsChanged(settings: WebPartSettings) {
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }
}

export interface PageProps {
    pagesStore: PagesStore;
    currentPage: PageSettings;
}