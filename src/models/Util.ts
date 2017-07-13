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

    /**
     * Utility function to create a random string of characters of a given length.
     * @param length Desired length of the id
     */
    public static makeId(length: number): string {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
}