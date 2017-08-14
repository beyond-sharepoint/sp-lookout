import { observable } from 'mobx';
import { ScriptFile } from './ScriptFile';

export class ScriptFolder {
    @observable
    name: string = 'SPFiddle';

    @observable
    description: string = '';

    @observable
    collapsed: boolean = false;

    @observable
    locked: boolean = false;

    @observable
    starred: boolean = false;

    @observable
    iconClassName: string = '';

    @observable
    files: Array<ScriptFile> = [];

    @observable
    folders: Array<ScriptFolder> = [];
}