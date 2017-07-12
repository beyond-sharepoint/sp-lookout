import * as React from 'react';
import './App.css';
import { observer } from 'mobx-react';
import { Fabric } from 'office-ui-fabric-react';
import Workspace from './components/workspace/Workspace';
import { SettingsStore, PagesStore, FiddlesStore } from './models';

@observer
export default class App extends React.Component<any, AppStoreState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      isLoading: true
    };

    Promise.all([SettingsStore.loadFromLocalStorage(), PagesStore.loadFromLocalStorage(), FiddlesStore.loadFromLocalStorage()])
      .then(results => {
        this.setState({
          isLoading: false,
          settingsStore: results[0],
          pagesStore: results[1],
          fiddlesStore: results[2]
        });
      });
  }

  render() {
    const { isLoading, settingsStore, pagesStore, fiddlesStore } = this.state;
    return (
      <Fabric>
        {isLoading || !settingsStore || !pagesStore || !fiddlesStore
          ? <div>loading...</div>
          : <Workspace settingsStore={settingsStore} pagesStore={pagesStore} fiddlesStore={fiddlesStore} />
        }
      </Fabric>
    );
  }
}

export interface AppStoreState {
  isLoading: boolean;
  settingsStore?: SettingsStore;
  pagesStore?: PagesStore;
  fiddlesStore?: FiddlesStore;
}