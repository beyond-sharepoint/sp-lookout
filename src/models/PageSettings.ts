import { WebPartSettings } from './WebPartSettings';

export interface PageGroup {
    name: string;
    iconClassName?: string;
    pages: Array<PageSettings>;
}

export interface PageSettings {
    id: string;
    name: string;
    iconClassName?: string;
    columns: number,
    rowHeight: number,
    locked: boolean;
    webParts: Array<WebPartSettings>;
}

export const defaultPages: Array<PageSettings> = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        iconClassName: 'PanoIndicator',
        columns: 12,
        rowHeight: 30,
        locked: false,
        webParts: [
            {
                id: "0",
                x: 0,
                y: 0,
                w: 4,
                h: 8,
                text: 'SPLookout!',
                props: {}
            }
        ],
    }
]