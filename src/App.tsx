import * as React from 'react';
import './App.css';

import { Fabric } from 'office-ui-fabric-react';
import Workspace from './workspace/Workspace';

class App extends React.Component<{}, {}> {
  public constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <Fabric>
        <Workspace />
      </Fabric>
    );
  }
}

export default App;
