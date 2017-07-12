import { autorun, observable, extendObservable, observe, action, computed, runInAction, toJS, IObservableObject } from 'mobx';
import { FiddleSettings } from './FiddleSettings';
import { FiddleFolder, defaultFiddleRootFolder } from './FiddleFolder';
import * as localforage from 'localforage';
import { defaultsDeep, find, filter } from 'lodash';

export const FiddlesLocalStorageKey = 'sp-lookout-fiddles';

export class FiddleStore {
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
        const files = FiddleStore.getFlattenedFiles(this._fiddleRootFolder);
        return filter(files, { starred: true });
    }

    public getFiddleSettings(id: string): FiddleSettings | undefined {
        const filesFlat = FiddleStore.getFlattenedFiles(this._fiddleRootFolder);
        return find(filesFlat, { 'id': id });
    }

    static async loadFromLocalStorage(): Promise<FiddleStore> {
        const fiddleRootFolder = await localforage.getItem(FiddlesLocalStorageKey) as FiddleFolder;
        return new FiddleStore(fiddleRootFolder);
    }

    @action
    static async saveToLocalStorage(fiddleStore: FiddleStore): Promise<FiddleFolder> {
         return localforage.setItem(FiddlesLocalStorageKey, toJS(fiddleStore._fiddleRootFolder));
    }

    public static getFlattenedFolders(folder: FiddleFolder): Array<FiddleFolder> {
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

    public static getFlattenedFiles(folder: FiddleFolder): Array<FiddleSettings> {
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
}