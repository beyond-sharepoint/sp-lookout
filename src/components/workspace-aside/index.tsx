import * as React from 'react';
import { matchPath } from 'react-router-dom';
import { IObservable } from 'mobx';
import { observer } from 'mobx-react';
import { Nav, INavLinkGroup, INavLink } from 'office-ui-fabric-react/lib/Nav';
import { autobind } from 'office-ui-fabric-react/lib';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import SplitPane from '../split-pane/SplitPane';
import { FolderView, IFolder } from '../folder-view';

import { SettingsStore, PagesStore, FiddlesStore, FiddleSettings, FiddleFolder } from '../../models';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    public render() {
        const { settingsStore, pagesStore, fiddlesStore, onFiddleSelected, selectedPageId, selectedFiddleId } = this.props;
        
        let navLinks: Array<INavLink> = [];
        for(let page of pagesStore.pages) {
            navLinks.push({
                key: page.id,
                name: page.name,
                icon: page.iconClassName,
                url: "#/pages/" + page.id,
                onClick: () => {}
            });
        }
        const navGroups: Array<INavLinkGroup> = [
            {
                links: navLinks
            }
        ];

        const starredDivStyle: React.CSSProperties = {
            display: 'none'
        };

        if (fiddlesStore.starred.length > 0) {
            starredDivStyle.display = null;
            starredDivStyle.paddingBottom = '5px';
        }

        return (
            <SplitPane
                split="horizontal"
                primaryPaneSize={settingsStore.visualSettings.asidePrimaryPaneHeight}
                primaryPaneMinSize={250}
                secondaryPaneStyle={{ overflow: 'auto' }}
                onPaneResized={this.onPaneResized}
                onResizerDoubleClick={(paneStyle, e, splitPane) => {
                    if (paneStyle.height === '60%') {
                        this.onPaneResized(splitPane.calculateMaxSize());
                    } else {
                        this.onPaneResized('60%');
                    }
                }}
            >
                <Nav
                    className="aside"
                    groups={navGroups}
                    expandedStateText={'expanded'}
                    collapsedStateText={'collapsed'}
                    selectedKey={selectedPageId}
                //onRenderLink={this.renderNavLink} 
                />
                <div>
                    <div style={starredDivStyle}>
                        {fiddlesStore.starred.map((fiddleSettings, index) => {
                            return (
                                <div style={{ cursor: 'pointer' }} onClick={() => onFiddleSelected(fiddleSettings)}>
                                    <span style={{ color: 'orange', paddingLeft: '5px', paddingRight: '5px' }}>
                                        <i className="fa fa-star" aria-hidden="true"></i>
                                    </span>{fiddleSettings.name}
                                </div>
                            );
                        })
                        }
                    </div>
                    <FolderView
                        folder={fiddlesStore.fiddleRootFolder as IFolder}
                        onFileClicked={onFiddleSelected}
                        selectedFileId={selectedFiddleId}
                        onChange={this.onFiddleChange}
                    />
                </div>
            </SplitPane>
        );
    }

    @autobind
    private onPaneResized(newSize: number | string) {
        this.props.settingsStore.visualSettings.asidePrimaryPaneHeight = newSize;
    }

    @autobind
    private onFiddleChange() {
        FiddlesStore.saveToLocalStorage(this.props.fiddlesStore);
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
    settingsStore: SettingsStore;
    pagesStore: PagesStore;
    fiddlesStore: FiddlesStore;
    onFiddleSelected: (settings: FiddleSettings) => void;
    selectedPageId?: string;
    selectedFiddleId?: string;
}