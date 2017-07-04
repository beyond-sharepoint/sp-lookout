import * as React from 'react';
import { observer } from 'mobx-react';

/**
 * Represents a component that renders a dynamic SPLookout component defined in the workspace.
 */
@observer
class SPLookoutComponent extends React.Component<{}, {}> {
  public constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div></div>
    );
  }
}

export default SPLookoutComponent;
