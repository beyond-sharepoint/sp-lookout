import { action, observable, toJS } from 'mobx';

export class LookoutSettings {
    @observable
    sidebarWidth: number = 215;
    @observable
    asidePrimaryPaneHeight: number | string = '60%';
}