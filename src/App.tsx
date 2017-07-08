import * as React from 'react';
import './App.css';
import { observer } from 'mobx-react';
import { Fabric } from 'office-ui-fabric-react';
import Workspace from './components/workspace/Workspace';
import appStore from './models/AppStore';

@observer
class App extends React.Component<{}, {}> {
  public constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <Fabric>
        <Workspace workspaceState={appStore.workspaceState} />
      </Fabric>
    );
  }
}

export default App;
