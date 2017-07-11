import * as React from 'react';
import { observer } from 'mobx-react';
import { Nav, INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';
import { autobind } from 'office-ui-fabric-react/lib';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import SplitPane from '../split-pane/SplitPane';
import { FolderView } from '../folderview';

import { WorkspaceSettings } from '../../models/WorkspaceSettings';
import { FiddleSettings } from '../../models/FiddleSettings';

import './index.css';

@observer
export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    @autobind
    private onPaneResized(newSize: number | string) {
        this.props.workspaceSettings.visualSettings.asidePrimaryPaneHeight = newSize;
    }

    public render() {
        return (
            <SplitPane
                split="horizontal"
                primaryPaneSize={this.props.workspaceSettings.visualSettings.asidePrimaryPaneHeight}
                primaryPaneMinSize={250}
                secondaryPaneStyle={{ overflow: 'auto' }}
                onPaneResized={this.onPaneResized}
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
                    folder={this.props.workspaceSettings.fiddleRootFolder}
                    onFileClicked={this.props.onFiddleSelected}
                />
            </SplitPane>
        );
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
    workspaceSettings: WorkspaceSettings;
    onFiddleSelected: (settings: FiddleSettings) => void;
}