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

                let failure = function (message) {
                    clear();
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "error",
                        src: request.src,
                        message: message
                    });
                }

                currentErrorHandler = failure;

                script.onerror = failure;
                script.onload = success;
                script.onreadystatechange = function () {
                    var state = script.readyState;
                    if (state === 'loaded' || state === 'complete') {
                        success();
                    }
                }

                parentNode.appendChild(script);
                importedScripts[request.src] = script;
                break;
            case "Eval":
                let evalResult;
                try {
                    evalResult = eval(request.code);
                } catch (err) {
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "error",
                        src: request.src,
                        error: err,
                        message: err.message,
                        name: err.name
                    });
                    throw err;
                }

                postMessage({
                    "$$postMessageId": postMessageId,
                    postMessageId: postMessageId,
                    result: "success",
                    evalResult,
                });
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
                    postMessage({
                        "$$postMessageId": postMessageId,
                        postMessageId: postMessageId,
                        result: "error",
                        error: err,
                        message: err.message,
                        name: err.name
                    });
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
                    errorMessage: `Unknown or unsupported command: ${command}`
                });
                break;
        }
    });
});