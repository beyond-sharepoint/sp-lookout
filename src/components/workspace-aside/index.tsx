import * as React from 'react';
import { matchPath } from 'react-router-dom';
import { IObservable } from 'mobx';
import { observer } from 'mobx-react';
import { Nav, INavLinkGroup, INavLink } from 'office-ui-fabric-react/lib/Nav';
import { autobind } from 'office-ui-fabric-react/lib';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import SplitPane from '../split-pane/SplitPane';
import { FolderView, IFolder } from '../folder-view';

import { SettingsStore, FiddleStore, FiddleSettings, FiddleFolder } from '../../models';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    public render() {
        const { settingsStore, fiddleStore, onFiddleSelected, selectedPageKey, selectedFiddleId } = this.props;

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
                    groups={this.props.navItems}
                    expandedStateText={'expanded'}
                    collapsedStateText={'collapsed'}
                    selectedKey={selectedPageKey}
                //onRenderLink={this.renderNavLink} 
                />
                <div>
                { fiddleStore.starred.map((file, index) => {
                    return (
                        <div style={{cursor: 'pointer' }}><span style={{color: 'yellow', paddingLeft: '5px', paddingRight: '5px'}}><i className="fa fa-star" aria-hidden="true"></i></span>{file.name}</div>
                    );
                })
                }
                <FolderView
                    folder={fiddleStore.fiddleRootFolder as IFolder}
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
        FiddleStore.saveToLocalStorage(this.props.fiddleStore);
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
    settingsStore: SettingsStore;
    fiddleStore: FiddleStore;
    onFiddleSelected: (settings: FiddleSettings) => void;
    selectedPageKey?: string;
    selectedFiddleId?: string;
}