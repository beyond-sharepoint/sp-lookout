import { SPContextConfig, defaultSPContextConfig } from '../services/spcontext';

export interface BaristaSettings {
    tenantUrl: string;
    spContextConfig: SPContextConfig;
}

export const defaultBaristaSettings: BaristaSettings = {
    tenantUrl: '',
    spContextConfig: defaultSPContextConfig
};