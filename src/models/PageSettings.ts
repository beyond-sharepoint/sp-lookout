import { WebPartSettings, WebPartLayout, WebPartType } from './WebPartSettings';

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
    layouts: {[P in PageBreakpoints]: { [id: string]: WebPartLayout }};
    rowHeight: number;
    compactVertical: boolean;
    subPages: Array<PageSettings>;
    webParts: { [id: string]: WebPartSettings };
}

export const defaultPageSettings: PageSettings = {
    id: 'dashboard',
    name: 'Dashboard',
    iconClassName: 'PanoIndicator',
    isExpanded: true,
    locked: false,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    columns: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    layouts: {
        'lg': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 4,
                'h': 8
            },
            'YUPghotc': {
                'x': 8,
                'y': 0,
                'w': 3,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 4,
                'y': 0,
                'w': 3,
                'h': 8
            },
            'rymjO6AR': {
                'x': 0,
                'y': 17,
                'w': 4,
                'h': 3
            }
        },
        'md': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 4,
                'h': 8
            },
            'YUPghotc': {
                'x': 8,
                'y': 0,
                'w': 3,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 4,
                'y': 0,
                'w': 3,
                'h': 8
            },
            'rymjO6AR': {
                'x': 0,
                'y': 8,
                'w': 7,
                'h': 3
            }
        },
        'sm': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 2,
                'h': 7
            },
            'YUPghotc': {
                'x': 4,
                'y': 0,
                'w': 2,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 2,
                'y': 0,
                'w': 2,
                'h': 7
            },
            'rymjO6AR': {
                'x': 0,
                'y': 7,
                'w': 4,
                'h': 3
            }
        },
        'xs': {
            '0': {
                'x': 0,
                'y': 0,
                'w': 2,
                'h': 8
            },
            'YUPghotc': {
                'x': 2,
                'y': 0,
                'w': 2,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 2,
                'y': 2,
                'w': 2,
                'h': 6
            },
            'rymjO6AR': {
                'x': 0,
                'y': 8,
                'w': 4,
                'h': 3
            }
        },
        'xxs': {
            '0': {
                'x': 0,
                'y': 2,
                'w': 2,
                'h': 6
            },
            'YUPghotc': {
                'x': 0,
                'y': 0,
                'w': 2,
                'h': 2
            },
            'cjNrnGO1': {
                'x': 0,
                'y': 8,
                'w': 2,
                'h': 8
            },
            'rymjO6AR': {
                'x': 0,
                'y': 16,
                'w': 2,
                'h': 3
            }
        }
    },
    rowHeight: 30,
    compactVertical: false,
    subPages: [],
    webParts: {
        '0': { 'title': 'SP Lookout!', 'type': WebPartType.chart, 'attributes': [], 'locked': true, 'props': null },
        'YUPghotc': { 'title': 'Current Time', 'type': WebPartType.clock, 'attributes': [], 'locked': true, 'props': null },
        'cjNrnGO1': { 'title': 'Notes', 'type': WebPartType.note, 'attributes': [], 'locked': true, 'props': { 'text': 'When the graph to the left goes over 10,000 microbars, run!\n\n12/2/2017: Got really close - 9,723.. I put on my running shoes.\n\n' } },
        'rymjO6AR': { 'title': 'New WebPart', 'type': WebPartType.text, 'attributes': [], 'locked': false, 'props': null }
    }
};