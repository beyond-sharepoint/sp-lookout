import { action, observable, toJS } from 'mobx';
import { debounce, throttle, defaultsDeep, find } from 'lodash';
import * as localforage from 'localforage';

import { AppSettings } from './AppSettings';

export const AppSettingsLocalStorageKey = 'sp-lookout-app-settings';

export class AppSettingsStore {

    @observable
    private _appSettings: AppSettings;

    constructor(appSettings?: AppSettings) {
        if (!appSettings) {
            this._appSettings = observable(new AppSettings());
        } else {
            this._appSettings = observable(defaultsDeep(appSettings, new AppSettings()) as AppSettings);
        }
    }

    public get appSettings() {
        return this._appSettings;
    }

    static async loadFromLocalStorage(): Promise<AppSettingsStore> {
        const appSettings = await localforage.getItem(AppSettingsLocalStorageKey) as AppSettings;
        return new AppSettingsStore(appSettings);
    }

    @action
    static async saveToLocalStorage(settingsStore: AppSettingsStore) {
        return localforage.setItem(AppSettingsLocalStorageKey, toJS(settingsStore._appSettings));
    }

    static async removeSettings() {
        return localforage.removeItem(AppSettingsLocalStorageKey);
    }
}

AppSettingsStore.saveToLocalStorage = debounce(AppSettingsStore.saveToLocalStorage, 1000);