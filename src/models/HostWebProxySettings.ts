export interface HostWebProxySettings {
    tenantBaseUrl: string;
    hostWebProxyServerRelativePath: string;
}

export const defaultHostWebProxySettings: HostWebProxySettings = {
    tenantBaseUrl: '',
    hostWebProxyServerRelativePath: '/Shared%20Documents/HostWebProxy.aspx'
}