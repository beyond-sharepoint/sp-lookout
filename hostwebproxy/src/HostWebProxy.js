import './docReady.js'
import Promise from 'promise-polyfill';

// To add to window
if (!window.Promise) {
    window.Promise = Promise;
}

//When the document is ready, bind to the 'message' event to recieve messages passed
//from the parent window via window.postMessage
docReady(() => {
	/**
	 * Utility method to post messages back to the parent.
	 */
    let postMessage = async (message, response) => {
        let responseOrigin = window.hostWebProxyConfig.responseOrigin || "*";

        //If a response object is specified, get the properties
        if (message.result !== "error" && response) {
            //IE/Edge do not support 'keys', 'entries', 'values', nor '..of' so whitelist the properties.
            for (let propertyKey of ["ok", "redirected", "status", "statusText", "type", "url"]) {
                message[propertyKey] = response[propertyKey];
            }

            message.headers = {};

            if (typeof response.headers.forEach === "function") {
                response.headers.forEach((value, key, object) => {
                    message.headers[key] = value;
                });
            }

            message.data = await response.arrayBuffer();
        }

        window.parent.postMessage(message, responseOrigin, message.data ? [message.data] : undefined);
    };

    /**
     * postMessage helper to facilitate posting errors back to the parent.
     * @param {*} postMessageId 
     * @param {*} err 
     */
    let postErrorMessage = async (postMessageId, err) => {
        let errorMessage = {
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

        return postMessage(errorMessage);
    };

    let currentErrorHandler = () => { };
    window.addEventListener('error', function (message) {
        currentErrorHandler(message);
    });

    let clearScriptElement = function (el) {
        el.onload = null;
        el.onerror = null;
        el.onreadystatechange = null;
        el.parentNode.removeChild(el);
        currentErrorHandler = () => { };
    };

    window.addEventListener("message", async (event, origin) => {
        origin = event.origin || event.originalEvent.origin;
        let request = event.data;
        let command = request["$$command"] || request["command"];
        let postMessageId = request["$$postMessageId"] || request["postMessageId"];

        //Validate the requesting origin.
        if (window.hostWebProxyConfig.trustedOriginAuthorities && window.hostWebProxyConfig.trustedOriginAuthorities.length) {
            let trusted = false;
            for (let i = 0; i < window.hostWebProxyConfig.trustedOriginAuthorities.length; i++) {
                let trustedOriginAuthority = window.hostWebProxyConfig.trustedOriginAuthorities[i];
                if (RegExp(trustedOriginAuthority, "ig").test(origin)) {
                    trusted = true;
                    break;
                }
            }

            if (!!!trusted) {
                let message = `The specified origin is not trusted by the HostWebProxy: ${origin}`;
                postMessage({
                    "$$postMessageId": postMessageId,
                    postMessageId: postMessageId,
                    result: "error",
                    message: message,
                    invalidOrigin: origin,
                    url: window.location.href
                });
                throw Error(message);
            }
        }

        if (!event.data) {
            postMessage({
                "$$postMessageId": postMessageId,
                postMessageId: postMessageId,
                result: "error",
                message: `The specified command did not contain any data: ${command}`
            });
            return;
        }

        switch (command) {
            case "InjectScript":

                let script = document.createElement('script');
                for (let key of ['id', 'type', 'src', 'charset', 'async', 'defer', 'text']) {
                    if (typeof request[key] !== 'undefined') {
                        script[key] = request[key];
                    }
                }

                script.onerror = (ev) => {
                    clearScriptElement(script);
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "error",
                        src: request.src,
                        message: ev.message,
                        filename: ev.filename,
                        lineno: ev.lineno,
                        colno: ev.colno
                    });
                };

                //Inline scripts don't raise these events.
                if (script.src) {
                    script.onload = () => {
                        clearScriptElement(script);
                        postMessage({
                            "$$postMessageId": postMessageId,
                            postMessageId: postMessageId,
                            result: "success",
                            src: request.src
                        });
                    };

                    script.onreadystatechange = function () {
                        let state = script.readyState;
                        if (state === 'loaded' || state === 'complete') {
                            script.onload();
                        }
                    }
                }

                currentErrorHandler = script.onerror;
                document.body.appendChild(script);

                if (!script.src) {
                    clearScriptElement(script);
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "success"
                    });
                }
                break;
            case "Require":
                if (request.config) {
                    requirejs.config(request.config);
                } else if (request.bustCache) {
                    requirejs.config({ urlArgs: 'v=' + (new Date()).getTime() });
                }

                try {
                    let requirePromise = new Promise((resolve, reject) => {
                        requirejs([request.id], result => resolve(result), err => reject(err));
                    });

                    let requireResult = await requirePromise;

                    //Resolve any promises defined on exported properties of the module.
                    for (let key in requireResult) {
                        if (requireResult.hasOwnProperty(key)) {
                            requireResult[key] = await Promise.resolve(requireResult[key]);
                        }
                    }

                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "success",
                        requireResult
                    });
                } catch (err) {
                    return postErrorMessage(postMessageId, err);
                }
                break;
            case "Require.Undef":
                requirejs.undef(request.id);
                break;
            case "Eval":
                try {
                    let evalPromise = new Promise((resolve, reject) => {
                        let evalResult = eval(request.code);
                        resolve(evalResult);
                    });

                    let evalResult = await evalPromise;
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "success",
                        evalResult
                    });
                } catch (err) {
                    postErrorMessage(postMessageId, err);
                    throw err;
                }
                break;
            case "Fetch":

                let fetchRequestInit = {
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
                    fetchRequestInit.bodyUsed = true;
                }

                //Actually perform the fetch
                try {
                    let response = await fetch(request.url, fetchRequestInit);
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "success"
                    }, response);
                }
                catch (err) {
                    postErrorMessage(postMessageId, err);
                }
                break;
            case "Ping":
                postMessage(request);
                break;
            default:
                postMessage({
                    "$$command": command,
                    command: command,
                    "$$postMessageId": postMessageId,
                    postMessageId: postMessageId,
                    result: "error",
                    message: `Unknown or unsupported command: ${command}`
                });
                break;
        }
    });
});