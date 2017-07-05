export interface SPProxyConfig {
    createProxyTimeout: number;
    messagePrefix: string;
    messageResponseTimeout: number;
}

export interface SPContextConfig {
    /**
     * The absolute URL to a host web proxy file.
     */
    proxyAbsoluteUrl: string;
    /**
     * Default Proxy Configuration
     */
    proxyConfig: SPProxyConfig
    /**
     * The web relative url to contextinfo. E.g. "/_api/contextinfo"
     */
    contextinfoEndpointWebRelativeUrl: string;
    /**
     * Optionally defines additional query string values to pass to the authentication page.
     */
    authenticationConfig: SPContextAuthenticationConfig;
    /**
     * Specifies any default headers to include.
     */
    defaultHeaders: any;
}

export interface SPContextAuthenticationConfig {
    /**
     * The web relative url to the authentication page. E.g. "/_layouts/15/authenticate.aspx"
     */
    authenticationEndpointWebRelativeUrl: string;
    /**
     * The value of the source query string value to pass to the authentication endpoint
     */
    sourceUrl: string | undefined;
    /**
     * A hash whose key/values will be passed as query string parameters to the authentication endpoint.
     */
    query: any;
}

export interface SPContextInfo {
    FormDigestTimeoutSeconds: number;
    FormDigestValue: string;
    LibraryVersion: string;
    SiteFullUrl: string;
    WebFullUrl: string;
    expires: Date;
}

export interface SandFiddleConfig {
    requireConfig: any;
    defines: Array<string>;
    entryPointId: string;
    timeout?: number;
}