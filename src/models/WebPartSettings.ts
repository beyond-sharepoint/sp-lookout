export interface WebPartSettings {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: WebPartType;
    title: string;
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
    title: 'New WebPart',
    type: WebPartType.viewer
}