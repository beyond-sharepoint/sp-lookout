import * as moment from 'moment'
import URI from 'urijs'
import * as _ from 'lodash'
import SPProxy from './SPProxy.js'

/**
 * Represents a SharePoint Context.
 */
export default class SPContext {
    private static $contexts: {};
    private $window: Window;
    private $webUrl: string;
    private $settings: any;

    private constructor(webUrl: string, settings: SPContextSettings) {
        this.$window = window;
        this.$webUrl = webUrl;
        this.$settings = this.getDefaultSettings(settings);

        this.proxyFullPath = URI.joinPaths(this.settings.siteUrl, this.settings.proxyUrl).absoluteTo(this.settings.siteUrl).normalize().toString();
        this.contextFullPath = URI.joinPaths(this.siteUrl, this.settings.contextPath).absoluteTo(this.siteUrl).normalize().toString();
    }

    private str2ab(str) {
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
    private getDefaultHeaders(headers) {
        let result = _.cloneDeep(this.settings.headers);
        if (this.contextInfo) {
            result["X-RequestDigest"] = this.contextInfo.FormDigestValue;
        }

        if (headers) {
            _.merge(result, headers);
        }

        return result;
    }

    /**
     * Given an absolute or relative url, returns a url that is site-relative to the current context.
     * 
     * @param {any} siteRelativeUrl
     * @returns
     */
    async getSiteRelativeUrl(siteRelativeUrl) {

        await this.ensureContext();

        let targetUri = URI(siteRelativeUrl);
        if (targetUri.is("absolute"))
            targetUri = targetUri.relativeTo(this.$webUrl);

        return targetUri
            .normalize()
            .toString();
    }

    /**
     * Ensures that a current context is active.
     */
    public async ensureContext() {
        let proxy;

        //Ensure that a SharePoint proxy is open. If it times out, redirect to the SharePoint Authentication page.
        try {
            proxy = await SPProxy.getOrCreateProxy(this.proxyFullPath, this.settings.proxyTimeout);
        }
        catch (ex) {
            //If it's a timeout error, redirect to the login page.
            if (_.isError(ex) && ex.message.startsWith("invoke() timed out")) {
                let sourceUrl;
                if (this.settings.authenticationReturnSettings.source)
                    sourceUrl = URI(this.settings.authenticationReturnSettings.source);
                else
                    sourceUrl = URI(this.$window.location.href);

                if (this.settings.authenticationReturnSettings.query) {
                    sourceUrl.query(this.settings.authenticationReturnSettings.query);
                };

                let authUri = URI(this.siteUrl)
                    .pathname(this.settings.loginUrl)
                    .addQuery("source", sourceUrl)
                    .normalize()
                    .toString();

                this.$window.open(authUri, "_top");

                //Return a promise that won't resolve while this page is navigating.
                return new Promise(() => { });
            }

            //Unknown error -- throw the exception.
            throw ex;
        }

        //If we don't have a context, or it is expired, get a new one.
        if (!this.contextInfo || moment().isAfter(this.contextInfo.expires)) {
            let context = await channel.invoke("Fetch",
                {
                    url: this.contextFullPath,
                    method: "POST",
                    credentials: 'same-origin',
                    headers: this.getDefaultHeaders(),
                    body: "",
                    cache: "no-store"
                });

            let contextInfo = _.get(context, "data.d.GetContextWebInformation");

            if (!contextInfo)
                throw new Error("A connection to the ContextInfo endpoint succeeded, but a result was not returned.");

            this.contextInfo = contextInfo;
            this.contextInfo.expires = moment().add(this.contextInfo.FormDigestTimeoutSeconds, 'seconds');

            //Update the web and site Url based on what we received back from contextinfo.
            this.siteUrl = this.contextInfo.SiteFullUrl;
            this.webUrl = this.contextInfo.WebFullUrl;
        }

        return channel;
    }

    /**
     * Executes http requests through a proxy.
     * @returns promise that resolves with the response.
     */
    public async fetch(settings, rawResponse) {

        if (!settings)
            throw "Fetch settings must be supplied as the first argument.";

        let channel = await this.ensureContext();

        if (settings.url) {
            let targetUri = new URI(settings.url);
            if (targetUri.is("relative")) {
                targetUri = targetUri.absoluteTo(this.webUrl);
                settings.url = targetUri.normalize().toString();
            }
        }

        let mergedSettings = _.merge({
            url: this.webUrl,
            method: "GET",
            credentials: 'same-origin',
            headers: this.getDefaultHeaders(),
            cache: "no-store"
        }, settings);

        mergedSettings = _.omit(mergedSettings, ["paramSerializer", "transformRequest", "transformResponse"]);

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
                            resolve(reader.result)
                        }
                        reader.onerror = () => {
                            reject(reader.error)
                        }
                        reader.readAsArrayBuffer(mergedSettings.body);
                    });

                    mergedSettings.body = await convertBlobtoArrayBuffer;
                    break;
                default:
                    mergedSettings.body = this.str2ab(mergedSettings.body);
                    break;
            }

            return channel.invoke('Fetch', mergedSettings, undefined, undefined, "body");
        }

        return channel.invoke('Fetch', mergedSettings);
    };

    public static getDefaultSettings(settings) {
        return _.defaultsDeep(settings, {
            contextPath: "/_api/contextinfo",
            proxyUrl: "/Shared%20Documents/HostWebProxy.aspx",
            proxyTimeout: 5000,
            loginUrl: "/_layouts/15/authenticate.aspx",
            authenticationReturnSettings: {},
            headers: {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose"
            }
        });
    }

    /**
     * Returns a SPContext for the given web url.
     */
    public static getContext(webUrl: string, settings: SPContextSettings) {

        if (!webUrl) {
            throw Error("A url to the desired SharePoint Web must be specified as the first argument.");
        }

        //Ensure that we have a good web url.
        webUrl = URI(webUrl)
            .normalize()
            .toString();

        if (this.$contexts[webUrl]) {
            return this.$contexts[webUrl];
        }

        let result = new SPContext(webUrl, settings);
        this.$contexts[webUrl] = result;
        return result;
    }
}

export interface SPContextSettings {

}