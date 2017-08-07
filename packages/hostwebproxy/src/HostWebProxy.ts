import 'promise/polyfill';
import 'whatwg-fetch';
const HostWebWorker = require('worker-loader?inline&name=HostWebWorker.js!./HostWebWorker.ts');

class ProxyUtil {
    /**
     * Gets the current hostWebProxyConfig global.
     */
    static get hostWebProxyConfig(): any {
        return (<any>window).hostWebProxyConfig;
    }

    /**
     * Utility method to reject a promise if it does not settle within the specified timeout.
     * @param promise 
     * @param timeoutMillis 
     * @param errorMessage 
     */
    public static timeout(promise: Promise<any>, timeoutMillis: number, errorMessage?: string): Promise<any> {
        let timeout;

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
    public static postMessage(message: CommandResponse): void {
        const responseOrigin = this.hostWebProxyConfig.responseOrigin || '*';

        window.parent.postMessage(message, responseOrigin, message.transferrableData ? [message.transferrableData] : undefined);
    }

    /**
     * postMessage helper to facilitate posting errors back to the parent.
     * @param {*} postMessageId 
     * @param {*} err 
     */
    public static postMessageError(command: string, postMessageId: string, err: any): void {
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

    /**
     * Posts a progress message to the parent window.
     * @param command 
     * @param postMessageId 
     * @param data 
     */
    public static postProgress(command: string, postMessageId: string, data: any) {
        let progressMessage: ProgressResponse = {
            $$command: command,
            $$postMessageId: postMessageId,
            $$result: 'progress',
            data: data
        }

        this.postMessage(progressMessage);
    }
}

class HostWebProxy {
    private currentErrorHandler = (err: ErrorEvent) => { };
    private commandMap: {
        [command: string]: (
            this: HostWebProxy,
            command: string,
            postMessageId: string,
            request: any
        ) => void;
    } = {
        'Brew': (command, postMessageId, request) => {
            this.brew(command, postMessageId, request);
        },
        'Fetch': (command, postMessageId, request) => {
            this.fetch(command, postMessageId, request);
        },
        'Ping': (command, postMessageId, request) => {
            ProxyUtil.postMessage({
                ...request,
                $$result: 'success',
                data: 'Pong'
            });
        },
        'Eval': (command, postMessageId, request) => {
            try {
                const geval = eval;
                geval(request.code);
            } catch (ex) {
                ProxyUtil.postMessageError(command, postMessageId, ex);
            }
            ProxyUtil.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success'
            });
        },
        'SetCommand': (command, postMessageId, request) => {
            try {
                this.commandMap[request.commandName] = eval(request.commandCode);
            } catch (ex) {
                ProxyUtil.postMessageError(command, postMessageId, ex);
            }
            ProxyUtil.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: request.commandName
            });
        },
        'SetWorkerCommand': (command, postMessageId, request) => {
            try {
                this.workerCommandMap[request.commandName] = eval(request.commandCode);
            } catch (ex) {
                ProxyUtil.postMessageError(command, postMessageId, ex);
            }
            ProxyUtil.postMessage({
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: request.commandName
            });
        }
    };
    private workerCommandMap: {
        [command: string]: (
            this: Worker,
            resolveWorker: (value?: any) => void,
            rejectWorker: (reason?: any) => void,
            eventData: any,
            args: {
                command: string,
                postMessageId: string,
                worker: any,
                workerCommand: string
            }
        ) => void
    } = {
        'success': (resolveWorker, rejectWorker, eventData) => {
            resolveWorker(eventData);
        },
        'progress': (resolveWorker, rejectWorker, eventData, args) => {
            ProxyUtil.postProgress(args.command, args.postMessageId, eventData);
        },
        'error': (resolveWorker, rejectWorker, eventData) => {
            const err = new Error(eventData.message);
            err.name = eventData.name;
            err.stack = eventData.stack;
            (<any>err).originalErrorMessage = eventData;
            rejectWorker(err);
        }
    };

    constructor() {
        this.errorHandler = this.errorHandler.bind(this);
        this.messageHandler = this.messageHandler.bind(this);
    }

    public errorHandler(event: ErrorEvent): void {
        this.currentErrorHandler(event);
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
        if (ProxyUtil.hostWebProxyConfig.trustedOriginAuthorities && ProxyUtil.hostWebProxyConfig.trustedOriginAuthorities.length) {
            let trusted = false;
            for (let trustedOriginAuthority of ProxyUtil.hostWebProxyConfig.trustedOriginAuthorities) {
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

                ProxyUtil.postMessage(response);
                throw Error(message);
            }
        }

        this.processCommand(command, postMessageId, event.data);
    }

    /**
     * Processes the command according to the current state of the commandMap
     * @param command command to process
     * @param postMessageId Id of the request
     * @param request data of the request
     */
    private processCommand(command: string, postMessageId: string, request: any) {
        if (this.commandMap[command]) {
            try {
                this.commandMap[command].call(this, command, postMessageId, request);
            } catch (ex) {
                ProxyUtil.postMessageError(command, postMessageId, ex);
            } finally {
                return;
            }
        }

        ProxyUtil.postMessage({
            $$command: command,
            $$postMessageId: postMessageId,
            $$result: 'error',
            message: `Unknown or unsupported command: ${command}`
        } as ErrorResponse);
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

            ProxyUtil.postMessage(messageResponse);
        }
        catch (err) {
            ProxyUtil.postMessageError(command, postMessageId, err);
        }
    }

    private async brew(command: string, postMessageId: string, request: BrewRequest): Promise<void> {
        let worker: Worker = new HostWebWorker();
        try {
            if (!request.bootstrap) {
                throw Error('A bootstrap script was not defined on the brew request.');
            }
            worker.postMessage(request, request.data ? [request.data] : undefined);
            let resolveWorker, rejectWorker;
            let workerPromise: Promise<any> = new Promise((resolve, reject) => {
                resolveWorker = resolve;
                rejectWorker = reject;
            });

            worker.onmessage = (ev) => {
                const workerCommand = ev.data.result;
                const eventData = ev.data;
                if (this.workerCommandMap[workerCommand]) {
                    try {
                        const args = {
                            command,
                            postMessageId,
                            worker,
                            workerCommand
                        };

                        this.workerCommandMap[workerCommand].call(
                            worker,
                            resolveWorker,
                            rejectWorker,
                            eventData,
                            args
                        );
                    } catch (ex) {
                        rejectWorker(ex);
                    }
                } else {
                    const err = new Error(`Unknown or unsupported worker command: ${workerCommand}`);
                    rejectWorker(err);
                }
            }

            let timeout = 5000;
            if (typeof request.timeout === 'number') {
                timeout = request.timeout;
            }

            let result: any;
            if (timeout) {
                result = await ProxyUtil.timeout(workerPromise, timeout, `A timeout occurred while invoking the Brew. (${timeout}ms)`);
            } else {
                result = await workerPromise;
            }

            let brewResponse: CommandResponse = {
                $$command: command,
                $$postMessageId: postMessageId,
                $$result: 'success',
                data: result.data,
                transferrableData: result.transferrableData
            }
            ProxyUtil.postMessage(brewResponse);
        }
        catch (err) {
            ProxyUtil.postMessageError(command, postMessageId, err);
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

interface BrewRequest extends CommandRequest {
    $$command: 'brew';
    bootstrap: Array<string>;
    entryPointId: string;
    timeout: number;
    data: any;
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
    const hostWebProxyController = new HostWebProxy();

    window.addEventListener('error', hostWebProxyController.errorHandler);
    window.addEventListener('message', hostWebProxyController.messageHandler);
});