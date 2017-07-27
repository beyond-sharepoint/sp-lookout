import { action, observable, toJS } from 'mobx';
import { debounce, throttle, defaultsDeep, find } from 'lodash';
import * as localforage from 'localforage';

import { BaristaSettings, defaultBaristaSettings} from './BaristaSettings';
import { VisualSettings } from './VisualSettings';

export const SettingsLocalStorageKey = 'sp-lookout-settings';

export class SettingsStore {
    @observable
    private _baristaSettings: BaristaSettings;

    @observable
    private _visualSettings: VisualSettings;

    constructor(baristaSettings?: BaristaSettings, visualSettings?: VisualSettings) {
        if (!baristaSettings) {
            this._baristaSettings = observable(defaultBaristaSettings);
        } else {
            this._baristaSettings = observable(defaultsDeep(baristaSettings, defaultBaristaSettings) as BaristaSettings);
        }

        if (!visualSettings) {
            this._visualSettings = observable(new VisualSettings());
        } else {
            this._visualSettings = observable(defaultsDeep(visualSettings, new VisualSettings()) as VisualSettings);
        }
    }

    public get baristaSettings() {
        return this._baristaSettings;
    }

    public get visualSettings() {
        return this._visualSettings;
    }

    static async loadFromLocalStorage(): Promise<SettingsStore> { 
        let settings: Settings = {
            baristaSettings: undefined,
            visualSettings: undefined
        };

        const persistedSettings: Settings = await localforage.getItem(SettingsLocalStorageKey);

        if (persistedSettings) {
            settings.baristaSettings = persistedSettings.baristaSettings || undefined;
            settings.visualSettings = persistedSettings.visualSettings || undefined;
        }

        return new SettingsStore(settings.baristaSettings, settings.visualSettings);
    }

    @action static async saveToLocalStorage(settingsStore: SettingsStore) {
        const settingsToPersist = {
            baristaSettings: toJS(settingsStore._baristaSettings),
            visualSettings: toJS(settingsStore._visualSettings)
        };

        return localforage.setItem(SettingsLocalStorageKey, settingsToPersist);
    }

    static async removeSettings() {
        return localforage.removeItem(SettingsLocalStorageKey);
    }
}

type Settings = {
    baristaSettings?: BaristaSettings,
    visualSettings?: VisualSettings
};