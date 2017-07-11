import * as React from 'react';
import './App.css';
import { observer } from 'mobx-react';
import { Fabric } from 'office-ui-fabric-react';
import Workspace from './components/workspace/Workspace';
import { AppStore } from './models/AppStore';

@observer
class App extends React.Component<any, any> {
  public constructor(props: any) {
    super(props);

    this.state = {
      isLoading: true
    };

    AppStore.load()
      .then((appStore) => {
        this.setState({
          isLoading: false,
          appStore: appStore
        });
      });
  }

  render() {
    const { isLoading, appStore } = this.state;
    return (
      <Fabric>
        {isLoading
          ? <div>loading...</div>
          : <Workspace appStore={this.state.appStore} />
        }
      </Fabric>
    );
  }
}

export default App;
