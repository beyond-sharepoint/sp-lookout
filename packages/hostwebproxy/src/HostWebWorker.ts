class BaristaWorker {
    private context: DedicatedWorkerGlobalScope;
    private request: any;

    constructor(context: DedicatedWorkerGlobalScope, request: any) {
        this.context = context;
        this.request = request;

        this.bootstrap.bind(this);
        this.startup = this.startup.bind(this);
        this.brew = this.brew.bind(this);
        this.processResult = this.processResult.bind(this);
        this.postMessageError = this.postMessageError.bind(this);
    }

    public brew(): Promise<{}> {
        const evalPromise = new Promise((resolve, reject) => {
            try {
                const geval = eval;
                resolve(geval(this.request.code));
            }
            catch (err) {
                reject(err);
            }
        });

        return evalPromise;
    }

    public processResult(result: {}): Promise<{}> {
        return Promise.resolve(result);
    }

    private bootstrap() {
        // You're a wizard, Harry!
        if (!this.request.bootstrap || !Array.isArray(this.request.bootstrap)) {
            return;
        }

        for (const bootstrapScript of this.request.bootstrap) {
            try {
                const geval = eval;
                geval(bootstrapScript);
            } catch (err) {
                this.postMessageError(err);
                throw err;
            }
        }
    }

    private async startup(): Promise<void> {
        try {
            let requireResult = await this.brew();
            requireResult = await this.processResult(requireResult);
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
            for (const key of Object.keys(err)) {
                errorMessage[key] = err[key];
            }

            //Prevent Events and nested Errors from preventing cloning.
            if (errorMessage.originalError) {
                errorMessage.originalError = JSON.stringify(errorMessage.originalError);
            }
        }

        this.context.postMessage(errorMessage);
    }

    public static initialize() {
        //Monkeypatch Request to resolve issues when initializing via Request("");
        const __nativeRequest = (<any>self).Request;

        (<any>self).Request = (input, init) => {
            if (!input) {
                input = (<any>self).location.origin;
            }

            return new __nativeRequest(input, init);
        }

        self.onmessage = (e) => {
            const request = e.data;

            const processor = (<any>self).processor = new BaristaWorker(self as any, request);
            processor.bootstrap();
            processor.startup();
        }

        self.onerror = (ev: any) => {
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
    }
}

/** Entry point */
BaristaWorker.initialize();