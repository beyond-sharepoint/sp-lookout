SP Lookout!
---

Administrator-focused browser-based dashboard. Create personalized pages to manage and monitor information stored in SharePoint and elsewhere.

A central feature of SP Lookout! is the SPFiddle which allows an user to develop scripts, using the TypeScript language, to surface and manipulate content contained in SharePoint via the REST services. Script development is performed at runtime directly in the tool and can additionally import standard javascript libraries hosted on CDNs and access any web-based data source.. Scripts can also be used to surface data within dashboard pages by providing the data to WebParts.

<h1 align="center">
	<img width="800" src="https://raw.githubusercontent.com/beyond-sharepoint/sp-lookout/master/sp-lookout.gif" alt="sp-lookout">
</h1>


- Provide Dashboard functionality to monitor SharePoint at a glance.
- Provide insight into SharePoint via Charts and Data Views
- Provide UI for common tasks that SP doesn't provide. (JSLink, etc)
- Provide fiddle to easily call SP REST services (and other REST endpoints such as Office Graph, Functions, and so forth) from the tool
- Surface data provided by fiddle scripts in Dashboards.
- Allow all of the above to be configurable (and shareable)

Interactive Site
---
Get started with SP Lookout! right now by visiting the [GitHub Pages hosted site here](https://beyond-sharepoint.github.io/sp-lookout/#/)

>Note: The SP Lookout! is undergoing rapid development. If you find that it doesn't load, clear your IndexedDB in dev tools -> application or use an incognito (in-private) window.

>Note: If deploying the HostWebProxy to the root site collection, personal site or a self-service created site, the Custom Script tenant setting must be enabled. For more information, see http://go.microsoft.com/fwlink/?LinkId=397546

>Note: When using a mobile (iOS or Android) Device, the HostWebProxy must be deployed to a site that has the 'Mobile Browser View' feature disabled.

Host locally/develop: 
---

1. Clone this repo
2. Install Dependencies (npm install)
3. Via SharePoint, Upload HostWebProxy.aspx from /public to https://[YourTenant]/Shared%20Documents/
4. Start with npm start

FAQ
---

Q) What server-side technologies does SP Lookout require?

A) SP Lookout! is a browser only tool. It connects to other data sources via REST services but it itself can be hosted on any static web host such as GitHub Pages (see the demo) within SharePoint itself or other CDNs (WordPress, SiteCore, etc...)

Q) Why is this not a SPFx page or SharePoint Addin?

A) The output of the build process is static HTML/JS, thus, it can be definately be pulled into a SPFx page or SharePoint Addin. It could also be part of a UWP app, or packaged within Electron and offered on the Windows or Mac App Stores. It could also be pulled into a Phone Gap/Cordova and be a iOS/Android app. These options are left to the developer.

Q) How does SP Lookout! remember my changes?

A) The tool uses browser-based storage to persist state - see [localforage](https://github.com/localForage/localForage)

Q) What technologies are in play here?

A) React, MobX, Typescript, SASS.

Q) What browsers are supported?

A) At this point FireFox/Chrome/Safari desktop are functioning. Safari iOS has authentication issues. MS Edge and IE11 have various display issues. As the primary audience will probably desire Edge/IE11 support it is a goal to have it working well on these browsers.
