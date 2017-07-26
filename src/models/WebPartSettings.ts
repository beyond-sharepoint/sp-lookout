import { observable } from 'mobx';

export class WebPartSettings {
    @observable 
    title: string = 'New WebPart';

    @observable
    type: WebPartType = WebPartType.text;

    @observable
    attributes: Array<string> = [];

    @observable
    locked: boolean = false;

    @observable
    props: object | null = null;
}

export class WebPartLayout {
    x: number = 0;
    y: number = 0;
    w: number = 2;
    h: number = 2;
}

export enum WebPartType {
    chart = 'chart',
    clock = 'clock',
    note = 'note',
    image = 'image',
    scriptEditor = 'scriptEditor',
    text = 'text',
    viewer = 'viewer'
}