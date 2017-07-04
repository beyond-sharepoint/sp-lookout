class HostWebProxy {
    private _hostWebProxyConfig: HostWebProxyConfig;
    private _currentErrorHandler = (err: ErrorEvent) => { };

    constructor(hostWebProxyConfig: HostWebProxyConfig) {
        this._hostWebProxyConfig = hostWebProxyConfig;
        
        this.errorHandler = this.errorHandler.bind(this);
        this.messageHandler = this.messageHandler.bind(this);
    }

    public errorHandler(event: ErrorEvent): void {
        this._currentErrorHandler(event);
    }

    public messageHandler(event: MessageEvent): void {
        let origin = event.origin || (<any>event).originalEvent.origin;
        let request = event.data;
        let command = request["$$command"] || request["command"];
        let postMessageId = request["$$postMessageId"] || request["postMessageId"];

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
                let message = `The specified origin is not trusted by the HostWebProxy: ${origin}`;
                this.postMessage({
                    "$$command": command,
                    command: command,
                    "$$postMessageId": postMessageId,
                    postMessageId: postMessageId,
                    result: "error",
                    message: message,
                    invalidOrigin: origin,
                    url: window.location.href
                } as ErrorCommandResponse);
                throw Error(message);
            }
        }

        switch (command) {
            case "InjectScript":
                this.injectScript(command, postMessageId, request);
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
            case "Eval":
                this.eval(command, postMessageId, request.code);
                break;
            case "Fetch":
                this.fetch(command, postMessageId, request);
                break;
            case "Ping":
                this.postMessage(request);
                break;
            default:
                this.postMessage({
                    "$$command": command,
                    command: command,
                    "$$postMessageId": postMessageId,
                    postMessageId: postMessageId,
                    result: "error",
                    message: `Unknown or unsupported command: ${command}`
                } as ErrorCommandResponse);
                break;
        }
    }

    /**
    * Utility method to post messages back to the parent.
    */
    private async postMessage(message: CommandResponse, response?: Response): Promise<void> {
        let responseOrigin = this._hostWebProxyConfig.responseOrigin || "*";

        //If a response object is specified, get the properties
        if (message.result !== "error" && response) {
            //IE/Edge do not support 'keys', 'entries', 'values', nor '..of' so whitelist the properties.
            for (let propertyKey of ["ok", "redirected", "status", "statusText", "type", "url"]) {
                message[propertyKey] = response[propertyKey];
            }

            message.headers = {};
            if (typeof response.headers.forEach === "function") {
                (<any>response.headers).forEach((value, key, object) => {
                    if (message.headers) {
                        message.headers[key] = value;
                    }
                });
            }

            message.data = await response.arrayBuffer();
        }

        window.parent.postMessage(message, responseOrigin, message.data ? [message.data] : undefined);
    }

    /**
     * postMessage helper to facilitate posting errors back to the parent.
     * @param {*} postMessageId 
     * @param {*} err 
     */
    private async postMessageError(command: string, postMessageId: string, err: any): Promise<void> {
        let errorMessage: ErrorCommandResponse = {
            "$$command": command,
            command: command,
            "$$postMessageId": postMessageId,
            postMessageId: postMessageId,
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

        return this.postMessage(errorMessage);
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
                command: command,
                $$postMessageId: postMessageId,
                postMessageId: postMessageId,
                result: "success",
                resultData: request.src
            });
        };

        let failure = (ev: ErrorEvent) => {
            clearScriptElement(script);
            this.postMessage({
                $$command: command,
                command: command,
                $$postMessageId: postMessageId,
                postMessageId: postMessageId,
                result: "error",
                resultData: {
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
                command: command,
                $$postMessageId: postMessageId,
                postMessageId: postMessageId,
                result: "success"
            });
        }
    }

    private async require(command: string, postMessageId: string, moduleId: string) {
        try {
            let requirePromise = new Promise((resolve, reject) => {
                (<any>window).requirejs([moduleId], result => resolve(result), err => reject(err));
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
                command: command,
                $$postMessageId: postMessageId,
                postMessageId: postMessageId,
                result: "success",
                resultData: requireResult
            });
        } catch (err) {
            return this.postMessageError(command, postMessageId, err);
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
            command: command,
            $$postMessageId: postMessageId,
            postMessageId: postMessageId,
            result: "success"
        });
    }

    private requireUndef(command: string, postMessageId: string, id: string) {
        (<any>window).requirejs.undef(id);
        this.postMessage({
            $$command: command,
            command: command,
            $$postMessageId: postMessageId,
            postMessageId: postMessageId,
            result: "success"
        });
    }

    private async eval(command: string, postMessageId: string, code: string) {
        try {
            let evalPromise = new Promise((resolve, reject) => {
                let evalResult = eval(code);
                resolve(evalResult);
            });

            let evalResult = await evalPromise;
            this.postMessage({
                $$command: command,
                command: command,
                $$postMessageId: postMessageId,
                postMessageId: postMessageId,
                result: "success",
                resultData: evalResult
            });
        } catch (err) {
            this.postMessageError(command, postMessageId, err);
            throw err;
        }
    }

    private async fetch(command: string, postMessageId: string, request: any) {
        let fetchRequestInit: RequestInit = {
            cache: request.cache,
            credentials: request.credentials,
            method: request.method,
            mode: "same-origin",
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
        if (request.method.toUpperCase() !== "GET") {
            fetchRequestInit.body = request.body;
            (<any>fetchRequestInit).bodyUsed = true;
        }

        //Actually perform the fetch
        try {
            let response = await fetch(request.url, fetchRequestInit);
            this.postMessage({
                $$command: command,
                command: command,
                $$postMessageId: postMessageId,
                postMessageId: postMessageId,
                result: "success"
            }, response);
        }
        catch (err) {
            this.postMessageError(command, postMessageId, err);
        }
    }
}

interface CommandResponse {
    result: "success" | "error";
    $$postMessageId: string;
    $$command: string;
    command: string;
    postMessageId: string;
    resultData?: any;
    headers?: { [key: string]: any }
    data?: ArrayBuffer;
}

interface ErrorCommandResponse extends CommandResponse {
    result: "error";
    name?: string;
    message?: string;
    type?: string;
    stack?: string;
    originalError?: string;
}

interface HostWebProxyConfig {
    responseOrigin: string;
    trustedOriginAuthorities: Array<any>
}

//When the document is ready, bind to the 'message' event to recieve messages passed
//from the parent window via window.postMessage
(<any>window).docReady(() => {
    const hostWebProxyController = new HostWebProxy((<any>window).hostWebProxyConfig);

    window.addEventListener('error', hostWebProxyController.errorHandler);
    window.addEventListener("message", hostWebProxyController.messageHandler);
});