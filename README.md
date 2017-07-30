SP Lookout!
---

Administrator-focused browser-based dashboard. Create personalized pages to display information stored in SharePoint and elsewhere. A central feature of SP Lookout! is the SPFiddle which allows an user to develop scripts, using typescript to surface and manipulate content contained in SharePoint via the REST services. Scripts can also be used to surface data within dashboard pages by providing the data to WebParts.

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

Host locally/develop: 
---

1. Clone this repo
2. Install Dependencies (npm install)
3. Via SharePoint, Upload HostWebProxy.aspx from /public to https://[YourTenant]/Shared%20Documents/
4. Start with npm start

---
It's a collaboration and monitoring tool for those who are responsible for maintaining your SharePoint site.
