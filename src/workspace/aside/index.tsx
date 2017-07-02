import * as React from 'react';
import { Nav, INavLinkGroup } from 'office-ui-fabric-react/lib/Nav';

export default class Aside extends React.Component<AsideProps, any> {
    public render() {
        return (
            <Nav
                className="aside"
                groups={this.props.navItems}
                expandedStateText={'expanded'}
                collapsedStateText={'collapsed'}
                selectedKey={'dashboard'}
            />
        );
    }
}

export interface AsideProps {
    navItems: INavLinkGroup[];
}