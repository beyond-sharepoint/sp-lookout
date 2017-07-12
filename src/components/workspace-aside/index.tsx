import * as React from 'react';
import { matchPath } from 'react-router-dom';
import { observer } from 'mobx-react';
import { Nav, INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';
import { autobind } from 'office-ui-fabric-react/lib';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import SplitPane from '../split-pane/SplitPane';
import { FolderView } from '../folderview';

import { SettingsStore, FiddleStore, FiddleSettings } from '../../models';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    @autobind
    private onPaneResized(newSize: number | string) {
        this.props.settingsStore.visualSettings.asidePrimaryPaneHeight = newSize;
    }

    public render() {
        const { settingsStore, fiddleStore, onFiddleSelected, selectedFiddleId } = this.props;

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
                    selectedKey={'dashboard'}
                //onRenderLink={this.renderNavLink} 
                />
                <FolderView
                    folder={fiddleStore.fiddleRootFolder}
                    onFileClicked={onFiddleSelected}
                    selectedFileId={selectedFiddleId}
                />
            </SplitPane>
        );
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
    settingsStore: SettingsStore;
    fiddleStore: FiddleStore;
    onFiddleSelected: (settings: FiddleSettings) => void;
    selectedFiddleId?: string;
}