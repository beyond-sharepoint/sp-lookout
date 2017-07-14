import { action, observable    } from 'mobx';
import { debounce, throttle, defaultsDeep, find } from 'lodash';
import * as localforage from 'localforage';

import { HostWebProxySettings, defaultHostWebProxySettings} from './HostWebProxySettings';
import { VisualSettings, defaultVisualSettings } from './VisualSettings';

export const SettingsLocalStorageKey = 'sp-lookout-settings';

export class SettingsStore {
    @observable
    private _hostWebProxySettings: HostWebProxySettings;

    @observable
    private _visualSettings: VisualSettings;

    constructor(hostWebProxySettings?: HostWebProxySettings, visualSettings?: VisualSettings) {
        if (!hostWebProxySettings) {
            this._hostWebProxySettings = observable(defaultHostWebProxySettings);
        } else {
            this._hostWebProxySettings = observable(defaultsDeep(hostWebProxySettings, defaultHostWebProxySettings) as HostWebProxySettings);
        }

        if (!visualSettings) {
            this._visualSettings = observable(defaultVisualSettings);
        } else {
            this._visualSettings = observable(defaultsDeep(visualSettings, defaultVisualSettings) as VisualSettings);
        }
    }

    public get hostWebProxySettings() {
        return this._hostWebProxySettings;
    }

    public get visualSettings() {
        return this._visualSettings;
    }

    static async loadFromLocalStorage(): Promise<SettingsStore> { 
        let settings: Settings = {
            hostWebProxySettings: undefined,
            visualSettings: undefined
        };

        const persistedSettings: any = await localforage.getItem(SettingsLocalStorageKey);

        if (persistedSettings) {
            settings.hostWebProxySettings = persistedSettings.hostWebProxySettings || undefined;
            settings.visualSettings = persistedSettings.visualSettings || undefined;
        }

        return new SettingsStore(settings.hostWebProxySettings, settings.visualSettings);
    }

    @action static async saveToLocalStorage(settingsStore: SettingsStore) {
        throw Error('Not Implemented');
    }
}

type Settings = {
    hostWebProxySettings?: HostWebProxySettings,
    visualSettings?: VisualSettings
};