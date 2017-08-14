import * as React from 'react';
import './App.css';
import { observer } from 'mobx-react';
import { Fabric } from 'office-ui-fabric-react';
import Workspace from './components/workspace/Workspace';
import { AppSettingsStore, SharePointSettingsStore, PagesStore, ScriptsStore } from './models';

@observer
export default class App extends React.Component<any, AppStoreState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      isLoading: true
    };

    Promise.all([
      AppSettingsStore.loadFromLocalStorage(),
      SharePointSettingsStore.loadFromLocalStorage(),
      PagesStore.loadFromLocalStorage(),
      ScriptsStore.loadFromLocalStorage()
    ])
      .then(results => {
        this.setState({
          isLoading: false,
          appSettingsStore: results[0],
          sharePointSettingsStore: results[1],
          pagesStore: results[2],
          fiddlesStore: results[3]
        });
      });
  }

  render() {
    const { isLoading, appSettingsStore, sharePointSettingsStore, pagesStore, fiddlesStore } = this.state;
    return (
      <Fabric>
        {isLoading || !appSettingsStore || !sharePointSettingsStore || !pagesStore || !fiddlesStore
          ? <div>loading...</div>
          : <Workspace
            appSettingsStore={appSettingsStore}
            sharePointSettingsStore={sharePointSettingsStore}
            pagesStore={pagesStore}
            fiddlesStore={fiddlesStore}
          />
        }
      </Fabric>
    );
  }
}

export interface AppStoreState {
  isLoading: boolean;
  appSettingsStore?: AppSettingsStore;
  sharePointSettingsStore?: SharePointSettingsStore;
  pagesStore?: PagesStore;
  fiddlesStore?: ScriptsStore;
}