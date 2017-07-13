import { autorun, observable, extendObservable, observe, action, computed, runInAction, toJS, IObservableObject } from 'mobx';
import { FiddleSettings } from './FiddleSettings';
import { FiddleFolder, defaultFiddleRootFolder } from './FiddleFolder';
import * as localforage from 'localforage';
import { defaultsDeep, find, filter, pick } from 'lodash';

export const FiddlesLocalStorageKey = 'sp-lookout-fiddles';

export class FiddlesStore {
    @observable
    private _fiddleRootFolder: FiddleFolder & IObservableObject;

    public constructor(fiddleRootFolder?: FiddleFolder) {
        if (!fiddleRootFolder) {
            this._fiddleRootFolder = observable(defaultFiddleRootFolder);
        } else {
            this._fiddleRootFolder = observable(defaultsDeep(fiddleRootFolder, defaultFiddleRootFolder) as FiddleFolder);
        }
    }

    public get fiddleRootFolder(): FiddleFolder & IObservableObject {
        return this._fiddleRootFolder;
    }

    @computed
    public get starred(): Array<FiddleSettings> {
        const filesFlat = FiddlesStore.getFlattenedFiles(this._fiddleRootFolder);
        const filteredFiles = filter(filesFlat, (t) => t.file.starred);
        let result: Array<FiddleSettings> = [];
        for(let file of filteredFiles) {
            result.push(file.file);
        }
        return result;
    }

    public getFiddleSettingsById(id: string): FiddleSettings | undefined {
        const filesFlat = FiddlesStore.getFlattenedFiles(this._fiddleRootFolder);
        const result = find(filesFlat, (t) => t.file.id === id);
        return result ? result.file : undefined;
    }

    public getFiddleSettingsByPath(path: string): FiddleSettings | undefined {
        const filesFlat = FiddlesStore.getFlattenedFiles(this._fiddleRootFolder);
        const result = find(filesFlat, { path: path });
        return result ? result.file : undefined;
    }

    static async loadFromLocalStorage(): Promise<FiddlesStore> {
        const fiddleRootFolder = await localforage.getItem(FiddlesLocalStorageKey) as FiddleFolder;
        return new FiddlesStore(fiddleRootFolder);
    }

    @action
    static async saveToLocalStorage(fiddlesStore: FiddlesStore): Promise<FiddleFolder> {
        return localforage.setItem(FiddlesLocalStorageKey, toJS(fiddlesStore._fiddleRootFolder));
    }

    public static getFlattenedFolders(folder: FiddleFolder, parentPath?: string): Array<{path: string, folder: FiddleFolder}> {
        if (!folder) {
            return [];
        }

        if (!parentPath) {
            parentPath = folder.name;
        }

        let result: Array<{path: string, folder: FiddleFolder}> = [];
        for (let f of folder.folders) {
            const currentPath = parentPath ? `${parentPath}/${f.name}` : f.name;
            result.push({
                path: currentPath,
                folder: f
            });
            result = result.concat(this.getFlattenedFolders(f, currentPath));
        }
        return result;
    }

    public static getFlattenedFiles(folder: FiddleFolder): Array<{path: string, file: FiddleSettings}> {
        if (!folder) {
            return [];
        }

        let result: Array<{path: string, file: FiddleSettings}> = [];
        for (let currentFolderFile of folder.files) {
            result.push({
                path: currentFolderFile.name,
                file: currentFolderFile
            });
        }
        const flattenedFolders = this.getFlattenedFolders(folder);
        for (let innerFolder of flattenedFolders) {
            for (let file of innerFolder.folder.files) {
                result.push({
                    path: `${innerFolder.path}/${file.name}`,
                    file: file
                });
            }
        }

        return result;
    }
}