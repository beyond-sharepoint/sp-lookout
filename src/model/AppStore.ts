import { autorun, observable, observe, action, runInAction, toJS } from 'mobx';
import { debounce, throttle } from 'lodash';
import * as localforage from 'localforage';

import { FiddleState } from './FiddleState';

export * from './FiddleState';
export const FiddlesLocalStorageKey = 'sp-lookout-fiddles';

export class AppStore {
    constructor() {
        this.workspaceState = new WorkspaceState();
    }

    @observable
    public workspaceState: WorkspaceState;
}

export class WorkspaceState {
    @observable
    public components: Array<SPLookoutComponentState> = [];

    @observable
    public selectedFiddle: FiddleState;

    @observable
    public fiddles: Array<FiddleState> = [];

    constructor() {
        const initialFiddleState = new FiddleState();
        this.fiddles = [initialFiddleState];
        this.selectFiddle(this.fiddles[0]);
    }

    @action
    async loadFiddles() {
        const fiddles = await localforage.getItem(FiddlesLocalStorageKey) as Array<FiddleState>;
        runInAction(() => {
            this.fiddles = fiddles;
            if (!this.fiddles || this.fiddles.length === 0) {
                const initialFiddleState = new FiddleState();
                this.fiddles = [initialFiddleState];
            }
            this.selectFiddle(this.fiddles[0]);
        });
    }

    @action
    saveFiddles() {
        localforage.setItem(FiddlesLocalStorageKey, toJS(this.fiddles));
    }

    @action
    selectFiddle(fiddle: FiddleState): void {
        this.selectedFiddle = fiddle;
    }
}

export class SPLookoutComponentState {
    @observable
    fiddleId: string;
}

export class FiddleConfig {
    @observable
    languageDefinitions: Array<string>;

    @observable
    proxyRequireJSConfig: any;
}

let store = (<any>window).store = new AppStore();

autorun(() => {
    observe(store.workspaceState.selectedFiddle, (change) => {
        store.workspaceState.saveFiddles();
        //debounce(store.workspaceState.saveFiddles, 250);
        //throttle(store.workspaceState.saveFiddles, 1000);
    });

    //console.dir(store.workspaceState.selectedFiddle);
});

export default store;