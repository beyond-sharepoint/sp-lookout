import { action, observable, toJS } from 'mobx';

export class VisualSettings {
    sidebarWidth: number = 215;
    asidePrimaryPaneHeight: number | string = '60%';
}