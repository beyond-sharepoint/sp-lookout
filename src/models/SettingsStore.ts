import { action, observable, toJS } from 'mobx';
import { debounce, throttle, defaultsDeep, find } from 'lodash';
import * as localforage from 'localforage';

import { SharePointSettings} from './SharePointSettings';
import { LookoutSettings } from './LookoutSettings';

export const SettingsLocalStorageKey = 'sp-lookout-settings';

export class SettingsStore {
    @observable
    private _sharePointSettings: SharePointSettings;

    @observable
    private _lookoutSettings: LookoutSettings;

    constructor(sharePointSettings?: SharePointSettings, lookoutSettings?: LookoutSettings) {
        if (!sharePointSettings) {
            this._sharePointSettings = observable(new SharePointSettings());
        } else {
            this._sharePointSettings = observable(defaultsDeep(sharePointSettings, new SharePointSettings()) as SharePointSettings);
        }

        if (!lookoutSettings) {
            this._lookoutSettings = observable(new LookoutSettings());
        } else {
            this._lookoutSettings = observable(defaultsDeep(lookoutSettings, new LookoutSettings()) as LookoutSettings);
        }
    }

    public get sharePointSettings() {
        return this._sharePointSettings;
    }

    public get lookoutSettings() {
        return this._lookoutSettings;
    }

    static async loadFromLocalStorage(): Promise<SettingsStore> { 
        let settings: Settings = {
            sharePointSettings: new SharePointSettings(),
            lookoutSettings: new LookoutSettings()
        };

        const persistedSettings: Settings = await localforage.getItem(SettingsLocalStorageKey);

        if (persistedSettings) {
            settings.sharePointSettings = persistedSettings.sharePointSettings || new SharePointSettings;
            settings.lookoutSettings = persistedSettings.lookoutSettings || new LookoutSettings();
        }

        return new SettingsStore(settings.sharePointSettings, settings.lookoutSettings);
    }

    @action
    static async saveToLocalStorage(settingsStore: SettingsStore) {
        const settingsToPersist: Settings = {
            sharePointSettings: toJS(settingsStore._sharePointSettings),
            lookoutSettings: toJS(settingsStore._lookoutSettings)
        };

        return localforage.setItem(SettingsLocalStorageKey, settingsToPersist);
    }

    static async removeSettings() {
        return localforage.removeItem(SettingsLocalStorageKey);
    }
}

type Settings = {
    sharePointSettings?: SharePointSettings,
    lookoutSettings?: LookoutSettings
};

SettingsStore.saveToLocalStorage = debounce(SettingsStore.saveToLocalStorage, 1000);