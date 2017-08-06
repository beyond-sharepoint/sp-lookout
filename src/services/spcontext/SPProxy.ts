import * as URI from 'urijs';
import { get, defaultsDeep } from 'lodash';
import * as Bluebird from 'bluebird';
import { SPProxyConfig, SPProxyResponse } from './index.d';
import { ResourceLoader } from './ResourceLoader';
import Utilities from './Utilities';

/**
 * Represents a proxy that uses an embedded iFrame to HostWebProxy.aspx and postMessage to bypass cross-origin policy.
 * 
 * A simple protocol is used to invoke commands that are defined in the hostwebproxy.
 */
export class SPProxy {
    private static $resourceLoader = new ResourceLoader();
    private static $proxies: { [origin: string]: SPProxy } = {};

    private readonly _window: Window;
    private readonly _origin: string;
    private readonly _messageId: string;
    private readonly _iFrame: HTMLIFrameElement;
    private readonly _config: SPProxyConfig;
    private _messageCounter: number;
    private _isRemoved: boolean;

    private constructor(proxyOrigin: string, proxyIFrame: HTMLIFrameElement, config: SPProxyConfig) {
        this._window = window;
        this._origin = proxyOrigin;
        this._messageId = Utilities.makeId(7);
        this._iFrame = proxyIFrame;
        this._config = config;

        this._messageCounter = 0;
        this._isRemoved = false;
    }

    public get origin(): string {
        return this._origin;
    }

    /**
     * Fire and forget pattern that sends the command to the target without waiting for a response.
     */
    public invokeDirect(command: string, data?: any, targetOrigin?: string, transferrablePropertyPath?: string): void {

        if (!command) {
            throw Error('A command must be specified.');
        }

        if (this._isRemoved || !this._iFrame || !this._iFrame.parentElement || !this._iFrame.contentWindow) {
            throw Error(`The SPProxy for ${this._origin} has been removed.`);
        }

        data = data || {};
        targetOrigin = targetOrigin || this._origin || '*';

        data['$$command'] = command;
        data['$$postMessageId'] = `${this._config.messagePrefix}_${this._messageId}_${++this._messageCounter}`;

        let transferrableProperty: any = undefined;

        if (transferrablePropertyPath) {
            transferrableProperty = get(data, transferrablePropertyPath);
        }

        if (transferrableProperty) {
            this._iFrame.contentWindow.postMessage(data, targetOrigin, [transferrableProperty]);
        } else {
            this._iFrame.contentWindow.postMessage(data, targetOrigin);
        }
    }

    /**
     * Invokes the specified command on the channel with the specified data, constrained to the specified domain awaiting for max ms specified in timeout 
     */
    public async invoke(command: string, data?: any, targetOrigin?: string, timeout?: number, transferrablePath?: string, onProgress?: (progress: any) => void): Promise<any> {

        if (!command) {
            throw Error('A command must be specified.');
        }

        if (this._isRemoved || !this._iFrame || !this._iFrame.parentElement || !this._iFrame.contentWindow) {
            throw Error(`The SPProxy for ${this._origin} has been removed.`);
        }

        data = data || {};
        targetOrigin = targetOrigin || this._origin || '*';
        if (typeof timeout === 'undefined') {
            timeout = this._config.messageResponseTimeout || 5000;
        }

        data['$$command'] = command;
        data['$$postMessageId'] = `${this._config.messagePrefix}_${this._messageId}_${++this._messageCounter}`;

        let resolve: Function, reject: Function;
        let invokePromise = new Bluebird((innerResolve, innerReject) => {
            resolve = innerResolve;
            reject = innerReject;
        });

        let messageListener = (ev: MessageEvent) => {
            ev = (<any>ev).originalEvent || ev;
            if (!ev || !ev.data || !ev.data.$$postMessageId || ev.data.$$postMessageId !== data.$$postMessageId) {
                // This message is not meant for us.
                return;
            }

            let response: SPProxyResponse = ev.data;
            response['$$origin'] = ev.origin;
            //TODO: Add things like response time.

            switch (response.$$result) {
                case 'success':
                    resolve(response);
                    break;
                case 'progress':
                    if (typeof onProgress === 'function') {
                        onProgress(response);
                    }
                    break;
                case 'error':
                    const err = new Error(response.message);
                    (<any>err).$$spproxy = 'eval';
                    err.name = response.name;
                    err.stack = response.stack;
                    for (let key in response) {
                        if (response.hasOwnProperty(key)) {
                            err[key] = response[key];
                        }
                    }
                    reject(err);
                    break;
                default:
                    reject(Error(`An unknown or unsupported result type was reported by the HostWebProxy: ${response.$$result}`));
            }
        };

        if (timeout > 0) {
            const invokeTimeoutError = Error(`invoke() timed out while waiting for a response while executing ${command}. (${timeout}ms)`);
            (<any>invokeTimeoutError).$$spproxy = 'timeout';
            invokePromise = invokePromise.timeout(timeout, invokeTimeoutError);
        }

        invokePromise = invokePromise.finally(() => {
            this._window.removeEventListener('message', messageListener);
        });

        this._window.addEventListener('message', messageListener);

        let transferrableProperty: any = undefined;

        if (transferrablePath) {
            transferrableProperty = get(data, transferrablePath);
        }

        if (transferrableProperty) {
            this._iFrame.contentWindow.postMessage(data, targetOrigin, [transferrableProperty]);
        } else {
            this._iFrame.contentWindow.postMessage(data, targetOrigin);
        }

        return invokePromise;
    }

    /**
     * Gets or creates a new SPProxy given the specified proxy url. For instance: https://mytenant.sharepoint.com//Shared%20Documents/HostWebProxy.aspx
     * 
     * A Proxy only needs to be created for a given origin, if a proxy has already been created for an origin, that proxy is returned.
     * 
     * If an exception occurs, this indicates that a proxy couldn't be created
     * due to an authentication or other problem.
     */
    public static async getOrCreateProxy(proxyAbsoluteUrl: string, config?: SPProxyConfig): Promise<SPProxy> {

        if (!proxyAbsoluteUrl) {
            throw 'The absolute url to a HostWebProxy.aspx must be specified as the first argument.';
        }

        config = defaultsDeep(
            {},
            config,
            defaultSPProxyConfig
        ) as SPProxyConfig;

        let proxyUri: uri.URI = URI(proxyAbsoluteUrl).normalize();
        let origin: string = proxyUri.origin();

        if (this.$proxies[origin]) {
            return this.$proxies[origin];
        }

        proxyUri.setQuery({ v: (new Date()).getTime() });
        let elemIFrame: HTMLIFrameElement = await this.$resourceLoader.loadIFrame(proxyUri.toString(), 'allow-forms allow-scripts allow-same-origin');

        if (!elemIFrame) {
            throw Error('Unable to load Proxy IFrame.');
        }

        if (!elemIFrame.parentElement || !elemIFrame.contentWindow) {
            throw Error('Proxy IFrame was loaded, but does not contain a parent element or content window.');
        }

        let proxy = new SPProxy(origin, elemIFrame, config);
        this.$proxies[origin] = proxy;

        const pingResponse = await proxy.invoke('Ping', {}, origin, config.createProxyTimeout);
        if (pingResponse.data !== 'Pong') {
            throw Error(`Did not expect the following response to Ping: ${pingResponse.data}`);
        }
        return proxy;
    }

    /**
     * Removes the specified proxy using the specified SPProxy instance or a url whose origin will be used to determine the proxy instance.
     * @param proxy 
     */
    public static removeProxy(proxy: SPProxy | string): boolean {

        if (typeof proxy === 'string') {
            let proxyUri = URI(proxy).normalize();
            let origin = proxyUri.origin();
            proxy = this.$proxies[origin];
            if (!proxy) {
                return false;
            }
        }
        
        let proxyParent = proxy._iFrame.parentElement;
        if (proxyParent) {
            proxyParent.removeChild(proxy._iFrame);
        }

        proxy._isRemoved = true;
        return delete this.$proxies[proxy._origin];
    }
}

export const defaultSPProxyConfig = {
    createProxyTimeout: 5 * 1000,
    messagePrefix: 'SP.RequestExecutor',
    messageResponseTimeout: 5 * 1000
};