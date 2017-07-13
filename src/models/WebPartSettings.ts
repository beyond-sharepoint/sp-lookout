export interface WebPartSettings {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: WebPartType;
    [others: string]: any;
}

export enum WebPartType {
    chart = 'chart',
    note = 'note',
    text = 'text',
    time = 'time',
    viewer = 'viewer'
}

export const defaultWebPartSettings: Partial<WebPartSettings> = {
    text: 'hello, world',
    type: WebPartType.viewer
}