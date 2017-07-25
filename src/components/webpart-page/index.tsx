import * as React from 'react';
import * as ReactGridLayout from 'react-grid-layout';
import { action, extendObservable, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { Menu, MainButton, ChildButton } from 'react-mfb';
import { unset } from 'lodash';

import { WebPartPageSettingsModal } from '../webpart-page-settings-modal';
import { webPartTypes, BaseWebPartProps, asScriptedWebPart } from '../webpart';

import { PagesStore, PageSettings, WebPartLayout, WebPartSettings, WebPartType, defaultWebPartSettings, Util } from '../../models';
import Barista from '../../services/barista';

import './index.css';

const ResponsiveLayout = ReactGridLayout.WidthProvider(ReactGridLayout.Responsive);

const WebPartTypeNames: Array<{ key: string, text: string }> = [];
for (const key of Object.keys(webPartTypes)) {
    WebPartTypeNames.push({
        key: key,
        text: webPartTypes[key].name
    });
}

@observer
export default class WebPartPage extends React.Component<PageProps, PageState> {
    public constructor(props: PageProps) {
        super(props);

        this.state = {
            showPageSettingsModal: false
        };
    }

    public render() {
        const { currentPage, pagesStore } = this.props;
        const { columns, rowHeight, locked } = currentPage;
        let layouts: Partial<ReactGridLayout.Layouts> = {};

        for (const size of Object.keys(currentPage.layouts)) {
            const webPartLayouts: { [id: string]: WebPartLayout } = currentPage.layouts[size];
            const layout: Array<ReactGridLayout.Layout> = [];
            for (const id of Object.keys(webPartLayouts)) {
                const webPart: WebPartSettings = currentPage.webParts[id];
                const webPartLayout: WebPartLayout = webPartLayouts[id];
                layout.push({
                    x: webPartLayout.x,
                    y: webPartLayout.y,
                    w: webPartLayout.w,
                    h: webPartLayout.h,
                    i: id,
                    isDraggable: !webPart.locked,
                    isResizable: !webPart.locked,
                    static: webPart.locked
                });
                layouts[size] = layout;
            }
        }

        return (
            <div style={{ flex: 1, backgroundColor: '#eee' }}>
                <ResponsiveLayout
                    className="dashboard"
                    layouts={(layouts as ReactGridLayout.Layouts)}
                    breakpoints={currentPage.breakpoints}
                    cols={currentPage.columns}
                    rowHeight={rowHeight}
                    verticalCompact={currentPage.compactVertical}
                    onLayoutChange={this.onLayoutChange}
                    isDraggable={!locked}
                    isResizable={!locked}
                    {...this.props}
                >
                    {Object.keys(currentPage.webParts).map((webPartId, ix) => {
                        const webPart: WebPartSettings = currentPage.webParts[webPartId];
                        return (
                            <div key={webPartId}>
                                {this.renderWebPart(webPartId, webPart)}
                            </div>
                        );
                    })}
                </ResponsiveLayout>
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
                            onClick={() => { this.setState({ showPageSettingsModal: true }); }}
                            icon="ms-Icon ms-Icon--Settings"
                            label="Page Settings"
                        />
                        <ChildButton
                            onClick={this.lockPage}
                            icon="ms-Icon ms-Icon--Lock"
                            label="Lock Page"
                        />
                    </Menu>
                }
                <WebPartPageSettingsModal
                    showPageSettingsModal={this.state.showPageSettingsModal}
                    onDismiss={() => { this.setState({ showPageSettingsModal: false }); PagesStore.saveToLocalStorage(this.props.pagesStore); }}
                    onDeletePage={(page) => { pagesStore.deletePage(page.id); PagesStore.saveToLocalStorage(this.props.pagesStore); }}
                    pagesStore={this.props.pagesStore}
                    currentPage={this.props.currentPage}
                />
            </div>
        );
    }

    private renderWebPart(webPartId: string, webPartSettings: WebPartSettings) {
        const { currentPage } = this.props;

        const webPartProps: BaseWebPartProps = {
            locked: currentPage.locked,
            settings: webPartSettings,
            webPartTypeNames: WebPartTypeNames,
            onWebPartSettingsChanged: () => { this.onWebPartSettingsChanged(webPartSettings); },
            onDeleteWebPart: () => { this.onDeleteWebPart(webPartId); }
        };

        const webPartDef = webPartTypes[webPartSettings.type];
        if (!webPartDef) {
            throw Error(`A WebPart did not correspond to the specified type: ${webPartSettings.type}. Please check the web part mapping.`);
        }

        let WebPart = webPartDef.type;

        if (webPartSettings.attributes && webPartSettings.attributes.indexOf('useScript') > -1) {
            WebPart = asScriptedWebPart(this.props.barista, WebPart);
        }

        return (
            <WebPart
                {...webPartProps}
            />
        );
    }

    @action.bound
    private startAddWebPart() {
        const { currentPage } = this.props;
        //TODO: Ensure unique id.
        const newWebPartId = Util.makeId(8);
        extendObservable(currentPage.webParts, {
            [newWebPartId]: {
                ...defaultWebPartSettings,
                type: WebPartType.text,
                title: 'New WebPart',
                locked: false,
                props: {}
            }
        });
        ['lg', 'md', 'sm', 'xs', 'xxs'].forEach((breakpointName) => {
            extendObservable(currentPage.layouts[breakpointName], {
                [newWebPartId]: {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2,
                }
            });
        });
        PagesStore.saveToLocalStorage(this.props.pagesStore);
        this.forceUpdate();
    }

    @action.bound
    private onDeleteWebPart(webPartId: string) {
        const { currentPage } = this.props;
        let webPart = currentPage.webParts[webPartId];
        if (!webPart) {
            return;
        }

        unset(currentPage.webParts, webPartId);
        for (const size of Object.keys(currentPage.layouts)) {
            unset(currentPage.layouts[size], webPartId);
        }
        PagesStore.saveToLocalStorage(this.props.pagesStore);
        this.forceUpdate();
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
    private onLayoutChange(currentLayout: ReactGridLayout.Layout, allLayouts: ReactGridLayout.Layouts) {

        //Map of ReactGridLayout back to WebPartLayout 
        for (const breakpointName of Object.keys(allLayouts)) {
            const currentBreakpointLayout = allLayouts[breakpointName];
            let currentWebPartLayouts: { [id: string]: WebPartLayout } = this.props.currentPage.layouts[breakpointName] || {};

            for (let position of currentBreakpointLayout) {
                const webPart = this.props.currentPage.webParts[position.i];
                const currentWebPartLayout = currentWebPartLayouts[position.i] || {};
                if (!webPart || !currentWebPartLayout || webPart.locked) {
                    continue;
                }

                currentWebPartLayout.x = position.x;
                currentWebPartLayout.y = position.y;
                currentWebPartLayout.h = position.h;
                currentWebPartLayout.w = position.w;
            }
        }
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }

    @action.bound
    private onWebPartSettingsChanged(settings: WebPartSettings) {
        PagesStore.saveToLocalStorage(this.props.pagesStore);
    }
}

export interface PageState {
    showPageSettingsModal: boolean;
}

export interface PageProps {
    barista: Barista;
    pagesStore: PagesStore;
    currentPage: PageSettings;
}