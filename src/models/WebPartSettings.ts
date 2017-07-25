export interface WebPartSettings {
    title: string;
    type: WebPartType;
    attributes: Array<string>;
    locked: boolean;
    props: object | null;
}

export interface WebPartLayout {
    x: number;
    y: number;
    w: number;
    h: number;
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

export const defaultWebPartLayout: WebPartLayout = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
}

export const defaultWebPartSettings: WebPartSettings = {
    title: 'New WebPart',
    type: WebPartType.text,
    attributes: [],
    locked: false,
    props: null
};