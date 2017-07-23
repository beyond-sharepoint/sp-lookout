import * as tslib from 'tslib/tslib.js';

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
            case "Fetch":
                this.fetch(command, postMessageId, request);
                break;
            case "Ping":
                this.postMessage({
                    ...request,
                    $$result: 'success',
                    transferrableData: this.str2ab("Pong")
                });
                break;
            case "Brew":
                this.brew(command, postMessageId, request);
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

    private async brew(command: string, postMessageId: string, request: any): Promise<void> {
        const HostWebWorker = require('worker-loader?inline&name=HostWebWorker.js!./HostWebWorker.ts');
        let worker: Worker = new HostWebWorker();
        try {
            const requireScriptElement = document.getElementById('require.js');
            if (!requireScriptElement) {
                throw Error('Unable to find Require.js script element. This is highly unusual and it probably means someone edited the HostWebProxy.aspx or a hole has been torn in the fabric of the universe. That, or something just went wrong.');
            }
            request.requirejs = requireScriptElement.innerText;
            request.tslib = tslib;
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
                result = await this.timeout(workerPromise, timeout, `A timeout occurred while invoking the Brew. (${timeout}ms)`);
            } else {
                result = await workerPromise;
            }

            let brewMessage: CommandResponse = {
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: result.data,
                transferrableData: result.transferrableData
            }

            this.postMessage(brewMessage);
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