import * as React from 'react';
import { observer } from 'mobx-react';

/**
 * Represents a component that renders a dynamic SPLookout component on a Lookout Page
 */
@observer
export default class SPLookoutPageComponent extends React.Component<{}, {}> {
  public constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div></div>
    );
  }
}