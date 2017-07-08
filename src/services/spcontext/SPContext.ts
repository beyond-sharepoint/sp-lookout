/// <reference path="../../../node_modules/@types/requirejs/index.d.ts" />

import * as moment from 'moment';
import * as URI from 'urijs';
import { get, defaultsDeep, isError, omit } from 'lodash';
import * as Bluebird from 'bluebird';
import { SPProxy } from './SPProxy';
import { SPContextConfig, SPContextAuthenticationConfig, SPContextInfo, SandFiddleConfig } from './index.d';
import Utilities from './Utilities';

export const SPContextLocalStorageKey = 'sp-lookout-context';

/**
 * Represents a SharePoint Context.
 */
export class SPContext {
    private static $contexts: { [webFullUrl: string]: SPContext } = {};
    private readonly _webFullUrl: string;
    private readonly _config: SPContextConfig;
    private _contextInfo: SPContextInfo;

    private constructor(webFullUrl: string, config: SPContextConfig) {
        this._webFullUrl = webFullUrl;
        this._config = config;
    }

    public get currentContextInfo(): SPContextInfo {
        return this._contextInfo;
    }

    /**
     * Given an absolute or relative url, returns a url that is site-relative to the current context.
     * 
     * @param {any} siteRelativeUrl
     * @returns
     */
    public async getSiteRelativeUrl(siteRelativeUrl: string): Promise<string> {

        await this.ensureContext();

        let targetUri = URI(siteRelativeUrl);
        if (targetUri.is('absolute')) {
            targetUri = targetUri.relativeTo(this._webFullUrl);
        }

        return targetUri
            .normalize()
            .toString();
    }

    /**
     * Ensures that a current context is active.
     */
    public async ensureContext(): Promise<SPProxy> {
        let proxy: SPProxy;

        //Ensure that a SharePoint proxy is open. If it times out, redirect to the SharePoint Authentication page.
        try {
            proxy = await SPProxy.getOrCreateProxy(this._config.proxyAbsoluteUrl, this._config.proxyConfig);
        } catch (ex) {
            const currentUri = URI();
            //If it's a timeout error, redirect to the login page.
            if (isError(ex) && (<any>ex).$$spproxy && (<any>ex).$$spproxy === 'timeout') {
                //If we have a splookoutauth query string, we're probably authenticated.
                //Don't redirect back to the auth page, but throw an error.
                if (currentUri.hasQuery('splauth')) {
                    const noProxyError = new SPContextError(`Authentication has previously succeeded, but the HostWebProxy did not respond in time. Ensure that the HostWebProxy exists in the specified url.`);
                    noProxyError.$$spcontext = 'noproxy';
                    throw noProxyError;
                }

                let sourceUrl: uri.URI;
                if (this._config.authenticationConfig.sourceUrl) {
                    sourceUrl = URI(this._config.authenticationConfig.sourceUrl);
                } else {
                    sourceUrl = currentUri;
                }

                sourceUrl.addQuery({ splauth: sourceUrl.hash() });

                let authUri = URI(this._webFullUrl)
                    .pathname(this._config.authenticationConfig.authenticationEndpointWebRelativeUrl)
                    .addQuery({ 'source': sourceUrl.normalize().href() })
                    .addQuery(this._config.authenticationConfig.query || {})
                    .normalize()
                    .toString();

                const authenticationFailedError = new SPContextError(`Authentication failed, redirecting to Authentication Url: ${authUri}`);
                authenticationFailedError.$$spcontext = 'authrequired';
                window.open(authUri, '_top');
                throw authenticationFailedError;
            } else if (isError(ex) && ex.message && ex.message.startsWith('The specified origin is not trusted by the HostWebProxy')) {
                const invalidOriginError = new SPContextError(`The HostWebProxy could not trust the current origin. Ensure that the current origin (${(<any>ex).invalidOrigin}) is added to ${URI((<any>ex).url).query('').href()}`);
                invalidOriginError.$$spcontext = 'invalidorigin';
                throw invalidOriginError;
            } else if (isError(ex)) {
                throw ex;
            }

            //Unknown error -- throw a new exception.
            const unknownError = new SPContextError(`An unexpected error occurred while attempting to connect to the HostWebProxy: ${JSON.stringify(ex)}`);
            unknownError.$$spcontext = 'unknown';
            throw unknownError;
        }

        //If we don't have a context, or it is expired, get a new one.
        if (!this._contextInfo || moment().isAfter(this._contextInfo.expires)) {
            let context = await proxy.invoke(
                'Fetch',
                {
                    url: URI.joinPaths(this._webFullUrl, this._config.contextinfoEndpointWebRelativeUrl).normalize().toString(),
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: this.getDefaultHeaders(),
                    body: '',
                    cache: 'no-store'
                });

            if (!context.transferrableData) {
                throw Error('A connection to the ContextInfo endpoint did not result in a transferred object.');
            }

            const contentType = context.headers['content-type'];
            if (!contentType || !contentType.startsWith('application/json')) {
                throw Error(`Unexpected content type returned from the ContextInfo endpoint: ${contentType}`);
            }

            const str = Utilities.ab2str(context.transferrableData);
            context.data = JSON.parse(str);

            let contextInfo = get(context, 'data.d.GetContextWebInformation');

            if (!contextInfo) {
                throw Error('A connection to the ContextInfo endpoint succeeded, but a result was not returned.');
            }

            this._contextInfo = contextInfo as SPContextInfo;
            this._contextInfo.expires = moment().add(this._contextInfo.FormDigestTimeoutSeconds, 'seconds').toDate();
        }

        return proxy;
    }

    /**
     * Evaluates the specified script 
     */
    public async eval(code: string, timeout?: number): Promise<any> {
        if (!code) {
            throw Error('The code to execute must be supplied as the first argument.');
        }

        let proxy = await this.ensureContext();

        return proxy.invoke('Eval', { code }, undefined, timeout);
    }

    /**
     * Executes http requests through a proxy.
     * @returns promise that resolves with the response.
     */
    public async fetch(url: string, init?: RequestInit): Promise<Response> {

        if (!url) {
            throw Error('Fetch url must be supplied as the first argument.');
        }

        let proxy = await this.ensureContext();

        let targetUri = new URI(url);
        if (targetUri.is('relative')) {
            targetUri = targetUri.absoluteTo(this._webFullUrl);
            url = targetUri.normalize().toString();
        }

        let mergedInit = defaultsDeep(
            {},
            init,
            {
                url: targetUri.href(),
                method: 'GET',
                credentials: 'same-origin',
                headers: this.getDefaultHeaders(),
                cache: 'no-store'
            }) as any;

        if (mergedInit.params) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + Object.keys(mergedInit.params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(mergedInit.params[k]))
                .join('&');

            delete mergedInit.params;
        }

        mergedInit = omit(mergedInit, ['paramSerializer', 'transformRequest', 'transformResponse']);

        let response: any;

        //If a body is defined, ensure it is an arraybuffer and transfer it.
        //This allows large message bodies to be used.
        if (mergedInit.body) {
            let bodyType = Object.prototype.toString.call(mergedInit.body);

            switch (bodyType) {
                case '[object ArrayBuffer]':
                    //Do Nothing.
                    break;
                case '[object Blob]':
                case '[object File]':
                    //Convert the blob into an array buffer.
                    let convertBlobtoArrayBuffer = new Promise((resolve, reject) => {
                        let reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result);
                        };
                        reader.onerror = () => {
                            reject(reader.error);
                        };
                        reader.readAsArrayBuffer(mergedInit.body);
                    });

                    mergedInit.body = await convertBlobtoArrayBuffer;
                    break;
                default:
                    mergedInit.body = Utilities.str2ab(mergedInit.body);
                    break;
            }

            response = await proxy.invoke('Fetch', mergedInit, undefined, undefined, 'body');
        } else {
            response = await proxy.invoke('Fetch', mergedInit);
        }

        if (response.transferrableData) {
            let contentType = response.headers['content-type'];
            if (contentType.startsWith('application/json')) {
                let str = Utilities.ab2str(response.transferrableData);
                response.data = JSON.parse(str);
            } else if (contentType.startsWith('text')) {
                response.data = Utilities.ab2str(response.transferrableData);
            }
        }

        return response;
    }

    /**
     * Loads the script at the specified url into the context of the HostWebProxy.
     * @param src Absolute URL to the script resource.
     */
    public async injectScript(src: string | object, timeout?: number): Promise<any> {
        if (!src) {
            throw Error('An absolute url to the desired script resource must be specified.');
        }

        let proxy = await this.ensureContext();

        if (src instanceof Object) {
            return proxy.invoke('InjectScript', src);
        } else {
            return proxy.invoke('InjectScript', { src });
        }
    }

    /**
     * Using RequireJS within the proxy, dynamically requires the module with the specified id and returns the result.
     * @param id The id of the module to load
     */
    public async require(id: string, timeout?: number) {
        if (!id) {
            throw Error('Module id must be supplied as the first argument.');
        }

        let proxy = await this.ensureContext();

        return proxy.invoke('Require', { id }, undefined, timeout);
    }

    /**
     * Pass configuration options to RequireJS instance within the proxy.
     * @param id 
     */
    public async requireConfig(config: RequireConfig, timeout?: number) {
        if (!config) {
            throw Error('Config object must be supplied as the first argument.');
        }

        let proxy = await this.ensureContext();

        return proxy.invoke('Require.Config', { config }, undefined, timeout);
    }

    /**
     * Undefines the specified module from within the proxy.
     * @param id 
     */
    public async requireUndefine(id: string, timeout?: number) {
        if (!id) {
            throw Error('Module id must be supplied as the first argument.');
        }

        let proxy = await this.ensureContext();

        return proxy.invoke('Require.Undef', { id }, undefined, timeout);
    }

    /**
     * Using an isolated web worker, returns the results of the specified entry point.
     * @param config 
     */
    public async sandFiddle(config: SandFiddleConfig, timeout?: number, transferrablePath?: string, onProgress?: (progress: any) => void) {
        if (!config) {
            throw Error('SandFiddleConfig must be specified as the first argument.');
        }

        const proxy = await this.ensureContext();
        return proxy.invoke('SandFiddle', config, undefined, timeout, transferrablePath, onProgress);
    }

    /**
     * Returns a header object of the default headers defined in the settings plus the X-RequestDigest value.
     * If a headers object is supplied, it is merged with default headers.
     * 
     * @param {any} headers
     * @returns
     */
    private getDefaultHeaders(headers?: Object): {} {
        return defaultsDeep(
            {},
            this._config.defaultHeaders,
            headers,
            {
                'X-RequestDigest': this._contextInfo ? this._contextInfo.FormDigestValue : undefined
            }
        );
    }

    /**
     * Returns a SPContext for the given web url.
     */
    public static async getContext(webFullUrl: string, config?: SPContextConfig | undefined): Promise<SPContext> {
        if (!webFullUrl) {
            throw Error('A absolute url to the desired SharePoint Web must be specified as the first argument.');
        }

        //Ensure that we have a good web url.
        let webUri = URI(webFullUrl)
            .normalize();

        if (!webUri.is('absolute')) {
            throw Error('The webFullUrl must be an absolute url to the target SharePoint web.');
        }

        webFullUrl = webUri.toString();

        if (this.$contexts[webFullUrl]) {
            return this.$contexts[webFullUrl];
        }

        config = defaultsDeep(
            {},
            config,
            {
                proxyAbsoluteUrl: webUri.segment('/Shared%20Documents/HostWebProxy.aspx').normalize().toString(),
                contextinfoEndpointWebRelativeUrl: '/_api/contextinfo',
                authenticationConfig: {
                    authenticationEndpointWebRelativeUrl: '/_layouts/15/authenticate.aspx',
                    sourceUrl: undefined,
                    query: undefined
                } as SPContextAuthenticationConfig,
                defaultHeaders: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                }
            } as SPContextConfig
        ) as SPContextConfig;

        let result = new SPContext(webFullUrl, config);
        this.$contexts[webFullUrl] = result;
        return result;
    }

}

export class SPContextError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, SPContextError.prototype);
    }

    $$spcontext: 'noproxy' | 'authrequired' | 'invalidorigin' | 'unknown';
}