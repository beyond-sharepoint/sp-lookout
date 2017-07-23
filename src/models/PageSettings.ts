import { WebPartSettings, WebPartType } from './WebPartSettings';

export interface PageGroup {
    name: string;
    iconClassName?: string;
    pages: Array<PageSettings>;
}

export interface PageSettings {
    id: string;
    name: string;
    iconClassName?: string;
    isExpanded: boolean;
    locked: boolean;
    columns: number;
    rowHeight: number;
    subPages: Array<PageSettings>;
    webParts: Array<WebPartSettings>;
}

export const defaultPageSettings: PageSettings = {
    id: 'dashboard',
    name: 'Dashboard',
    iconClassName: 'PanoIndicator',
    isExpanded: true,
    locked: false,
    columns: 12,
    rowHeight: 30,
    subPages: [],
    webParts: [
        { 'title': 'SP Lookout!', 'type': WebPartType.chart, 'locked': true, 'id': '0', 'x': 0, 'y': 0, 'w': 4, 'h': 8, 'props': null },
        { 'title': 'Current Time', 'type': WebPartType.clock, 'locked': true, 'props': null, 'id': 'YUPghotc', 'x': 8, 'y': 0, 'w': 3, 'h': 2 },
        { 'title': 'Notes', 'type': WebPartType.note, 'locked': true, 'props': { 'text': 'When the graph to the left goes over 10,000 microbars, run!\n\n12/2/2017: Got really close - 9,723.. I put on my running shoes.\n\n' }, 'id': 'cjNrnGO1', 'x': 4, 'y': 0, 'w': 3, 'h': 8 },
        { 'title': 'New WebPart', 'type': WebPartType.text, 'locked': false, 'props': null, 'id': 'rymjO6AR', 'x': 0, 'y': 8, 'w': 7, 'h': 3 }
    ]
};