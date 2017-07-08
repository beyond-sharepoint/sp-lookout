class HostWebProxy {
    private _hostWebProxyConfig: HostWebProxyConfig;
    private _currentErrorHandler = (err: ErrorEvent) => { };

    constructor(hostWebProxyConfig: HostWebProxyConfig) {
        this._hostWebProxyConfig = hostWebProxyConfig;

        this.errorHandler = this.errorHandler.bind(this);
        this.messageHandler = this.messageHandler.bind(this);

        //Define the requirejs errorhandler.
        (<any>self).requirejs.onError = this.postMessageError;
    }

    public errorHandler(event: ErrorEvent): void {
        this._currentErrorHandler(event);
    }

    public messageHandler(event: MessageEvent): void {
        const origin = event.origin || (<any>event).originalEvent.origin;
        const command = event.data.$$command;
        const postMessageId = event.data.$$postMessageId;

        if (!origin || !command || !postMessageId) {
            //Something strange occurred, ignore the message.
            return;
        }

        //Validate the requesting origin.
        if (this._hostWebProxyConfig.trustedOriginAuthorities && this._hostWebProxyConfig.trustedOriginAuthorities.length) {
            let trusted = false;
            for (let trustedOriginAuthority of this._hostWebProxyConfig.trustedOriginAuthorities) {
                if (RegExp(trustedOriginAuthority, "ig").test(origin)) {
                    trusted = true;
                    break;
                }
            }

            if (!!!trusted) {
                const message = `The specified origin is not trusted by the HostWebProxy: ${origin}`;
                let response: ErrorResponse = {
                    $$command: command,
                    $$postMessageId: postMessageId,
                    $$result: 'error',
                    message: message,
                    invalidOrigin: origin,
                    url: window.location.href
                };

                this.postMessage(response);
                throw Error(message);
            }
        }

        this.processCommand(command, postMessageId, event.data);
    }

    private processCommand(command: string, postMessageId: string, request: any) {
        switch (command) {
            case "Eval":
                this.eval(command, postMessageId, request.code);
                break;
            case "Fetch":
                this.fetch(command, postMessageId, request);
                break;
            case "InjectScript":
                this.injectScript(command, postMessageId, request);
                break;
            case "Ping":
                this.postMessage({
                    ...request,
                    $$result: 'success',
                    transferrableData: this.str2ab("Pong")
                });
                break;
            case "Require":
                this.require(command, postMessageId, request.id);
                break;
            case "Require.Config":
                this.requireConfig(command, postMessageId, request);
                break;
            case "Require.Undef":
                this.requireUndef(command, postMessageId, request.id);
                break;
            case "SandFiddle":
                this.sandFiddle(command, postMessageId, request);
                break;
            default:
                this.postMessage({
                    $$command: command,
                    $$postMessageId: postMessageId,
                    $$result: 'error',
                    message: `Unknown or unsupported command: ${command}`
                } as ErrorResponse);
                break;
        }
    }

    private str2ab(str: string) {
        let len = str.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Utility method to reject a promise if it does not settle within the specified timeout.
     * @param promise 
     * @param timeoutMillis 
     * @param errorMessage 
     */
    private timeout(promise: Promise<any>, timeoutMillis: number, errorMessage?: string): Promise<any> {
        var timeout;

        return Promise.race([
            promise,
            new Promise(function (resolve, reject) {
                timeout = setTimeout(function () {
                    reject(new Error(errorMessage || 'Timeout Error'));
                }, timeoutMillis);
            }),
        ]).then(function (v) {
            clearTimeout(timeout);
            return v;
        }, function (err) {
            clearTimeout(timeout);
            throw err;
        });
    };

    /**
    * Utility method to post messages back to the parent.
    */
    private postMessage(message: CommandResponse): void {
        const responseOrigin = this._hostWebProxyConfig.responseOrigin || '*';

        window.parent.postMessage(message, responseOrigin, message.transferrableData ? [message.transferrableData] : undefined);
    }

    /**
     * postMessage helper to facilitate posting errors back to the parent.
     * @param {*} postMessageId 
     * @param {*} err 
     */
    private postMessageError(command: string, postMessageId: string, err: any): void {
        let errorMessage: ErrorResponse = {
            $$command: command,
            $$postMessageId: postMessageId,
            $$result: 'error',
            message: err,
            type: Object.prototype.toString.call(err),
            context: 'proxy'
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
        this.postMessage(errorMessage);
    }

    private postProgress(command: string, postMessageId: string, data: any) {
        let progressMessage: ProgressResponse = {
            $$command: command,
            $$postMessageId: postMessageId,
            $$result: 'progress',
            data: data
        }

        this.postMessage(progressMessage);
    }

    private async eval(command: string, postMessageId: string, code: string): Promise<void> {
        try {
            let evalPromise = new Promise((resolve, reject) => {
                let evalResult = eval(code).bind({ postProgress: this.postProgress });
                resolve(evalResult);
            });

            let evalResult = await evalPromise;
            this.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: evalResult,
                transferrableData: (<any>evalResult).transferrableData
            });
        } catch (err) {
            this.postMessageError(command, postMessageId, err);
            throw err;
        }
    }

    private async fetch(command: string, postMessageId: string, request: any): Promise<void> {
        let fetchRequestInit: RequestInit = {
            cache: request.cache,
            credentials: request.credentials,
            method: request.method,
            mode: 'same-origin',
        };

        //IE/Edge fails when the header object is not explictly
        //a headers object.
        if (request.headers) {
            fetchRequestInit.headers = new Headers();
            for (let property of Object.keys(request.headers)) {
                fetchRequestInit.headers.append(property, request.headers[property]);
            }
        }

        //IE/Edge fails with a TypeMismatchError when GET 
        //requests have any body, including null.
        if (request.method.toUpperCase() !== 'GET') {
            fetchRequestInit.body = request.body;
            (<any>fetchRequestInit).bodyUsed = true;
        }

        //Actually perform the fetch
        try {
            const response = await fetch(request.url, fetchRequestInit);
            const headers = {};
            if (typeof response.headers.forEach === 'function') {
                (<any>response.headers).forEach((value, key, object) => {
                    headers[key] = value;
                });
            }

            let messageResponse: FetchResponse = {
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                headers: headers,
                data: undefined,
                transferrableData: await response.arrayBuffer()
            }

            //Add additional properties -- IE/Edge do not support 'keys', 'entries', 'values', nor '..of' so whitelist the properties.
            for (let propertyKey of ["ok", "redirected", "status", "statusText", "type", "url"]) {
                (<any>messageResponse)[propertyKey] = response[propertyKey];
            }

            this.postMessage(messageResponse);
        }
        catch (err) {
            this.postMessageError(command, postMessageId, err);
        }
    }

    private injectScript(command: string, postMessageId: string, request: any) {
        let script = document.createElement('script');
        for (let key of ['id', 'type', 'src', 'charset', 'async', 'defer', 'text']) {
            if (typeof request[key] !== 'undefined') {
                script[key] = request[key];
            }
        }

        let clearScriptElement = (el: HTMLScriptElement) => {
            el.onload = (ev) => { };
            el.onerror = (ev) => { };
            (<any>el).onreadystatechange = null;
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
            this._currentErrorHandler = (err: ErrorEvent) => { };
        };

        let success = () => {
            clearScriptElement(script);
            this.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: request.src
            });
        };

        let failure = (ev: ErrorEvent) => {
            clearScriptElement(script);
            this.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'error',
                data: {
                    src: request.src,
                    message: ev.message,
                    filename: ev.filename,
                    lineno: ev.lineno,
                    colno: ev.colno
                }
            });
        };

        script.onerror = failure;

        //Inline scripts don't raise these events.
        if (script.src) {
            script.onload = success;

            //IE
            (<any>script).onreadystatechange = function () {
                let state = (<any>script).readyState;
                if (state === 'loaded' || state === 'complete') {
                    success();
                }
            }
        }

        this._currentErrorHandler = failure;
        document.body.appendChild(script);

        if (!script.src) {
            clearScriptElement(script);
            this.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success'
            });
        }
    }

    private async require(command: string, postMessageId: string, moduleId: string): Promise<void> {
        try {
            let requirePromise = new Promise((resolve, reject) => {
                try {
                    (<any>window).requirejs([moduleId], resolve, err => {
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

            this.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: requireResult
            });
        } catch (err) {
            this.postMessageError(command, postMessageId, err);
        }
    }

    private requireConfig(command: string, postMessageId: string, request: any) {
        if (request.config) {
            (<any>window).requirejs.config(request.config);
        } else if (request.bustCache) {
            (<any>window).requirejs.config({ urlArgs: 'v=' + (new Date()).getTime() });
        }
        this.postMessage({
            $$command: command,
            $$postMessageId: postMessageId,
            $$result: 'success'
        });
    }

    private requireUndef(command: string, postMessageId: string, id: string) {
        (<any>window).requirejs.undef(id);
        this.postMessage({
            $$command: command,
            $$postMessageId: postMessageId,
            $$result: 'success'
        });
    }

    private async sandFiddle(command: string, postMessageId: string, request: any): Promise<void> {
        const HostWebWorker = require('worker-loader?inline&name=HostWebWorker.js!./HostWebWorker.ts');
        let worker: Worker = new HostWebWorker();
        try {
            const requireScriptElement = document.getElementById('require.js');
            if (!requireScriptElement) {
                throw Error('Unable to find Require.js script element. This is highly unusual and it probably means someone edited the HostWebProxy.aspx or a hole has been torn in the fabric of the universe. That, or something just went wrong.');
            }
            request.requirejs = requireScriptElement.innerText;
            worker.postMessage(request, request.data ? [request.data] : undefined);
            let resolveWorker, rejectWorker;
            let workerPromise: Promise<any> = new Promise((resolve, reject) => {
                resolveWorker = resolve;
                rejectWorker = reject;
            });

            worker.onmessage = (ev) => {
                const eventData = ev.data;
                switch (eventData.result) {
                    case 'success':
                        resolveWorker(eventData);
                        break;
                    case 'progress':
                        this.postProgress(command, postMessageId, eventData);
                        break;
                    case 'error':
                    default:
                        const err = new Error(eventData.message);
                        err.name = eventData.name;
                        err.stack = eventData.stack;
                        (<any>err).originalErrorMessage = eventData;
                        rejectWorker(err);
                        break;
                }
            }

            let timeout = 5000;
            if (typeof request.timeout === 'number') {
                timeout = request.timeout;
            }

            let result: any;
            if (timeout) {
                result = await this.timeout(workerPromise, timeout, `A timeout occurred while invoking the SandFiddle. (${timeout}ms)`);
            } else {
                result = await workerPromise;
            }

            let sandFiddleMessage: CommandResponse = {
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: result.data,
                transferrableData: result.transferrableData
            }

            this.postMessage(sandFiddleMessage);
        }
        catch (ex) {
            this.postMessageError(command, postMessageId, ex);
        }
        finally {
            if (worker) {
                worker.onmessage = (ev) => { };
                worker.terminate();
            }
        }
    }
}

interface CommandRequest {
    $$postMessageId: string;
    $$command: string;
}

interface CommandResponse {
    $$postMessageId: string;
    $$command: string;
    $$result: 'success' | 'error' | 'progress';
    data?: any;
    transferrableData?: ArrayBuffer;
}

interface FetchResponse extends CommandResponse {
    headers: { [key: string]: any };
    data: undefined;
    transferrableData: ArrayBuffer;
}

interface ErrorResponse extends CommandResponse {
    $$result: 'error';
    name?: string;
    message?: string;
    type?: string;
    stack?: string;
    originalError?: string;
    invalidOrigin?: string;
    url?: string;
    context?: string;
}

interface ProgressResponse extends CommandResponse {
    $$result: 'progress';
}

interface HostWebProxyConfig {
    responseOrigin: string;
    trustedOriginAuthorities: Array<any>;
}

//When the document is ready, bind to the 'message' event to recieve messages passed
//from the parent window via window.postMessage
(<any>window).docReady(() => {
    const hostWebProxyController = new HostWebProxy((<any>window).hostWebProxyConfig);

    window.addEventListener('error', hostWebProxyController.errorHandler);
    window.addEventListener('message', hostWebProxyController.messageHandler);
});