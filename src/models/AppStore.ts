import { autorun, observable, extendObservable, observe, action, runInAction, toJS } from 'mobx';
import { debounce, throttle, defaultsDeep, find } from 'lodash';
import * as localforage from 'localforage';

import { WorkspaceSettings, defaultWorkspaceSettings } from './WorkspaceSettings';
import { FiddleFolder, defaultFiddleRootFolder } from './FiddleFolder';
import { FiddleSettings, defaultFiddleSettings } from './FiddleSettings';

export const FiddlesLocalStorageKey = 'sp-lookout-fiddles';

export class AppStore {
    @observable
    private _workspaceSettings: WorkspaceSettings;

    constructor(workspaceSettings?: WorkspaceSettings) {
        if (!workspaceSettings) {
            this._workspaceSettings = observable(defaultWorkspaceSettings);
        } else {
            this._workspaceSettings = observable(defaultsDeep(workspaceSettings, defaultWorkspaceSettings) as WorkspaceSettings);
        }
    }

    public get workspaceSettings() {
        return this._workspaceSettings;
    }

    extendObjectWithDefaults(obj: {}, defaults: any) {
        let newProps = {};
        for (let prop of Object.keys(defaults)) {
            if (!obj.hasOwnProperty(prop)) {
                newProps[prop] = defaults[prop];
            }
        }

        extendObservable(obj, newProps);
    }

    getFlattenedFolders(folder: FiddleFolder): Array<FiddleFolder> {
        if (!folder) {
            return [];
        }

        let result: Array<FiddleFolder> = [];
        for (let f of folder.folders) {
            result.push(f);
            result = result.concat(this.getFlattenedFolders(f));
        }
        return result;
    }

    getFlattenedFiles(folder: FiddleFolder): Array<FiddleSettings> {
        if (!folder) {
            return [];
        }

        let result: Array<FiddleSettings> = [];
        for (let currentFolderFile of folder.files) {
            result.push(currentFolderFile);
        }
        const flattenedFolders = this.getFlattenedFolders(folder);
        for (let innerFolder of flattenedFolders) {
            for (let file of innerFolder.files) {
                result.push(file);
            }
        }

        return result;
    }

    getFiddleSettings(id: string): FiddleSettings | undefined {
        const filesFlat = this.getFlattenedFiles(this._workspaceSettings.fiddleRootFolder);
        return find(filesFlat, { 'id': id });
    }

    @action
    saveFiddles() {
        localforage.setItem(FiddlesLocalStorageKey, toJS(this._workspaceSettings.fiddleRootFolder));
    }

    @action
    saveFiddle(fiddle: FiddleSettings) {
        //TODO: Optimize this.
        localforage.setItem(FiddlesLocalStorageKey, toJS(this._workspaceSettings.fiddleRootFolder));
    }

    static async load(): Promise<AppStore> {
        let workspaceSettings: Partial<WorkspaceSettings> = {};
        workspaceSettings.fiddleRootFolder = await localforage.getItem(FiddlesLocalStorageKey) as FiddleFolder;
        return new AppStore(workspaceSettings as WorkspaceSettings);
    }
}