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
    locked: boolean;
    webParts: Array<WebPartSettings>;
}

export const defaultPages: Array<PageSettings> = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        iconClassName: 'PanoIndicator',
        locked: false,
        webParts: [
            {
                x: 0,
                y: 0,
                w: 4,
                h: 8,
                i: "0",
                text: 'SPLookout!',
                props: {}
            }
        ],
    }
]