import * as React from 'react';
import {
    HashRouter as Router,
    Route,
    Link,
    matchPath
} from 'react-router-dom';
import * as URI from 'urijs';
import { action, toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as localforage from 'localforage';
import { autobind } from 'office-ui-fabric-react/lib';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';
import SplitPane from '../split-pane/SplitPane';
import { defaultsDeep } from 'lodash';

import Barista from '../../services/barista';
import { SPContextConfig, defaultSPContextConfig } from '../../services/spcontext';
import Page from '../page';
import Aside from '../workspace-aside';
import { WelcomeModal } from '../welcome-modal';
import { WorkspaceSettingsModal } from '../workspace-settings-modal';
import Fiddle from '../fiddle';

import { SettingsStore, PagesStore, FiddlesStore, FiddleFolder, FiddleSettings, defaultFiddleSettings, Util } from '../../models';

import './Workspace.css';

@observer
export default class Workspace extends React.Component<WorkspaceProps, WorkspaceState> {
    private _appBarItems;
    private _appBarFarItems;
    private _barista: Barista;
    private _routes: Array<any>;

    public constructor(props: WorkspaceProps) {
        super(props);

        const { settingsStore } = this.props;

        this.state = {
            welcomeSkipped: false,
            showWelcomeModal: false,
            showSettingsModal: false,
            sidebarSize: 215,
            sidebarPrevSize: 0
        };

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

        const dashy = () => {
            const currentPage = this.props.pagesStore.getPageSettings('dashboard');
            if (!currentPage) {
                return <span>Dashboard not found...</span>;
            }

            return (
                <Page
                    pagesStore={this.props.pagesStore}
                    currentPage={currentPage}
                />
            );
        };

        this._routes = [
            {
                path: '/',
                exact: true,
                main: dashy
            },
            {
                path: '/welcome*',
                main: dashy
            },
            {
                path: '/pages/:pageId',
                main: (stateProps) => {
                    const currentPage = this.props.pagesStore.getPageSettings(stateProps.match.params.pageId);
                    if (currentPage) {
                        return (
                            <Page
                                pagesStore={this.props.pagesStore}
                                currentPage={currentPage}
                            />
                        );
                    }

                    return null;
                }
            },
            {
                path: '/fiddle/:fiddlePath*',
                main: (stateProps) => {
                    const currentFiddle = this.props.fiddlesStore.getFiddleSettingsByPath(stateProps.match.params.fiddlePath);
                    if (currentFiddle) {
                        Util.extendObjectWithDefaults(currentFiddle, defaultFiddleSettings);
                        return (
                            <Fiddle
                                fiddlesStore={this.props.fiddlesStore}
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

    public componentWillMount() {

        //If there's a splauth query string value present, navigate to the fragment
        //SPO Authentication drops URL hash values.
        const currentUri = URI();
        if (currentUri.hasQuery('splauth')) {
            const targetRoute = currentUri.query(true)['splauth'];
            currentUri.fragment(targetRoute);
            window.location.href = currentUri.href();
        }

        //If the settings store doesn't have a tenant url configured, show the welcome modal
        if (!this.props.settingsStore.baristaSettings.tenantUrl || this.props.settingsStore.baristaSettings.tenantUrl.length < 1) {
            if (!this.state.welcomeSkipped) {
                this.setState({
                    showWelcomeModal: true
                });
            }
        }

        const selectedPagePath = matchPath(location.hash.replace('#', ''), { path: '/pages/:pageId' });
        if (selectedPagePath) {
            this.setState({
                selectedPageId: selectedPagePath.params.pageId
            });
        }

        const selectedFiddlePath = matchPath(location.hash.replace('#', ''), { path: '/fiddle/:fiddlePath*' });
        if (selectedFiddlePath) {
            this.setState({
                selectedPaths: selectedFiddlePath.params.fiddlePath
            });
        }

        this.initializeBarista();
    }

    public render() {
        const { settingsStore, pagesStore, fiddlesStore } = this.props;

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
                            secondaryPaneStyle={{ overflow: 'auto' }}
                            onPaneResized={(size) => { this.setState({ sidebarSize: size }); }}
                            onResizerDoubleClick={(paneStyle) => {
                                if (paneStyle.flexBasis === 215) {
                                    this.setState({ sidebarSize: 0 });
                                } else {
                                    this.setState({ sidebarSize: 215 });
                                }
                            }}
                            onWindowResize={(ev) => {
                                this.setState({ sidebarSize: 215 });
                            }}
                        >
                            <Aside
                                settingsStore={settingsStore}
                                pagesStore={pagesStore}
                                fiddlesStore={fiddlesStore}
                                onFolderSelected={this.onFolderSelected}
                                onFiddleSelected={this.onFiddleSelected}
                                selectedPageId={this.state.selectedPageId}
                                selectedPaths={this.state.selectedPaths}
                            />
                            {this._routes.map((route, index) => (
                                <Route
                                    key={index}
                                    path={route.path}
                                    exact={route.exact}
                                    component={route.main}
                                />
                            ))}
                        </SplitPane>
                    </div>
                </Router>
                <WorkspaceSettingsModal
                    showWorkspaceSettingsModal={this.state.showSettingsModal}
                    onDismiss={this.hideSettings}
                    settingsStore={settingsStore}
                />
                <WelcomeModal
                    showWelcomeModal={this.state.showWelcomeModal}
                    onSkip={this.onWelcomeSkipped}
                    onFinish={this.onWelcomeFinished}
                    settingsStore={settingsStore}
                />
            </div>
        );
    }

    private initializeBarista() {
        const { settingsStore } = this.props;
        const { tenantUrl } = settingsStore.baristaSettings;
        if (!tenantUrl || tenantUrl.length <= 0) {
            return;
        }

        if (this._barista) {
            this._barista.dispose();
        }

        const webFullUrl = URI(tenantUrl)
            .protocol('https')
            .normalize()
            .href();

        const contextConfig: SPContextConfig = defaultsDeep(
            toJS(settingsStore.baristaSettings.spContextConfig),
            defaultSPContextConfig
        );

        this._barista = new Barista(
            {
                webFullUrl: webFullUrl,
                noProxyHandler: () => { console.log('no proxy!'); return { data: 'Error: Could not communicate with the proxy.' }; },
                authenticationRequiredHandler: () => { console.log('auth required!'); return { data: 'Error: Authentication is required.' }; },
                invalidOriginHandler: () => { console.log('invalid origin!'); return { data: 'Error: Proxy reported invalid origin.' }; }
            },
            contextConfig
        );
    }

    @action.bound
    private onPageSelected(ev, nav) {
        this.setState({
            selectedPageId: nav.key,
            selectedPaths: undefined
        });
    }

    @action.bound
    private onFiddleSelected(fiddleSettings: FiddleSettings, path: string) {
        location.hash = '/fiddle/' + path;
        this.setState({
            selectedPageId: undefined,
            selectedPaths: path
        });
    }

    @action.bound
    private onFolderSelected(folder: FiddleFolder, path: string) {
        this.setState({
            selectedPageId: undefined,
            selectedPaths: path
        });
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
        this.initializeBarista();
        SettingsStore.saveToLocalStorage(this.props.settingsStore);
    }

    @autobind
    private onWelcomeSkipped() {
        this.setState({
            showWelcomeModal: false,
            welcomeSkipped: true
        });
    }

    @autobind
    private onWelcomeFinished() {
        this.setState({
            showWelcomeModal: false
        });
        this.initializeBarista();
        SettingsStore.saveToLocalStorage(this.props.settingsStore);

        location.href = URI().removeQuery('splauth').hash('/').href();
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

export interface WorkspaceState {
    welcomeSkipped: boolean;
    showWelcomeModal: boolean;
    showSettingsModal: boolean;
    sidebarSize: number;
    sidebarPrevSize: number;
    selectedPageId?: string;
    selectedPaths?: string | string[];
}

export interface WorkspaceProps {
    settingsStore: SettingsStore;
    pagesStore: PagesStore;
    fiddlesStore: FiddlesStore;
}