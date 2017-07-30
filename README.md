SP Lookout!
---

Administrator-focused browser-based dashboard. Create personalized pages to display information stored in SharePoint and elsewhere.

<h1 align="center">
	<img width="800" src="https://raw.githubusercontent.com/beyond-sharepoint/sp-lookout/master/sp-lookout.gif" alt="sp-lookout">
</h1>


- Provide Dashboard functionality to monitor SharePoint at a glance.
- Provide insight into SharePoint via Charts and Data Views
- Provide UI for common tasks that SP doesn't provide. (JSLink, etc)
- Provide fiddle to easily call SP REST services (and other REST endpoints) from the tool
- Surface data provided by fiddle scripts in Dashboards.
- Allow all of the above to be configurable (and shareable)

[Interactive Demo](https://beyond-sharepoint.github.io/sp-lookout/#/)

>Note: The demo site changes frequently, if you find that it doesn't load, clear your IndexedDB in dev tools -> application

Host locally/develop: 
---

1. Clone this repo
2. Install Dependencies (npm install)
3. Via SharePoint, Upload HostWebProxy.aspx from /public to https://[YourTenant]/Shared%20Documents/
4. Start with npm start
