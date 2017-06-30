import * as URI from 'urijs';
import { get, defaultsDeep, merge } from 'lodash';
import * as Bluebird from 'bluebird';
import { SPProxyConfig } from './index.d';
import ResourceLoader from './ResourceLoader';

/**
 * Represents a proxy that uses an embedded iFrame to HostWebProxy.aspx and postMessage to bypass cross-origin policy.
 * 
 * A simple protocol is used to invoke commands that are defined in the hostwebproxy.
 */
export default class SPProxy {
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
        this._messageId = SPProxy.makeId(7);
        this._iFrame = proxyIFrame;
        this._config = config;

        this._messageCounter = 0;
        this._isRemoved = false;
    }

    private ab2str(buffer: ArrayBuffer): string {
        let result = '';
        let bytes = new Uint8Array(buffer);
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }

    public get origin(): string {
        return this._origin;
    }

    /**
     * Fire and forget pattern that sends the command to the target without waiting for a response.
     */
    public invokeDirect(command: string, data: any | undefined, targetOrigin?: string | undefined, transferrablePropertyPath?: string | undefined): void {

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
    public async invoke(command: string, data?: any | undefined, targetOrigin?: string | undefined, timeout?: number | undefined, transferrablePropertyPath?: string | undefined): Promise<any> {

        if (!command) {
            throw Error('A command must be specified.');
        }

        if (this._isRemoved || !this._iFrame || !this._iFrame.parentElement || !this._iFrame.contentWindow) {
            throw Error(`The SPProxy for ${this._origin} has been removed.`);
        }

        data = data || {};
        targetOrigin = targetOrigin || this._origin || '*';
        timeout = timeout || this._config.messageResponseTimeout || 0;
        if (!timeout) {
            timeout = 0;
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
            if (!ev || !ev.data || !ev.data['$$postMessageId'] || ev.data['$$postMessageId'] !== data['$$postMessageId']) {
                // This message is not meant for us.
                return;
            }

            let response = ev.data;
            response['$$origin'] = ev.origin;
            //TODO: Add things like response time.

            if (response.result === 'error') {
                let err = new Error();
                merge(err, response);
                reject(err);
            } else {
                if (response.data) {
                    let contentType = response.headers['content-type'];
                    if (contentType.startsWith('application/json')) {
                        let str = this.ab2str(response.data);
                        response.data = JSON.parse(str);
                    } else if (contentType.startsWith('text')) {
                        response.data = this.ab2str(response.data);
                    }
                }

                resolve(response);
            }
        };

        if (timeout > 0) {
            invokePromise = invokePromise.timeout(timeout, `invoke() timed out while waiting for a response while executing ${command}`);
        }

        invokePromise = invokePromise.finally(() => {
            this._window.removeEventListener('message', messageListener);
        });

        this._window.addEventListener('message', messageListener);

        let transferrableProperty: any = undefined;

        if (transferrablePropertyPath) {
            transferrableProperty = get(data, transferrablePropertyPath);
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
            {
                createProxyTimeout: 5 * 1000,
                messagePrefix: 'SP.RequestExecutor',
                messageResponseTimeout: 5 * 1000
            } as SPProxyConfig
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

        await proxy.invoke('Ping', {}, origin, config.createProxyTimeout);
        return proxy;
    }

    /**
     * Removes the specified proxy.
     * @param proxy 
     */
    public static removeProxy(proxy: SPProxy | string): boolean {

        if (proxy instanceof String) {
            let proxyUri = URI(proxy).normalize();
            let origin = proxyUri.origin();
            proxy = this.$proxies[origin];
            if (!proxy) {
                throw Error(`A proxy for the given url could not be found: ${proxy}`);
            }
        }

        let proxyParent = proxy._iFrame.parentElement;
        if (proxyParent) {
            proxyParent.removeChild(proxy._iFrame);
        }

        proxy._isRemoved = true;
        return delete this.$proxies[proxy._origin];
    }

    private static makeId(length: number): string {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
}