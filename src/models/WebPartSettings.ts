export interface WebPartSettings {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    type: WebPartType;
    attributes: Array<string>;
    locked: boolean;
    props: object | null;
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

export const defaultWebPartSettings: WebPartSettings = {
    id: '',
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    title: 'New WebPart',
    type: WebPartType.text,
    attributes: [],
    locked: false,
    props: null
};