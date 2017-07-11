import * as React from 'react';
import {
    HashRouter as Router,
    Route,
    Link
} from 'react-router-dom';
import * as URI from 'urijs';
import { action, extendObservable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as localforage from 'localforage';
import { autobind } from 'office-ui-fabric-react/lib';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import SplitPane from '../split-pane/SplitPane';

import Barista from '../../services/barista';
import Page from '../sp-lookout-page';
import Aside from '../workspace-aside';
import Fiddle from '../fiddle';

import { SettingsStore, FiddleStore, FiddleSettings } from '../../models';

import './Workspace.css';

@observer
export default class Workspace extends React.Component<WorkspaceProps, any> {
    private _appBarItems;
    private _appBarFarItems;
    private _barista: Barista;

    public constructor(props: WorkspaceProps) {
        super(props);

        const { settingsStore } = this.props;

        this.state = {
            dockIsVisible: false,
            readOnly: false,
            showSettingsModal: false,
            showShortcutsModal: false,
            sidebarSize: 215,
            webFullUrl: 'https://baristalabs.sharepoint.com'
        };

        this._barista = new Barista({
            webFullUrl: 'https://baristalabs.sharepoint.com',
            noProxyHandler: () => { console.log('no proxy!'); return { data: 'Error: Could not communicate with the proxy.' }; },
            authenticationRequiredHandler: () => { console.log('auth required!'); return { data: 'Error: Authentication is required.' }; },
            invalidOriginHandler: () => { console.log('invalid origin!'); return { data: 'Error: Proxy reported invalid origin.' }; }
        });

        this._appBarItems = [
            {
                icon: 'SidePanel',
                onClick: this.toggleSidebar,
            },
            {
                name: 'SP Lookout!',
                className: 'sp-lookout-nav',
                href: './#/',
                style: {
                    fontSize: '21px'
                }
            }
        ];

        this._appBarFarItems = [
            {
                icon: 'settings',
                title: 'Settings',
                onClick: this.showSettings,
            }
        ];

        this.state.asideItems =
            [
                {
                    links:
                    [
                        {
                            name: 'Dashboard',
                            url: '#/',
                            key: 'dashboard',
                            icon: 'PanoIndicator',
                            onClick: this._onClickHandler2
                        }
                    ]
                },
                {
                    links:
                    [
                        {
                            name: 'Governance',
                            key: 'governance',
                            icon: 'BarChart4',
                            onClick: this._onClickHandler2,
                            links: [{
                                name: 'Structure',
                                url: '#/charts/structure',
                                key: 'key1'
                            },
                            {
                                name: 'Activity',
                                url: '#/charts/activity',
                                key: 'key2'
                            },
                            {
                                name: 'Usage',
                                url: '#/charts/usage',
                                key: 'key3'
                            },
                            {
                                name: 'Custom',
                                url: '#/charts/custom',
                                key: 'key4'
                            }
                            ],
                            isExpanded: true
                        },
                        {
                            name: 'Actions',
                            key: 'actions',
                            icon: 'SetAction',
                            onClick: this._onClickHandler2,
                            links: [{
                                name: 'JSLink',
                                icon: 'Link',
                                onClick: this._onClickHandler2,
                                key: 'key1'
                            }],
                            isExpanded: true
                        }
                    ]
                }
            ] as INavLinkGroup[];

        this.state.routes = [
            {
                path: '/',
                exact: true,
                main: () => <Page />
            },
            {
                path: '/spfiddle/:fiddleId',
                main: (stateProps) => {
                    let currentFiddle = this.props.fiddleStore.getFiddleSettings(stateProps.match.params.fiddleId);
                    if (currentFiddle) {
                        return (
                            <Fiddle
                                fiddleStore={this.props.fiddleStore}
                                barista={this._barista}
                                currentFiddle={currentFiddle}
                            />
                        );
                    }

                    return null;
                }
            }
        ];
    }

    public componentDidMount() {
        const currentUri = URI();
        if (currentUri.hasQuery('splauth')) {
            const targetRoute = currentUri.query(true)['splauth'];
            currentUri.fragment(targetRoute);
            window.location.href = currentUri.href();
        }
    }

    public render() {
        return (
            <div id="main">
                <CommandBar
                    className="sp-lookout-nav"
                    isSearchBoxVisible={false}
                    items={this._appBarItems}
                    farItems={this._appBarFarItems}
                />
                <Router>
                    <div id="workspace">
                        <SplitPane
                            split="vertical"
                            className="left-sidebar"
                            primaryPaneSize={this.state.sidebarSize}
                            primaryPaneMinSize={0}
                            primaryPaneMaxSize={700}
                            primaryPaneStyle={{ overflow: 'auto' }}
                            onPaneResized={(size) => { this.setState({ sidebarSize: size }); }}
                            onResizerDoubleClick={(paneStyle) => {
                                if (paneStyle.width === 215) {
                                    this.setState({ sidebarSize: 0 });
                                } else {
                                    this.setState({ sidebarSize: 215 });
                                }
                            }}
                        >
                            <Aside
                                navItems={this.state.asideItems}
                                settingsStore={this.props.settingsStore}
                                fiddleStore={this.props.fiddleStore}
                                onFiddleSelected={this.onFiddleSelected}
                            />
                            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                                {this.state.routes.map((route, index) => (
                                    <Route
                                        key={index}
                                        path={route.path}
                                        exact={route.exact}
                                        component={route.main}
                                    />
                                ))}
                            </div>
                        </SplitPane>
                    </div>
                </Router>
                <Modal
                    isOpen={this.state.showSettingsModal}
                    onDismiss={this.hideSettings}
                    isBlocking={false}
                    containerClassName="settings-modal-container"
                >
                    <div className="settings-modal-header">
                        <span>Lorem Ipsum</span>
                    </div>
                    <div className="settings-modal-body">
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas lorem nulla, malesuada ut sagittis sit amet, vulputate in leo. Maecenas vulputate congue sapien eu tincidunt. Etiam eu sem turpis. Fusce tempor sagittis nunc, ut interdum ipsum vestibulum non. Proin dolor elit, aliquam eget tincidunt non, vestibulum ut turpis. In hac habitasse platea dictumst. In a odio eget enim porttitor maximus. Aliquam nulla nibh, ullamcorper aliquam placerat eu, viverra et dui. Phasellus ex lectus, maximus in mollis ac, luctus vel eros. Vivamus ultrices, turpis sed malesuada gravida, eros ipsum venenatis elit, et volutpat eros dui et ante. Quisque ultricies mi nec leo ultricies mollis. Vivamus egestas volutpat lacinia. Quisque pharetra eleifend efficitur. </p>
                        <p>Mauris at nunc eget lectus lobortis facilisis et eget magna. Vestibulum venenatis augue sapien, rhoncus faucibus magna semper eget. Proin rutrum libero sagittis sapien aliquet auctor. Suspendisse tristique a magna at facilisis. Duis rhoncus feugiat magna in rutrum. Suspendisse semper, dolor et vestibulum lacinia, nunc felis malesuada ex, nec hendrerit justo ex et massa. Quisque quis mollis nulla. Nam commodo est ornare, rhoncus odio eu, pharetra tellus. Nunc sed velit mi. </p>
                        <p>Sed condimentum ultricies turpis convallis pharetra. Sed sagittis quam pharetra luctus porttitor. Cras vel consequat lectus. Sed nec fringilla urna, a aliquet libero. Aenean sed nisl purus. Vivamus vulputate felis et odio efficitur suscipit. Ut volutpat dictum lectus, ac rutrum massa accumsan at. Sed pharetra auctor finibus. In augue libero, commodo vitae nisi non, sagittis convallis ante. Phasellus malesuada eleifend mollis. Curabitur ultricies leo ac metus venenatis elementum. </p>
                        <p>Aenean egestas quam ut erat commodo blandit. Mauris ante nisl, pellentesque sed venenatis nec, aliquet sit amet enim. Praesent vitae diam non diam aliquet tristique non ut arcu. Pellentesque et ultrices eros. Fusce diam metus, mattis eu luctus nec, facilisis vel erat. Nam a lacus quis tellus gravida euismod. Nulla sed sem eget tortor cursus interdum. Sed vehicula tristique ultricies. Aenean libero purus, mollis quis massa quis, eleifend dictum massa. Fusce eu sapien sit amet odio lacinia placerat. Mauris varius risus sed aliquet cursus. Aenean lectus magna, tincidunt sit amet sodales a, volutpat ac leo. Morbi nisl sapien, tincidunt sit amet mauris quis, sollicitudin auctor est. </p>
                        <p>Nam id mi justo. Nam vehicula vulputate augue, ac pretium enim rutrum ultricies. Sed aliquet accumsan varius. Quisque ac auctor ligula. Fusce fringilla, odio et dignissim iaculis, est lacus ultrices risus, vitae condimentum enim urna eu nunc. In risus est, mattis non suscipit at, mattis ut ante. Maecenas consectetur urna vel erat maximus, non molestie massa consequat. Duis a feugiat nibh. Sed a hendrerit diam, a mattis est. In augue dolor, faucibus vel metus at, convallis rhoncus dui.</p>
                    </div>
                </Modal>
            </div>
        );
    }

    @autobind
    private async _onClickHandler2(e: React.MouseEvent<HTMLElement>) {
        return false;
    }

    @action.bound
    private onFiddleSelected(fiddleSettings: FiddleSettings) {
        // const { workspaceSettings } = this.props;
        // workspaceSettings.currentFiddle = fiddleSettings;

        // console.dir(toJS(fiddleSettings));
        // this.forceUpdate();

        location.hash = '/SPFiddle/' + fiddleSettings.id;
    }

    @autobind
    private showSettings() {
        this.setState({
            showSettingsModal: true
        });
    }

    @autobind
    private hideSettings() {
        this.setState({
            showSettingsModal: false
        });
    }

    @autobind
    private toggleSidebar() {
        if (this.state.sidebarSize) {
            this.setState({
                sidebarSize: 0,
                sidebarPrevSize: this.state.sidebarSize
            });
        } else {
            this.setState({
                sidebarSize: this.state.sidebarPrevSize || 215
            });
        }
    }
}

export interface WorkspaceProps {
    settingsStore: SettingsStore;
    fiddleStore: FiddleStore;
}