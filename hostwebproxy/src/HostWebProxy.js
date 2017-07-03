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
        }

        return postMessage(errorMessage);
    };

    let currentErrorHandler = () => { };
    window.addEventListener('error', function (message) {
        currentErrorHandler(message);
    });

    let importedScripts = {};

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
            case "ImportScript":

                //If no src is specified, pass back an error and get outta dodge.
                if (!request.src) {
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "error",
                        message: "Script Source must be specified."
                    });
                    return;
                }

                //If we've already imported a script with the same url, pass success and get outta dodge.
                if (importedScripts[request.src]) {
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "success",
                        src: request.src
                    });
                    return;
                }

                let script = document.createElement('script');
                script.src = request.src;

                let clear = function () {
                    script.onload = null;
                    script.onerror = null;
                    script.onreadystatechange = null;
                    script.parentNode.removeChild(script);
                    currentErrorHandler = () => { };
                }

                let success = function () {
                    clear();
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "success",
                        src: request.src
                    });
                }

                let failure = function (ev) {
                    clear();
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
                }

                currentErrorHandler = failure;

                script.onerror = failure;
                script.onload = success;
                script.onreadystatechange = function () {
                    let state = script.readyState;
                    if (state === 'loaded' || state === 'complete') {
                        success();
                    }
                }

                document.body.appendChild(script);
                importedScripts[request.src] = script;
                break;
            case "Require":
                const requirejs = window.require;
                requirejs.config({ urlArgs: 'v=' + (new Date()).getTime() });
                requirejs.undef("splookout-fiddle");
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