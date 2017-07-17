import * as React from 'react';
import { observer } from 'mobx-react';

import { PrimaryButton, DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';

@observer
export class Step0 extends React.Component<Step0Props, any> {
    public render() {
        const {
            onSkip,
            onNext
        } = this.props;
        return (
            <div className="welcome-modal-container">
                <div className='welcome-modal-header'>
                    Welcome to SP Lookout!
                </div>
                <div className="welcome-modal-body">
                    <h2>
                        It looks like this is your first time using SP Lookout! Thanks for coming!
                    </h2>
                    <p style={{ paddingTop: '30px' }}>
                        There are just a few simple steps that we need to do in order to get
                    SP Lookout! wired up and talking to your SharePoint environment.
                    </p>
                    <p>
                        <strong>Important:</strong>&nbsp;You will need at least design permissions to perform all required setup tasks.
                        Once completed, only read-access to the SharePoint environment is required.
                    </p>

                    <h3 style={{ paddingTop: '40px' }}>Let's get started!</h3>
                </div>
                <div className="welcome-modal-note">
                    <h5>(If you're already a pro at this, you can skip setup and configure SP Lookout! yourself.)</h5>
                </div>
                <div className="welcome-modal-footer">
                    <DefaultButton text='Skip' onClick={onSkip} />
                    <PrimaryButton text='Next' onClick={onNext} />
                </div>
            </div>
        );
    }
}

export interface Step0Props {
    onSkip: (ev: React.MouseEvent<HTMLButtonElement>) => any;
    onNext: (ev: React.MouseEvent<HTMLButtonElement>) => any;
}