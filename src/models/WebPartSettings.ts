export interface WebPartSettings {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: WebPartType;
    title: string;
    locked: boolean;
    props: any;
    //[others: string]: any;
}

export enum WebPartType {
    chart = 'chart',
    clock = 'clock',
    note = 'note',
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
    locked: false,
    props: undefined
};