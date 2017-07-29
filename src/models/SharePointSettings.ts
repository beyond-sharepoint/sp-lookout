import { action, observable, toJS } from 'mobx';
import { SPContextConfig, defaultSPContextConfig } from '../services/spcontext';

export class SharePointSettings {
    @observable
    tenantUrl: string = '';
    @observable
    testTenantUrl: string = '';
    @observable
    spContextConfig: SPContextConfig = defaultSPContextConfig;
}