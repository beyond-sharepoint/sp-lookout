import { WebPartSettings, WebPartType } from './WebPartSettings';

export interface PageGroup {
    name: string;
    iconClassName?: string;
    pages: Array<PageSettings>;
}

export type PageBreakpoints = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

export interface PageSettings {
    id: string;
    name: string;
    iconClassName?: string;
    isExpanded: boolean;
    locked: boolean;
    breakpoints: {[P in PageBreakpoints]: number };
    columns: {[P in PageBreakpoints]: number};
    rowHeight: number;
    compactVertical: boolean;
    subPages: Array<PageSettings>;
    webParts: Array<WebPartSettings>;
}

export const defaultPageSettings: PageSettings = {
    id: 'dashboard',
    name: 'Dashboard',
    iconClassName: 'PanoIndicator',
    isExpanded: true,
    locked: false,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    columns: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    rowHeight: 30,
    compactVertical: false,
    subPages: [],
    webParts: [
        { 'title': 'SP Lookout!', 'type': WebPartType.chart, 'attributes': [], 'locked': true, 'props': null, 'id': '0', 'x': 0, 'y': 0, 'w': 4, 'h': 8 },
        { 'title': 'Current Time', 'type': WebPartType.clock, 'attributes': [], 'locked': true, 'props': null, 'id': 'YUPghotc', 'x': 8, 'y': 0, 'w': 3, 'h': 2 },
        { 'title': 'Notes', 'type': WebPartType.note, 'attributes': [], 'locked': true, 'props': { 'text': 'When the graph to the left goes over 10,000 microbars, run!\n\n12/2/2017: Got really close - 9,723.. I put on my running shoes.\n\n' }, 'id': 'cjNrnGO1', 'x': 4, 'y': 0, 'w': 3, 'h': 8 },
        { 'title': 'New WebPart', 'type': WebPartType.text, 'attributes': [], 'locked': false, 'props': null, 'id': 'rymjO6AR', 'x': 0, 'y': 8, 'w': 7, 'h': 3 }
    ]
};