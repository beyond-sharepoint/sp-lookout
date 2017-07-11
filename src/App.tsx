import * as React from 'react';
import './App.css';
import { observer } from 'mobx-react';
import { Fabric } from 'office-ui-fabric-react';
import Workspace from './components/workspace/Workspace';
import { SettingsStore, FiddleStore } from './models';

@observer
export default class App extends React.Component<any, AppStoreState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      isLoading: true
    };

    Promise.all([SettingsStore.loadFromLocalStorage(), FiddleStore.loadFromLocalStorage()])
      .then(results => {
          this.setState({
            isLoading: false,
            settingsStore: results[0],
            fiddleStore: results[1]
          });
      });
  }

  render() {
    const { isLoading, settingsStore, fiddleStore } = this.state;
    return (
      <Fabric>
        {isLoading || !settingsStore || !fiddleStore
          ? <div>loading...</div>
          : <Workspace settingsStore={settingsStore} fiddleStore={fiddleStore} />
        }
      </Fabric>
    );
  }
}

export interface AppStoreState {
  isLoading: boolean;
  settingsStore?: SettingsStore;
  fiddleStore?: FiddleStore;
}