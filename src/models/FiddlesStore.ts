import { autorun, observable, extendObservable, observe, action, computed, runInAction, toJS, IObservableObject } from 'mobx';
import { FiddleSettings, defaultFiddleSettings } from './FiddleSettings';
import { FiddleFolder, defaultFiddleRootFolder } from './FiddleFolder';
import * as localforage from 'localforage';
import { assign, defaultsDeep, find, filter, values, findKey } from 'lodash';

export const FiddlesLocalStorageKey = 'sp-lookout-fiddles';

export class FiddlesStore {
    @observable
    private _fiddleRootFolder: FiddleFolder & IObservableObject;

    public constructor(fiddleRootFolder?: FiddleFolder) {
        if (!fiddleRootFolder) {
            this._fiddleRootFolder = observable(defaultFiddleRootFolder);
        } else {
            // Make Built-Ins evergreen

            const builtInFolder = find(fiddleRootFolder.folders, { name: 'built-in' });
            assign(builtInFolder, find(defaultFiddleRootFolder.folders, { name: 'built-in' }));

            //Set defaults
            defaultsDeep(fiddleRootFolder, defaultFiddleRootFolder);

            //Ensure all files have default properties
            const fileMap = FiddlesStore.getFileMap(fiddleRootFolder);
            for (const fileName of Object.keys(fileMap)) {
                const file = fileMap[fileName];
                defaultsDeep(file, defaultFiddleSettings);
            }

            this._fiddleRootFolder = observable(fiddleRootFolder);
        }
    }

    public get fiddleRootFolder(): FiddleFolder & IObservableObject {
        return this._fiddleRootFolder;
    }

    @computed
    public get starred(): Array<FiddleSettings> {
        const fileMap = FiddlesStore.getFileMap(this._fiddleRootFolder);
        return filter(values(fileMap), (t) => t.starred);
    }

    public getFiddleSettingsByPath(path: string): FiddleSettings | undefined {
        const fileMap = FiddlesStore.getFileMap(this._fiddleRootFolder);
        return fileMap[path];
    }

    public getPathForFiddleSettings(settings: FiddleSettings): string | undefined {
        const fileMap = FiddlesStore.getFileMap(this._fiddleRootFolder);
        return findKey(fileMap, settings);
    }

    public getFiddleFolderByPath(path: string): FiddleFolder | undefined {
        const folderMap = FiddlesStore.getFolderMap(this._fiddleRootFolder);
        return folderMap[path];
    }

    static async loadFromLocalStorage(): Promise<FiddlesStore> {
        const fiddleRootFolder = await localforage.getItem(FiddlesLocalStorageKey) as FiddleFolder;
        return new FiddlesStore(fiddleRootFolder);
    }

    @action
    static async saveToLocalStorage(fiddlesStore: FiddlesStore): Promise<FiddleFolder> {
        return localforage.setItem(FiddlesLocalStorageKey, toJS(fiddlesStore._fiddleRootFolder));
    }

    static async removeSettings() {
        return localforage.removeItem(FiddlesLocalStorageKey);
    }

    public static getFolderMap(folder: FiddleFolder, path?: string): { [path: string]: FiddleFolder } {
        if (!folder) {
            return {};
        }

        let result: { [path: string]: FiddleFolder } = {};
        for (let f of folder.folders) {
            const currentPath = path ? `${path}/${f.name}` : f.name;
            result[currentPath] = f;
            result = {
                ...this.getFolderMap(f, currentPath),
                ...result
            };
        }
        return result;
    }

    public static getFileMap(folder: FiddleFolder): { [path: string]: FiddleSettings } {
        if (!folder) {
            return {};
        }

        let result: { [path: string]: FiddleSettings } = {};
        for (let currentFolderFile of folder.files) {
            result[currentFolderFile.name] = currentFolderFile;
        }
        const folderMap = this.getFolderMap(folder);
        for (let path of Object.keys(folderMap)) {
            let innerFolder = folderMap[path];
            for (let file of innerFolder.files) {
                result[`${path}/${file.name}`] = file;
            }
        }

        return result;
    }
}