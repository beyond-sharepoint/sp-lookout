import { observable } from 'mobx';

export class WebPartSettings {
    @observable 
    title: string = 'New WebPart';

    @observable
    type: string = 'text';

    @observable
    attributes: Array<string> = [];

    @observable
    locked: boolean = false;

    @observable
    backgroundColor: string = '#ccc';

    @observable
    chromeStyle: string = 'default';

    @observable
    props: object | null = null;
}

export class WebPartLayout {
    x: number = 0;
    y: number = 0;
    w: number = 2;
    h: number = 2;
}