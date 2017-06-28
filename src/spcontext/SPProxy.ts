import URI from 'urijs';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import ResourceLoader from './ResourceLoader';

/**
 * Represents a proxy that uses an embedded iFrame to HostWebProxy.aspx and postMessage to bypass cross-origin policy.
 */
export default class SPProxy {
    private static $resourceLoader = new ResourceLoader();
    private static $proxies: Object;

    private readonly $window: Window;
    private readonly _proxyWindow: Window;
    private readonly _config: any;
    private _isInitialized: boolean;
    private _messageCounter: number;

    private constructor(config: any, proxyWindow: Window) {
        this.$window = window;
        this._config = config;
        this._proxyWindow = proxyWindow;

        this._isInitialized = false;
        this._messageCounter = 0;
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

        this._isInitialized = true;
    }

    private ab2str(buffer) {
        let result = "";
        let bytes = new Uint8Array(buffer);
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    };

    /**
     * Fire and forget pattern that sends the command to the target without waiting for a response.
     */
    public invokeDirect(command, data, targetOrigin, transferrablePropertyPath): void {
        if (!data) {
            data = {};
        }

        if (!targetOrigin) {
            targetOrigin = this._config.siteUrl;
        }

        if (!targetOrigin) {
            targetOrigin = "*";
        }

        data.command = command;
        data.postMessageId = `SP.RequestExecutor_${this._messageCounter++}`;

        let transferrableProperty: any = undefined;

        if (transferrablePropertyPath) {
            transferrableProperty = _.get(data, transferrablePropertyPath);
        }

        if (transferrableProperty)
            this._proxyWindow.postMessage(data, targetOrigin, [transferrableProperty]);
        else
            this._proxyWindow.postMessage(data, targetOrigin);
    }

    /**
     * Invokes the specified command on the channel with the specified data, constrained to the specified domain awaiting for max ms specified in timeout 
     */
    public async invoke(command, data, targetOrigin, timeout, transferrablePropertyPath): Promise<{}> {
        await this.initialize(timeout);

        if (!data) {
            data = {};
        }

        if (!targetOrigin) {
            targetOrigin = this._config.siteUrl;
        }

        if (!targetOrigin) {
            targetOrigin = "*";
        }

        if (!timeout) {
            timeout = 0;
        }

        data.command = command;
        data.postMessageId = `SP.RequestExecutor_${this._messageCounter++}`;

        let resolve, reject;
        let promise = new Promise((innerResolve, innerReject) => {
            resolve = innerResolve;
            reject = innerReject;
        });

        let timeoutPromise;
        if (timeout > 0) {
            timeoutPromise = Bluebird.timeout(() => {
                reject(new Error(`invoke() timed out while waiting for a response while executing ${data.command}`));
            }, timeout);
        }

        let removeMonitor = this.$window.(this._config.crossDomainMessageSink.incomingMessageName, (event, response) => {
            if (response.postMessageId !== data.postMessageId)
                return;

            if (response.result === "error") {
                reject(response);
            } else {
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
                timeoutPromise.cancel();
            }
        });

        let transferrableProperty: any = undefined;

        if (transferrablePropertyPath) {
            transferrableProperty = _.get(data, transferrablePropertyPath);
        }

        if (transferrableProperty)
            this._proxyWindow.postMessage(data, targetOrigin, [transferrableProperty]);
        else
            this._proxyWindow.postMessage(data, targetOrigin);

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
    static async getOrCreateProxy(proxyUrl: string, config?: SPProxyConfig) {

        if (!_.isString(proxyUrl))
            throw "proxyUrl must be specified as the first argument.";

        config = {
            ...config,
            ...{
                contextPath: "/_api/contextinfo",
                proxyUrl: "/Shared%20Documents/HostWebProxy.aspx",
                loginUrl: "/_layouts/15/authenticate.aspx",
                createChannelTimeout: 5 * 1000,
                authenticationReturnSettings: {
                    source: window.location.href,
                    query: null
                },
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose"
                }
            }
        }
        let proxyUri = URI(proxyUrl).normalize();
        let origin = proxyUri.origin();
        if (this.$proxies[origin])
            return this.$proxies[origin];

        proxyUri.setQuery({ v: (new Date()).getTime() });
        let elemIFrame = await this.$resourceLoader.loadIFrame(proxyUri.toString(), "allow-forms allow-scripts allow-same-origin");

        let proxy;
        this.$proxies[origin] = proxy = new SPProxy(config, elemIFrame.contentWindow);

        await proxy.invoke("Ping", {}, origin, config.createChannelTimeout);
        return proxy;
    }

    //TODO: Destroy Proxy
}

export interface SPProxyConfig {
    contextPath: string;
    loginUrl: string;
    createChannelTimeout: number;
    authenticationReturnSettings: SPProxyAuthenticationReturnConfig;
    crossDomainMessageSink: any;
    defaultHeaders: any[];
}

export interface SPProxyAuthenticationReturnConfig {
    source: string;
    query: any;
}