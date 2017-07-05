class SandFiddleProcessor {
    private _context: DedicatedWorkerGlobalScope;
    private _request: any;

    constructor(context, request) {
        this._context = context;
        this._request = request;
    }

    public loadRequireJS() {
        // You're a wizard, Harry!
        if (this._request.requirejs) {
            (<any>this._context).eval(this._request.requirejs);
        }
    }

    public loadDefines() {
        for (let define of this._request.defines) {
            (<any>this._context).eval(define);
        }
    }

    public async require(): Promise<void> {
        try {
            let requirePromise = new Promise((resolve, reject) => {
                (<any>this._context).requirejs([this._request.entryPointId], result => resolve(result), err => reject(err));
            });

            let requireResult = await requirePromise;

            //Resolve any promises defined on exported properties of the module.
            for (let key in requireResult) {
                if (requireResult.hasOwnProperty(key)) {
                    requireResult[key] = await Promise.resolve(requireResult[key]);
                }
            }

            this._context.postMessage({
                result: "success",
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
    private async postMessageError(err: Error): Promise<void> {
        let errorMessage: any = {
            result: "error",
            message: err,
            type: Object.prototype.toString.call(err)
        }

        if (err instanceof Error) {
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

onmessage = (e) => {

    const request = e.data;

    (<any>self).document = {};

    const processor = (<any>self).processor = new SandFiddleProcessor(self, request);
    processor.loadRequireJS();
    (<any>self).requirejs.config(request.requireConfig);
    processor.loadDefines();
    processor.require();
}

onerror = (ev) => {
    let errorMessage: any = {
        result: "error",
        message: ev,
    }

    if (ev instanceof ErrorEvent) {
        errorMessage.data = {
            message: ev.message,
            filename: ev.filename,
            lineno: ev.lineno,
            colno: ev.colno
        }
    }
    postMessage(errorMessage);
}