import { autorun, observable, extendObservable, observe, action, computed, runInAction, toJS, IObservableObject } from 'mobx';
import { ScriptFile } from './ScriptFile';
import { ScriptFolder } from './ScriptFolder';
import * as localforage from 'localforage';
import * as URI from 'urijs';
import { assign, defaultsDeep, find, filter, values, findKey } from 'lodash';

import { defaultScriptRootFolder } from './sample-scripts';
export const FiddlesLocalStorageKey = 'sp-lookout-fiddles';

export class ScriptsStore {
    @observable
    private _fiddleRootFolder: ScriptFolder & IObservableObject;

    public constructor(fiddleRootFolder?: ScriptFolder) {
        if (!fiddleRootFolder) {
            this._fiddleRootFolder = observable(defaultScriptRootFolder);
        } else {
            // Make Built-Ins evergreen

            const builtInFolder = find(fiddleRootFolder.folders, { name: 'built-in' });
            assign(builtInFolder, find(defaultScriptRootFolder.folders, { name: 'built-in' }));

            //Set defaults
            defaultsDeep(fiddleRootFolder, defaultScriptRootFolder);

            //Ensure all files have default properties
            const fileMap = ScriptsStore.getFileMap(fiddleRootFolder);
            for (const fileName of Object.keys(fileMap)) {
                const file = fileMap[fileName];
                defaultsDeep(file, new ScriptFile());
            }

            this._fiddleRootFolder = observable(fiddleRootFolder);
        }
    }

    public get fiddleRootFolder(): ScriptFolder & IObservableObject {
        return this._fiddleRootFolder;
    }

    @computed
    public get starred(): Array<ScriptFile> {
        const fileMap = ScriptsStore.getFileMap(this._fiddleRootFolder);
        return filter(values(fileMap), (t) => t.starred);
    }

    public getFiddleSettingsByPath(path: string): ScriptFile | undefined {
        const fileMap = ScriptsStore.getFileMap(this._fiddleRootFolder);
        return fileMap[path];
    }

    public getFiddleSettingsRelativeToPath(path: string, relativePath: string): ScriptFile | undefined {
        const targetPath = URI(relativePath).absoluteTo(path);
        return this.getFiddleSettingsByPath(targetPath.href());
    }

    public getPathForFiddleSettings(settings: ScriptFile): string | undefined {
        const fileMap = ScriptsStore.getFileMap(this._fiddleRootFolder);
        return findKey(fileMap, settings);
    }

    public getFiddleFolderByPath(path: string): ScriptFolder | undefined {
        const folderMap = ScriptsStore.getFolderMap(this._fiddleRootFolder);
        return folderMap[path];
    }

    static async loadFromLocalStorage(): Promise<ScriptsStore> {
        const fiddleRootFolder = await localforage.getItem(FiddlesLocalStorageKey) as ScriptFolder;
        return new ScriptsStore(fiddleRootFolder);
    }

    @action
    static async saveToLocalStorage(fiddlesStore: ScriptsStore): Promise<ScriptFolder> {
        return localforage.setItem(FiddlesLocalStorageKey, toJS(fiddlesStore._fiddleRootFolder));
    }

    static async removeSettings() {
        return localforage.removeItem(FiddlesLocalStorageKey);
    }

    public static getFileFolderMap(folder: ScriptFolder, path?: string, result?: { [path: string]: { type: 'file' | 'folder', item: ScriptFolder | ScriptFile } }): { [path: string]: { type: 'file' | 'folder', item: ScriptFolder | ScriptFile } } {
        if (!folder) {
            return {};
        }

        if (!result) {
            result = {};
        }

        for (let fi of folder.files) {
            const currentFilePath = path ? `${path}/${fi.name}` : fi.name;
            result[currentFilePath] = {
                type: 'file',
                item: fi
            };
        }

        for (let f of folder.folders) {
            const currentPath = path ? `${path}/${f.name}` : f.name;
            result[currentPath] = {
                type: 'folder',
                item: f
            };

            this.getFileFolderMap(f, currentPath, result);
        }

        return result;
    }

    public static getFolderMap(folder: ScriptFolder, path?: string): { [path: string]: ScriptFolder } {
        if (!folder) {
            return {};
        }

        let result: { [path: string]: ScriptFolder } = {};
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

    public static getFileMap(folder: ScriptFolder): { [path: string]: ScriptFile } {
        if (!folder) {
            return {};
        }

        let result: { [path: string]: ScriptFile } = {};
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