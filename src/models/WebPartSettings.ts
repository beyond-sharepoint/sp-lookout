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

export const defaultWebPartSettings: Partial<WebPartSettings> = {
    title: 'New WebPart',
    type: WebPartType.text,
    locked: false,
    props: {}
}