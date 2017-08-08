import { observable } from 'mobx';
import { FiddleSettings } from './FiddleSettings';

export class FiddleFolder {
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
    files: Array<FiddleSettings> = [];

    @observable
    folders: Array<FiddleFolder> = [];
}