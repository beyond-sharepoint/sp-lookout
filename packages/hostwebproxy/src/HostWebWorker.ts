import * as tslib from 'tslib/tslib.js';
const get = require('lodash/get.js');
const set = require('lodash/set.js');
const isArray = require('lodash/isArray.js');
const isPlainObject = require('lodash/isPlainObject.js');
const flatMap = require('lodash/flatMap.js');
const map = require('lodash/map.js');
const concat = require('lodash/concat.js');
const keys = require('lodash/keys.js');

class SPLookout {
    private context: any;
    private chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    private lookup = new Uint8Array(256);

    constructor(context) {
        this.context = context;
        for (let i = 0; i < this.chars.length; i++) {
            this.lookup[this.chars.charCodeAt(i)] = i;
        }
    }

    arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
        let bytes = new Uint8Array(arrayBuffer),
            i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i += 3) {
            base64 += this.chars[bytes[i] >> 2];
            base64 += this.chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
            base64 += this.chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
            base64 += this.chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
            base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
            base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
    }

    base64ToArrayBuffer(base64: string): ArrayBuffer {
        let bufferLength = base64.length * 0.75,
            len = base64.length, i, p = 0,
            encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
            bufferLength--;
            if (base64[base64.length - 2] === "=") {
                bufferLength--;
            }
        }

        let arraybuffer = new ArrayBuffer(bufferLength),
            bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i += 4) {
            encoded1 = this.lookup[base64.charCodeAt(i)];
            encoded2 = this.lookup[base64.charCodeAt(i + 1)];
            encoded3 = this.lookup[base64.charCodeAt(i + 2)];
            encoded4 = this.lookup[base64.charCodeAt(i + 3)];

            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
    }

    isClass(obj) {
        return typeof obj === 'function' && /^\s*class\s+/.test(obj.toString());
    }

    paths(obj, parentKey?) {
        var result;
        if (isArray(obj)) {
            var idx = 0;
            result = flatMap(obj, (obj) => {
                return this.paths(obj, (parentKey || '') + '[' + idx++ + ']');
            });
        }
        else if (isPlainObject(obj)) {
            result = flatMap(keys(obj), (key) => {
                return map(this.paths(obj[key], key), (subkey) => {
                    return (parentKey ? parentKey + '.' : '') + subkey;
                });
            });
        }
        else {
            result = [];
        }
        return concat(result, parentKey || []);
    }

    reportProgress(message, details) {
        (<any>this.context).postMessage({
            result: 'progress',
            message: message,
            details: details
        });
    }
}

class SandFiddleProcessor {
    private _context: any;
    private _request: any;

    constructor(context, request) {
        this._context = context;
        this._request = request;
    }

    public loadRequireJS(requireConfig) {
        // You're a wizard, Harry!
        if (this._request.requirejs) {
            (<any>this._context).eval(this._request.requirejs);
            if (requireConfig) {
                (<any>self).requirejs.config(requireConfig);
            }
            //Define the requirejs errorhandler.
            (<any>self).requirejs.onError = this.postMessageError;
        }

        //Now that we have require.js, register tslib.
        if (tslib) {
            (<any>this._context).eval(tslib);
        }

        //Also define SPLiberator module
        (<any>this._context).eval('define(\'sp-lookout\', [], function(require, exports, module) { return self.spLookoutInstance; });');
    }

    public loadDefines() {
        for (let id of Object.keys(this._request.defines)) {
            const define = this._request.defines[id];
            try {
                (<any>this._context).eval(define);
            } catch (ex) {
                this.postMessageError(ex);
                throw ex;
            }
        }
    }

    public async require(): Promise<void> {
        try {
            let requirePromise = new Promise((resolve, reject) => {
                try {
                    (<any>this._context).requirejs([this._request.entryPointId], resolve, err => {
                        if (err instanceof Error) {
                            reject(err);
                        } else {
                            reject(new Error(err));
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });

            let requireResult = await requirePromise;

            //So, to make it easier for the end user, and to avoid 'xxx could not be cloned' messages,
            //let's go through and invoke functions and resolve any promises that we encounter.

            const resultPaths = (<any>self).spLookoutInstance.paths(requireResult);
            for (const path of resultPaths) {
                const value = get(requireResult, path);
                if (typeof value === 'function') {
                    try {
                        if ((<any>self).spLookoutInstance.isClass(value)) {
                            set(requireResult, path, value.name);
                        } else {
                            set(requireResult, path, await Promise.resolve(value()));
                        }
                    } catch (ex) {
                        set(requireResult, path, ex);
                    }
                } else {
                    set(requireResult, path, await Promise.resolve(value));
                }
            }

            this._context.postMessage({
                result: 'success',
                data: requireResult
            });
        } catch (err) {
            this.postMessageError(err);
            throw err;
        }
    }

    /**
     * postMessage helper to facilitate posting errors back to the parent.
     * @param {*} postMessageId 
     * @param {*} err 
     */
    private async postMessageError(err: any): Promise<void> {
        let errorMessage: any = {
            result: 'error',
            message: err,
            type: Object.prototype.toString.call(err),
            context: 'worker'
        }

        if (typeof err === 'object') {
            errorMessage.name = err.name;
            errorMessage.message = err.message;
            errorMessage.stack = err.stack;
            for (let key in err) {
                if (err.hasOwnProperty(key)) {
                    errorMessage[key] = err[key];
                }
            }

            //Prevent Events and nested Errors from preventing cloning.
            if (errorMessage.originalError) {
                errorMessage.originalError = JSON.stringify(errorMessage.originalError);
            }
        }

        this._context.postMessage(errorMessage);
    }
}

/** Entry point */

//Monkeypatch Request to resolve issues when initializing via Request("");
const __nativeRequest = (<any>self).Request;

(<any>self).Request = (input, init) => {
    if (!input) {
        input = (<any>self).location.origin;
    }

    return new __nativeRequest(input, init);
}

//Define a SPLookout global
(<any>self).spLookoutInstance = new SPLookout(self);

onmessage = (e) => {

    const request = e.data;

    const processor = (<any>self).processor = new SandFiddleProcessor(self, request);
    processor.loadRequireJS(request.requireConfig);
    processor.loadDefines();
    processor.require();
}

onerror = (ev: any) => {
    let errorMessage: any = {
        result: 'error',
        message: ev
    }

    if (ev instanceof ErrorEvent) {
        errorMessage.data = {
            message: ev.message,
            filename: ev.filename,
            lineno: ev.lineno,
            colno: ev.colno
        }
    }
    (<any>self).postMessage(errorMessage);
}