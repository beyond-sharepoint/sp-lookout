import * as moment from 'moment';
import * as URI from 'urijs';
import { get, defaultsDeep, isError, omit } from 'lodash';
import * as Bluebird from 'bluebird';
import SPProxy from './SPProxy';
import { SPContextConfig, SPContextAuthenticationConfig, SPContextInfo } from './index.d';

/**
 * Represents a SharePoint Context.
 */
export default class SPContext {
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
            proxy = await SPProxy.getOrCreateProxy(this._config.proxyAbsoluteUrl);
        } catch (ex) {
            //If it's a timeout error, redirect to the login page.
            if (isError(ex) && ex.message && ex.message.startsWith('invoke() timed out')) {
                let sourceUrl: uri.URI;
                if (this._config.authenticationConfig.sourceUrl) {
                    sourceUrl = URI(this._config.authenticationConfig.sourceUrl);
                } else {
                    sourceUrl = URI();
                }

                let authUri = URI(this._webFullUrl)
                    .pathname(this._config.authenticationConfig.authenticationEndpointWebRelativeUrl)
                    .addQuery({ 'source': sourceUrl.normalize().href() })
                    .addQuery(this._config.authenticationConfig.query || {})
                    .normalize()
                    .toString();

                window.open(authUri, '_top');

                //Wait for 5 seconds and then throw the exception.
                await Bluebird.delay(5 * 1000);
                throw Error(`Authentication failed, redirecting to Authentication Url: ${authUri}`);
            } else if (isError(ex) && ex.message && ex.message.startsWith('The specified origin is not trusted by the HostWebProxy')) {
                throw Error(`The HostWebProxy could not trust the current origin. Ensure that the current origin (${(<any>ex).invalidOrigin}) is added to ${URI((<any>ex).url).query('').href()}`);
            }

            //Unknown error -- throw a new exception.
            throw Error(`An unexpected error occurred while attempting to connect to the HostWebProxy: ${JSON.stringify(ex)}`);
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
    public async eval(script: string): Promise<any> {
        throw Error('Not Implemented.');
    }

    /**
     * Executes http requests through a proxy.
     * @returns promise that resolves with the response.
     */
    public async fetch(url: string, init?: RequestInit | undefined): Promise<Response> {

        if (!url) {
            throw Error('Fetch url must be supplied as the first argument.');
        }

        let proxy = await this.ensureContext();

        let targetUri = new URI(url);
        if (targetUri.is('relative')) {
            targetUri = targetUri.absoluteTo(this._webFullUrl);
            url = targetUri.normalize().toString();
        }

        let mergedSettings = defaultsDeep(
            {},
            init,
            {
                url: this._webFullUrl,
                method: 'GET',
                credentials: 'same-origin',
                headers: this.getDefaultHeaders(),
                cache: 'no-store'
            }) as any;

        mergedSettings = omit(mergedSettings, ['paramSerializer', 'transformRequest', 'transformResponse']);

        if (mergedSettings.body) {
            let bodyType = Object.prototype.toString.call(mergedSettings.body);

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
                        reader.readAsArrayBuffer(mergedSettings.body);
                    });

                    mergedSettings.body = await convertBlobtoArrayBuffer;
                    break;
                default:
                    mergedSettings.body = this.str2ab(mergedSettings.body);
                    break;
            }

            return await proxy.invoke('Fetch', mergedSettings, undefined, undefined, 'body');
        }

        return proxy.invoke('Fetch', mergedSettings);
    }

    private str2ab(str: string): ArrayBuffer {
        let len = str.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes.buffer;
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