const set = require('lodash/set.js');

class WorkerUtil {
    static flatten(target: object) {
        const delimiter = '.';
        const output = {};

        const step = (object: object, prev?: string) => {
            for (const key of Object.keys(object)) {
                const value = object[key];
                const isArray = Array.isArray(value);
                const type = Object.prototype.toString.call(value);
                const isBuffer = value instanceof ArrayBuffer;
                const isObject = (
                    type === '[object Object]' ||
                    type === '[object Array]'
                );

                const newKey = prev
                    ? prev + delimiter + key
                    : key;

                if (!isArray && !isBuffer && isObject && Object.keys(value).length) {
                    return step(value, newKey);
                }

                output[newKey] = value;
            }
        };

        step(target);
        return output;
    }
}

class SandFiddleProcessor {
    private context: any;
    private request: any;

    constructor(context, request) {
        this.context = context;
        this.request = request;

        this.bootstrap.bind(this);
        this.initialize = this.initialize.bind(this);
        this.postMessageError = this.postMessageError.bind(this);
    }

    public bootstrap() {
        // You're a wizard, Harry!
        if (!this.request.bootstrap) {
            return;
        }

        for (const bootstrapScript of this.request.bootstrap) {
            (<any>this.context).request = this.request;
            try {
                const geval = eval;
                geval(bootstrapScript);
            } catch (ex) {
                this.postMessageError(ex);
                throw (ex);
            } finally {
                delete (<any>this.context).request;
            }
        }
    }

    public async initialize(): Promise<void> {
        try {
            let requirePromise = new Promise((resolve, reject) => {
                try {
                    (<any>this.context).requirejs([this.request.entryPointId], resolve, err => {
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
            const resultPaths = WorkerUtil.flatten(requireResult);
            for (const path of Object.keys(resultPaths)) {
                const value = resultPaths[path];
                if (typeof value === 'function') {
                    try {
                        if ((<any>self).spLookoutInstance.isClass(value)) {
                            set(requireResult, path, value.name);
                        } else {
                            set(requireResult, path, 'function');
                        }
                    } catch (ex) {
                        set(requireResult, path, ex);
                    }
                } else {
                    set(requireResult, path, await Promise.resolve(value));
                }
            }

            this.context.postMessage({
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

        this.context.postMessage(errorMessage);
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

onmessage = (e) => {

    const request = e.data;

    const processor = (<any>self).processor = new SandFiddleProcessor(self, request);
    processor.bootstrap();
    processor.initialize();
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