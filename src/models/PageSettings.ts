import { observable, map, action } from 'mobx';
import { Util } from './Util';
import { WebPartSettings, WebPartLayout, WebPartType } from './WebPartSettings';

export interface PageGroup {
    name: string;
    iconClassName?: string;
    pages: Array<PageSettings>;
}

export type PageBreakpoints = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';
export type PageLayout = { [webPartId: string]: WebPartLayout };

export class PageSettings {
    public constructor(name?: string) {
        this.id = Util.makeId(8);
        this.name = name || '';
    }

    @observable
    id: string = '';

    @observable
    name: string = '';

    @observable
    iconClassName: string = '';

    @observable
    isExpanded: boolean = true;

    @observable
    locked: boolean = false;

    @observable
    breakpoints: {[P in PageBreakpoints]: number } = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

    @observable
    columns: {[P in PageBreakpoints]: number} = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

    @observable
    layouts: ResponsivePageLayouts = new ResponsivePageLayouts();

    @observable
    rowHeight: number = 30;

    @observable
    compactVertical: boolean = false;

    @observable
    subPages: Array<PageSettings> = [];

    @observable
    webParts: { [webPartId: string]: WebPartSettings } = {};
}

export class ResponsivePageLayouts {
    @observable
    lg: PageLayout = {};

    @observable
    md: PageLayout = {};

    @observable
    sm: PageLayout = {};

    @observable
    xs: PageLayout = {};

    @observable
    xxs: PageLayout = {};
}