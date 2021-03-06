<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <WebPartPages:AllowFraming runat="server" />

    <head runat="server">
        <meta name="GENERATOR" content="Microsoft SharePoint" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta http-equiv="Expires" content="0" />
        <title>SharePoint Host Web Proxy</title>
    </head>

    <body>
        <script id="hostWebProxyConfig" type="text/javascript">
            // @}-,--`--> Start HostWebProxyConfig
            window.hostWebProxyConfig = {
                "responseOrigin": "*",
                "trustedOriginAuthorities": [
                    "https://baristalabs.sharepoint.com",
                    "https://beyond-sharepoint.github.io",
                    "http://localhost:8080",
                    "http://localhost:3000"
                ]
            }
            // @}-,--`--> End HostWebProxyConfig
        </script>
    </body>

    </html>