import { SPContextConfig, defaultSPContextConfig } from '../services/spcontext';

export interface BaristaSettings {
    tenantUrl: string;
    testTenantUrl: string;
    spContextConfig: SPContextConfig;
}

export const defaultBaristaSettings: BaristaSettings = {
    tenantUrl: '',
    testTenantUrl: '',
    spContextConfig: defaultSPContextConfig
};