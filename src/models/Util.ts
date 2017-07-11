import { action, extendObservable } from 'mobx';

export class Util {

    @action
    public static extendObjectWithDefaults(obj: {}, defaults: any): {} {
        let newProps = {};
        for (let prop of Object.keys(defaults)) {
            if (!obj.hasOwnProperty(prop)) {
                newProps[prop] = defaults[prop];
            }
        }

        return extendObservable(obj, newProps);
    }
}