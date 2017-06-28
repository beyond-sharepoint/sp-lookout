import URI from 'urijs'

const SPProxies = {};

/**
 * Represents a proxy that uses an embedded iFrame to HostWebProxy.aspx and postMessage to bypass cross-origin policy.
 */
export default class SPProxy {
    constructor(proxyUrl) {
        this._isInitialized = false;
    }

    /**
     * Initializes the SPProxy.
     * 
     * 
     * @memberof SPProxy
     */
    async initialize(timeout) {
        if (this._isInitialized) {
            return;
        }
    }

    /**
     * Fire and forget pattern that sends the command to the target without waiting for a response.
     */
    invokeDirect(command, data, targetOrigin, transferrablePropertyPath) {
        if (!data) {
            data = {};
        }

        if (!targetOrigin) {
            targetOrigin = this.config.siteUrl;
        }

        if (!targetOrigin) {
            targetOrigin = "*";
        }

        data.command = command;
        data.postMessageId = `SP.RequestExecutor_${this.messageCounter++}`;

        let transferrableProperty = undefined;

        if (transferrablePropertyPath) {
            transferrableProperty = _.get(data, transferrablePropertyPath);
        }

        if (transferrableProperty)
            this._contentWindow.postMessage(data, targetOrigin, [transferrableProperty]);
        else
            this._contentWindow.postMessage(data, targetOrigin);
    }

    /**
     * Invokes the specified command on the channel with the specified data, constrained to the specified domain awaiting for max ms specified in timeout 
     */
    async invoke(command, data, targetOrigin, timeout, transferrablePropertyPath) {
        await this.initialize(timeout);

        if (!data) {
            data = {};
        }

        if (!targetOrigin) {
            targetOrigin = this.config.siteUrl;
        }

        if (!targetOrigin) {
            targetOrigin = "*";
        }

        if (!timeout) {
            timeout = 0;
        }

        data.command = command;
        data.postMessageId = `SP.RequestExecutor_${this.messageCounter++}`;

        let resolve, reject;
        let promise = new Promise((innerResolve, innerReject) => {
            resolve = innerResolve;
            reject = innerReject;
        });

        let timeoutPromise;
        if (timeout > 0) {
            timeoutPromise = Promise.timeout(() => {
                reject(new Error(`invoke() timed out while waiting for a response while executing ${data.command}`));
            }, timeout);
        }

        let removeMonitor = this.$rootScope.$on(this.config.crossDomainMessageSink.incomingMessageName, (event, response) => {
            if (response.postMessageId !== data.postMessageId)
                return;

            if (response.result === "error") {
                reject(response);
            }
            else {
                if (response.data) {
                    let contentType = response.headers["content-type"];
                    if (contentType.startsWith("application/json")) {
                        let str = this.ab2str(response.data);
                        response.data = JSON.parse(str);
                    } else if (contentType.startsWith("text")) {
                        response.data = this.ab2str(response.data);
                    }
                }

                resolve(response);
            }

            removeMonitor();
            if (timeoutPromise) {
                this.$timeout.cancel(timeoutPromise);
            }
        });

        let transferrableProperty = undefined;

        if (transferrablePropertyPath) {
            transferrableProperty = _.get(data, transferrablePropertyPath);
        }

        if (transferrableProperty)
            this._contentWindow.postMessage(data, targetOrigin, [transferrableProperty]);
        else
            this._contentWindow.postMessage(data, targetOrigin);

        return promise;
    }

    /**
     * Gets or creates a new SPProxy given the specified proxy url.
     * 
     * A Proxy only needs to be created for a given origin, if a proxy has already been created for an origin, that proxy is returned.
     * 
     * If an exception occurs, this indicates that a proxy couldn't be created
     * due to an authentication or other problem.
     */
    static async getOrCreateProxy(proxyUrl, timeout) {

        if (!_.isString(proxyUrl))
            throw "proxyUrl must be specified as the first argument.";

        let proxyUri = URI(proxyUrl).normalize();
        let origin = proxyUri.origin();
        if (SPProxies[origin])
            return SPProxies[origin];

        if (!timeout)
            timeout = this.config.crossDomainMessageSink.createChannelTimeout;

        if (!timeout)
            timeout = 5 * 1000;

        proxyUri.setQuery({ v: (new Date()).getTime() });
        let elemIFrame = await this.$resourceLoader.loadIFrame(proxyUri.toString(), "allow-forms allow-scripts allow-same-origin");

        let proxy;
        SPProxies[origin] = proxy = new SPProxy(this.config, elemIFrame.contentWindow);

        await proxy.invoke("Ping", {}, origin, timeout);

        return proxy;
    }

    //TODO: Destroy Proxy
}