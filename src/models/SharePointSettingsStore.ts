import { action, observable, toJS } from 'mobx';
import { debounce, throttle, defaultsDeep, find } from 'lodash';
import * as localforage from 'localforage';

import { SharePointSettings } from './SharePointSettings';

export const SharePointSettingsLocalStorageKey = 'sp-lookout-sharepoint-settings';

export class SharePointSettingsStore {
    @observable
    private _sharePointSettings: SharePointSettings;

    constructor(sharePointSettings?: SharePointSettings) {
        if (!sharePointSettings) {
            this._sharePointSettings = observable(new SharePointSettings());
        } else {
            this._sharePointSettings = observable(defaultsDeep(sharePointSettings, new SharePointSettings()) as SharePointSettings);
        }
    }

    public get sharePointSettings() {
        return this._sharePointSettings;
    }

    static async loadFromLocalStorage(): Promise<SharePointSettingsStore> {
        const appSettings = await localforage.getItem(SharePointSettingsLocalStorageKey) as SharePointSettings;
        return new SharePointSettingsStore(appSettings);
    }

    @action
    static async saveToLocalStorage(spSettingsStore: SharePointSettingsStore) {
        return localforage.setItem(SharePointSettingsLocalStorageKey, toJS(spSettingsStore._sharePointSettings));
    }

    static async removeSettings() {
        return localforage.removeItem(SharePointSettingsLocalStorageKey);
    }
}