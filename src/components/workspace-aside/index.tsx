import * as React from 'react';
import TreeView from '../treeview';
import { Nav, INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import treedata from './test-tree.js';

import './index.css';

export default class Aside extends React.Component<AsideProps, any> {
    private _actionsItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };
    private _spFiddleItems: { near: Array<IContextualMenuItem>, far: Array<IContextualMenuItem> };

    constructor() {
        super();

        let foo: IContextualMenuItem = {
            key: "asdf",
        }
        this._actionsItems = {
            near: [{
                key: 'title',
                name: 'Actions',
            }],
            far: []
        };

        this._spFiddleItems = {
            near: [{
                key: 'title',
                name: 'SPFiddle',
                href: '#/spfiddle',
                icon: 'Embed'
            }],
            far: []
        }
    }

    private onClickNode() {
    }

    private renderNode(node: any) {
        let classes = 'node';
        //'is-active': node === this.state.active
        return (
            <span className={classes} onClick={this.onClickNode}>
                {node.module}
                {node.children ? "--" : null}
            </span>
        );
    }

    public render() {
        return (
            <div>
                <Nav
                    className="aside"
                    groups={this.props.navItems}
                    expandedStateText={'expanded'}
                    collapsedStateText={'collapsed'}
                    selectedKey={'dashboard'}
                //onRenderLink={this.renderNavLink} 
                />
                <CommandBar
                    className="fiddle"
                    isSearchBoxVisible={false}
                    items={this._spFiddleItems.near}
                />
                <TreeView tree={treedata} isNodeCollapsed={false} changeNodeCollapsed={() => { }} paddingLeft={0} renderNode={this.renderNode}></TreeView>
            </div>
        );
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
}