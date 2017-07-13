import * as React from 'react';
import { observer } from 'mobx-react';

/**
 * Represents a component that renders a dynamic component on a Page
 */
@observer
export default class WebPartBase extends React.Component<{}, {}> {
  public constructor(props: any) {
    super(props);
  }

  public render() {
    return (
      <div></div>
    );
  }

  public renderSideBar() {
  }
}