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

            //Resolve any promises defined on exported properties of the module.
            for (let key in requireResult) {
                if (requireResult.hasOwnProperty(key)) {
                    requireResult[key] = await Promise.resolve(requireResult[key]);
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