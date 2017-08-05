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
    <script type="text/javascript">!function(t){function e(n){if(r[n])return r[n].exports;var o=r[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,e),o.l=!0,o.exports}var r={};e.m=t,e.c=r,e.d=function(t,r,n){e.o(t,r)||Object.defineProperty(t,r,{configurable:!1,enumerable:!0,get:n})},e.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(r,"a",r),r},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="/",e(e.s=0)}([function(t,e,r){r(1),r(2),r(7),t.exports=r(8)},function(t,e){!function(t){"use strict";function e(t){if("string"!=typeof t&&(t=String(t)),/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(t))throw new TypeError("Invalid character in header field name");return t.toLowerCase()}function r(t){return"string"!=typeof t&&(t=String(t)),t}function n(t){var e={next:function(){var e=t.shift();return{done:void 0===e,value:e}}};return v.iterable&&(e[Symbol.iterator]=function(){return e}),e}function o(t){this.map={},t instanceof o?t.forEach(function(t,e){this.append(e,t)},this):Array.isArray(t)?t.forEach(function(t){this.append(t[0],t[1])},this):t&&Object.getOwnPropertyNames(t).forEach(function(e){this.append(e,t[e])},this)}function i(t){if(t.bodyUsed)return Promise.reject(new TypeError("Already read"));t.bodyUsed=!0}function s(t){return new Promise(function(e,r){t.onload=function(){e(t.result)},t.onerror=function(){r(t.error)}})}function a(t){var e=new FileReader,r=s(e);return e.readAsArrayBuffer(t),r}function u(t){var e=new FileReader,r=s(e);return e.readAsText(t),r}function c(t){for(var e=new Uint8Array(t),r=new Array(e.length),n=0;n<e.length;n++)r[n]=String.fromCharCode(e[n]);return r.join("")}function f(t){if(t.slice)return t.slice(0);var e=new Uint8Array(t.byteLength);return e.set(new Uint8Array(t)),e.buffer}function l(){return this.bodyUsed=!1,this._initBody=function(t){if(this._bodyInit=t,t)if("string"==typeof t)this._bodyText=t;else if(v.blob&&Blob.prototype.isPrototypeOf(t))this._bodyBlob=t;else if(v.formData&&FormData.prototype.isPrototypeOf(t))this._bodyFormData=t;else if(v.searchParams&&URLSearchParams.prototype.isPrototypeOf(t))this._bodyText=t.toString();else if(v.arrayBuffer&&v.blob&&g(t))this._bodyArrayBuffer=f(t.buffer),this._bodyInit=new Blob([this._bodyArrayBuffer]);else{if(!v.arrayBuffer||!ArrayBuffer.prototype.isPrototypeOf(t)&&!w(t))throw new Error("unsupported BodyInit type");this._bodyArrayBuffer=f(t)}else this._bodyText="";this.headers.get("content-type")||("string"==typeof t?this.headers.set("content-type","text/plain;charset=UTF-8"):this._bodyBlob&&this._bodyBlob.type?this.headers.set("content-type",this._bodyBlob.type):v.searchParams&&URLSearchParams.prototype.isPrototypeOf(t)&&this.headers.set("content-type","application/x-www-form-urlencoded;charset=UTF-8"))},v.blob&&(this.blob=function(){var t=i(this);if(t)return t;if(this._bodyBlob)return Promise.resolve(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(new Blob([this._bodyArrayBuffer]));if(this._bodyFormData)throw new Error("could not read FormData body as blob");return Promise.resolve(new Blob([this._bodyText]))},this.arrayBuffer=function(){return this._bodyArrayBuffer?i(this)||Promise.resolve(this._bodyArrayBuffer):this.blob().then(a)}),this.text=function(){var t=i(this);if(t)return t;if(this._bodyBlob)return u(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(c(this._bodyArrayBuffer));if(this._bodyFormData)throw new Error("could not read FormData body as text");return Promise.resolve(this._bodyText)},v.formData&&(this.formData=function(){return this.text().then(d)}),this.json=function(){return this.text().then(JSON.parse)},this}function p(t){var e=t.toUpperCase();return _.indexOf(e)>-1?e:t}function h(t,e){e=e||{};var r=e.body;if(t instanceof h){if(t.bodyUsed)throw new TypeError("Already read");this.url=t.url,this.credentials=t.credentials,e.headers||(this.headers=new o(t.headers)),this.method=t.method,this.mode=t.mode,r||null==t._bodyInit||(r=t._bodyInit,t.bodyUsed=!0)}else this.url=String(t);if(this.credentials=e.credentials||this.credentials||"omit",!e.headers&&this.headers||(this.headers=new o(e.headers)),this.method=p(e.method||this.method||"GET"),this.mode=e.mode||this.mode||null,this.referrer=null,("GET"===this.method||"HEAD"===this.method)&&r)throw new TypeError("Body not allowed for GET or HEAD requests");this._initBody(r)}function d(t){var e=new FormData;return t.trim().split("&").forEach(function(t){if(t){var r=t.split("="),n=r.shift().replace(/\+/g," "),o=r.join("=").replace(/\+/g," ");e.append(decodeURIComponent(n),decodeURIComponent(o))}}),e}function y(t){var e=new o;return t.split(/\r?\n/).forEach(function(t){var r=t.split(":"),n=r.shift().trim();if(n){var o=r.join(":").trim();e.append(n,o)}}),e}function m(t,e){e||(e={}),this.type="default",this.status="status"in e?e.status:200,this.ok=this.status>=200&&this.status<300,this.statusText="statusText"in e?e.statusText:"OK",this.headers=new o(e.headers),this.url=e.url||"",this._initBody(t)}if(!t.fetch){var v={searchParams:"URLSearchParams"in t,iterable:"Symbol"in t&&"iterator"in Symbol,blob:"FileReader"in t&&"Blob"in t&&function(){try{return new Blob,!0}catch(t){return!1}}(),formData:"FormData"in t,arrayBuffer:"ArrayBuffer"in t};if(v.arrayBuffer)var b=["[object Int8Array]","[object Uint8Array]","[object Uint8ClampedArray]","[object Int16Array]","[object Uint16Array]","[object Int32Array]","[object Uint32Array]","[object Float32Array]","[object Float64Array]"],g=function(t){return t&&DataView.prototype.isPrototypeOf(t)},w=ArrayBuffer.isView||function(t){return t&&b.indexOf(Object.prototype.toString.call(t))>-1};o.prototype.append=function(t,n){t=e(t),n=r(n);var o=this.map[t];this.map[t]=o?o+","+n:n},o.prototype.delete=function(t){delete this.map[e(t)]},o.prototype.get=function(t){return t=e(t),this.has(t)?this.map[t]:null},o.prototype.has=function(t){return this.map.hasOwnProperty(e(t))},o.prototype.set=function(t,n){this.map[e(t)]=r(n)},o.prototype.forEach=function(t,e){for(var r in this.map)this.map.hasOwnProperty(r)&&t.call(e,this.map[r],r,this)},o.prototype.keys=function(){var t=[];return this.forEach(function(e,r){t.push(r)}),n(t)},o.prototype.values=function(){var t=[];return this.forEach(function(e){t.push(e)}),n(t)},o.prototype.entries=function(){var t=[];return this.forEach(function(e,r){t.push([r,e])}),n(t)},v.iterable&&(o.prototype[Symbol.iterator]=o.prototype.entries);var _=["DELETE","GET","HEAD","OPTIONS","POST","PUT"];h.prototype.clone=function(){return new h(this,{body:this._bodyInit})},l.call(h.prototype),l.call(m.prototype),m.prototype.clone=function(){return new m(this._bodyInit,{status:this.status,statusText:this.statusText,headers:new o(this.headers),url:this.url})},m.error=function(){var t=new m(null,{status:0,statusText:""});return t.type="error",t};var x=[301,302,303,307,308];m.redirect=function(t,e){if(-1===x.indexOf(e))throw new RangeError("Invalid status code");return new m(null,{status:e,headers:{location:t}})},t.Headers=o,t.Request=h,t.Response=m,t.fetch=function(t,e){return new Promise(function(r,n){var o=new h(t,e),i=new XMLHttpRequest;i.onload=function(){var t={status:i.status,statusText:i.statusText,headers:y(i.getAllResponseHeaders()||"")};t.url="responseURL"in i?i.responseURL:t.headers.get("X-Request-URL");var e="response"in i?i.response:i.responseText;r(new m(e,t))},i.onerror=function(){n(new TypeError("Network request failed"))},i.ontimeout=function(){n(new TypeError("Network request failed"))},i.open(o.method,o.url,!0),"include"===o.credentials&&(i.withCredentials=!0),"responseType"in i&&v.blob&&(i.responseType="blob"),o.headers.forEach(function(t,e){i.setRequestHeader(e,t)}),i.send(void 0===o._bodyInit?null:o._bodyInit)})},t.fetch.polyfill=!0}}("undefined"!=typeof self?self:this)},function(t,e,r){(function(e){!function(r){function n(){}function o(t,e){return function(){t.apply(e,arguments)}}function i(t){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof t)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],l(t,this)}function s(t,e){for(;3===t._state;)t=t._value;if(0===t._state)return void t._deferreds.push(e);t._handled=!0,i._immediateFn(function(){var r=1===t._state?e.onFulfilled:e.onRejected;if(null===r)return void(1===t._state?a:u)(e.promise,t._value);var n;try{n=r(t._value)}catch(t){return void u(e.promise,t)}a(e.promise,n)})}function a(t,e){try{if(e===t)throw new TypeError("A promise cannot be resolved with itself.");if(e&&("object"==typeof e||"function"==typeof e)){var r=e.then;if(e instanceof i)return t._state=3,t._value=e,void c(t);if("function"==typeof r)return void l(o(r,e),t)}t._state=1,t._value=e,c(t)}catch(e){u(t,e)}}function u(t,e){t._state=2,t._value=e,c(t)}function c(t){2===t._state&&0===t._deferreds.length&&i._immediateFn(function(){t._handled||i._unhandledRejectionFn(t._value)});for(var e=0,r=t._deferreds.length;e<r;e++)s(t,t._deferreds[e]);t._deferreds=null}function f(t,e,r){this.onFulfilled="function"==typeof t?t:null,this.onRejected="function"==typeof e?e:null,this.promise=r}function l(t,e){var r=!1;try{t(function(t){r||(r=!0,a(e,t))},function(t){r||(r=!0,u(e,t))})}catch(t){if(r)return;r=!0,u(e,t)}}var p=setTimeout;i.prototype.catch=function(t){return this.then(null,t)},i.prototype.then=function(t,e){var r=new this.constructor(n);return s(this,new f(t,e,r)),r},i.all=function(t){var e=Array.prototype.slice.call(t);return new i(function(t,r){function n(i,s){try{if(s&&("object"==typeof s||"function"==typeof s)){var a=s.then;if("function"==typeof a)return void a.call(s,function(t){n(i,t)},r)}e[i]=s,0==--o&&t(e)}catch(t){r(t)}}if(0===e.length)return t([]);for(var o=e.length,i=0;i<e.length;i++)n(i,e[i])})},i.resolve=function(t){return t&&"object"==typeof t&&t.constructor===i?t:new i(function(e){e(t)})},i.reject=function(t){return new i(function(e,r){r(t)})},i.race=function(t){return new i(function(e,r){for(var n=0,o=t.length;n<o;n++)t[n].then(e,r)})},i._immediateFn="function"==typeof e&&function(t){e(t)}||function(t){p(t,0)},i._unhandledRejectionFn=function(t){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",t)},i._setImmediateFn=function(t){i._immediateFn=t},i._setUnhandledRejectionFn=function(t){i._unhandledRejectionFn=t},void 0!==t&&t.exports?t.exports=i:r.Promise||(r.Promise=i)}(this)}).call(e,r(3).setImmediate)},function(t,e,r){function n(t,e){this._id=t,this._clearFn=e}var o=Function.prototype.apply;e.setTimeout=function(){return new n(o.call(setTimeout,window,arguments),clearTimeout)},e.setInterval=function(){return new n(o.call(setInterval,window,arguments),clearInterval)},e.clearTimeout=e.clearInterval=function(t){t&&t.close()},n.prototype.unref=n.prototype.ref=function(){},n.prototype.close=function(){this._clearFn.call(window,this._id)},e.enroll=function(t,e){clearTimeout(t._idleTimeoutId),t._idleTimeout=e},e.unenroll=function(t){clearTimeout(t._idleTimeoutId),t._idleTimeout=-1},e._unrefActive=e.active=function(t){clearTimeout(t._idleTimeoutId);var e=t._idleTimeout;e>=0&&(t._idleTimeoutId=setTimeout(function(){t._onTimeout&&t._onTimeout()},e))},r(4),e.setImmediate=setImmediate,e.clearImmediate=clearImmediate},function(t,e,r){(function(t,e){!function(t,r){"use strict";function n(t){"function"!=typeof t&&(t=new Function(""+t));for(var e=new Array(arguments.length-1),r=0;r<e.length;r++)e[r]=arguments[r+1];var n={callback:t,args:e};return c[u]=n,a(u),u++}function o(t){delete c[t]}function i(t){var e=t.callback,n=t.args;switch(n.length){case 0:e();break;case 1:e(n[0]);break;case 2:e(n[0],n[1]);break;case 3:e(n[0],n[1],n[2]);break;default:e.apply(r,n)}}function s(t){if(f)setTimeout(s,0,t);else{var e=c[t];if(e){f=!0;try{i(e)}finally{o(t),f=!1}}}}if(!t.setImmediate){var a,u=1,c={},f=!1,l=t.document,p=Object.getPrototypeOf&&Object.getPrototypeOf(t);p=p&&p.setTimeout?p:t,"[object process]"==={}.toString.call(t.process)?function(){a=function(t){e.nextTick(function(){s(t)})}}():function(){if(t.postMessage&&!t.importScripts){var e=!0,r=t.onmessage;return t.onmessage=function(){e=!1},t.postMessage("","*"),t.onmessage=r,e}}()?function(){var e="setImmediate$"+Math.random()+"$",r=function(r){r.source===t&&"string"==typeof r.data&&0===r.data.indexOf(e)&&s(+r.data.slice(e.length))};t.addEventListener?t.addEventListener("message",r,!1):t.attachEvent("onmessage",r),a=function(r){t.postMessage(e+r,"*")}}():t.MessageChannel?function(){var t=new MessageChannel;t.port1.onmessage=function(t){s(t.data)},a=function(e){t.port2.postMessage(e)}}():l&&"onreadystatechange"in l.createElement("script")?function(){var t=l.documentElement;a=function(e){var r=l.createElement("script");r.onreadystatechange=function(){s(e),r.onreadystatechange=null,t.removeChild(r),r=null},t.appendChild(r)}}():function(){a=function(t){setTimeout(s,0,t)}}(),p.setImmediate=n,p.clearImmediate=o}}("undefined"==typeof self?void 0===t?this:t:self)}).call(e,r(5),r(6))},function(t,e){var r;r=function(){return this}();try{r=r||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(r=window)}t.exports=r},function(t,e){function r(){throw new Error("setTimeout has not been defined")}function n(){throw new Error("clearTimeout has not been defined")}function o(t){if(f===setTimeout)return setTimeout(t,0);if((f===r||!f)&&setTimeout)return f=setTimeout,setTimeout(t,0);try{return f(t,0)}catch(e){try{return f.call(null,t,0)}catch(e){return f.call(this,t,0)}}}function i(t){if(l===clearTimeout)return clearTimeout(t);if((l===n||!l)&&clearTimeout)return l=clearTimeout,clearTimeout(t);try{return l(t)}catch(e){try{return l.call(null,t)}catch(e){return l.call(this,t)}}}function s(){y&&h&&(y=!1,h.length?d=h.concat(d):m=-1,d.length&&a())}function a(){if(!y){var t=o(s);y=!0;for(var e=d.length;e;){for(h=d,d=[];++m<e;)h&&h[m].run();m=-1,e=d.length}h=null,y=!1,i(t)}}function u(t,e){this.fun=t,this.array=e}function c(){}var f,l,p=t.exports={};!function(){try{f="function"==typeof setTimeout?setTimeout:r}catch(t){f=r}try{l="function"==typeof clearTimeout?clearTimeout:n}catch(t){l=n}}();var h,d=[],y=!1,m=-1;p.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];d.push(new u(t,e)),1!==d.length||y||o(a)},u.prototype.run=function(){this.fun.apply(null,this.array)},p.title="browser",p.browser=!0,p.env={},p.argv=[],p.version="",p.versions={},p.on=c,p.addListener=c,p.once=c,p.off=c,p.removeListener=c,p.removeAllListeners=c,p.emit=c,p.prependListener=c,p.prependOnceListener=c,p.listeners=function(t){return[]},p.binding=function(t){throw new Error("process.binding is not supported")},p.cwd=function(){return"/"},p.chdir=function(t){throw new Error("process.chdir is not supported")},p.umask=function(){return 0}},function(t,e){!function(t,e){"use strict";function r(){if(!i){i=!0;for(var t=0;t<o.length;t++)o[t].fn.call(window,o[t].ctx);o=[]}}function n(){"complete"===document.readyState&&r()}t=t||"docReady",e=e||window;var o=[],i=!1,s=!1;e[t]=function(t,e){if(i)return void setTimeout(function(){t(e)},1);o.push({fn:t,ctx:e}),"complete"===document.readyState||!document.attachEvent&&"interactive"===document.readyState?setTimeout(r,1):s||(document.addEventListener?(document.addEventListener("DOMContentLoaded",r,!1),window.addEventListener("load",r,!1)):(document.attachEvent("onreadystatechange",n),window.attachEvent("onload",r)),s=!0)}}("docReady",window)},function(module,exports,__webpack_require__){var __assign=this&&this.__assign||Object.assign||function(t){for(var e,r=1,n=arguments.length;r<n;r++){e=arguments[r];for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o])}return t},__awaiter=this&&this.__awaiter||function(t,e,r,n){return new(r||(r=Promise))(function(o,i){function s(t){try{u(n.next(t))}catch(t){i(t)}}function a(t){try{u(n.throw(t))}catch(t){i(t)}}function u(t){t.done?o(t.value):new r(function(e){e(t.value)}).then(s,a)}u((n=n.apply(t,e||[])).next())})},__generator=this&&this.__generator||function(t,e){function r(t){return function(e){return n([t,e])}}function n(r){if(o)throw new TypeError("Generator is already executing.");for(;u;)try{if(o=1,i&&(s=i[2&r[0]?"return":r[0]?"throw":"next"])&&!(s=s.call(i,r[1])).done)return s;switch(i=0,s&&(r=[0,s.value]),r[0]){case 0:case 1:s=r;break;case 4:return u.label++,{value:r[1],done:!1};case 5:u.label++,i=r[1],r=[0];continue;case 7:r=u.ops.pop(),u.trys.pop();continue;default:if(s=u.trys,!(s=s.length>0&&s[s.length-1])&&(6===r[0]||2===r[0])){u=0;continue}if(3===r[0]&&(!s||r[1]>s[0]&&r[1]<s[3])){u.label=r[1];break}if(6===r[0]&&u.label<s[1]){u.label=s[1],s=r;break}if(s&&u.label<s[2]){u.label=s[2],u.ops.push(r);break}s[2]&&u.ops.pop(),u.trys.pop();continue}r=e.call(t,u)}catch(t){r=[6,t],i=0}finally{o=s=0}if(5&r[0])throw r[1];return{value:r[0]?r[1]:void 0,done:!0}}var o,i,s,a,u={label:0,sent:function(){if(1&s[0])throw s[1];return s[1]},trys:[],ops:[]};return a={next:r(0),throw:r(1),return:r(2)},"function"==typeof Symbol&&(a[Symbol.iterator]=function(){return this}),a},HostWebWorker=__webpack_require__(9),ProxyUtil=function(){function t(){}return Object.defineProperty(t,"hostWebProxyConfig",{get:function(){return window.hostWebProxyConfig},enumerable:!0,configurable:!0}),t.str2ab=function(t){for(var e=t.length,r=new Uint8Array(e),n=0;n<e;n++)r[n]=t.charCodeAt(n);return r.buffer},t.timeout=function(t,e,r){var n;return Promise.race([t,new Promise(function(t,o){n=setTimeout(function(){o(new Error(r||"Timeout Error"))},e)})]).then(function(t){return clearTimeout(n),t},function(t){throw clearTimeout(n),t})},t.postMessage=function(t){var e=this.hostWebProxyConfig.responseOrigin||"*";window.parent.postMessage(t,e,t.transferrableData?[t.transferrableData]:void 0)},t.postMessageError=function(t,e,r){var n={$$command:t,$$postMessageId:e,$$result:"error",message:r,type:Object.prototype.toString.call(r),context:"proxy"};if("object"==typeof r){n.name=r.name,n.message=r.message,n.stack=r.stack;for(var o in r)r.hasOwnProperty(o)&&(n[o]=r[o]);n.originalError&&(n.originalError=JSON.stringify(n.originalError))}this.postMessage(n)},t.postProgress=function(t,e,r){var n={$$command:t,$$postMessageId:e,$$result:"progress",data:r};this.postMessage(n)},t}(),HostWebProxy=function(){function HostWebProxy(){var _this=this;this.currentErrorHandler=function(t){},this.commandMap={Brew:function(t,e,r){_this.brew(t,e,r)},Fetch:function(t,e,r){_this.fetch(t,e,r)},Ping:function(t,e,r){ProxyUtil.postMessage(__assign({},r,{$$result:"success",transferrableData:ProxyUtil.str2ab("Pong")}))},Eval:function(t,e,r){try{(0,eval)(r.code)}catch(r){ProxyUtil.postMessageError(t,e,r)}ProxyUtil.postMessage({$$command:t,$$postMessageId:e,$$result:"success"})},SetCommand:function(command,postMessageId,request){try{_this.commandMap[request.commandName]=eval(request.commandCode)}catch(t){ProxyUtil.postMessageError(command,postMessageId,t)}ProxyUtil.postMessage({$$command:command,$$postMessageId:postMessageId,$$result:"success",data:request.commandName})},SetWorkerCommand:function(command,postMessageId,request){try{_this.workerCommandMap[request.commandName]=eval(request.commandCode)}catch(t){ProxyUtil.postMessageError(command,postMessageId,t)}ProxyUtil.postMessage({$$command:command,$$postMessageId:postMessageId,$$result:"success",data:request.commandName})}},this.workerCommandMap={success:function(t,e,r){t(r)},progress:function(t,e,r,n){ProxyUtil.postProgress(n.command,n.postMessageId,r)},error:function(t,e,r){var n=new Error(r.message);n.name=r.name,n.stack=r.stack,n.originalErrorMessage=r,e(n)}},this.errorHandler=this.errorHandler.bind(this),this.messageHandler=this.messageHandler.bind(this)}return HostWebProxy.prototype.errorHandler=function(t){this.currentErrorHandler(t)},HostWebProxy.prototype.messageHandler=function(t){var e=t.origin||t.originalEvent.origin,r=t.data.$$command,n=t.data.$$postMessageId;if(e&&r&&n){if(ProxyUtil.hostWebProxyConfig.trustedOriginAuthorities&&ProxyUtil.hostWebProxyConfig.trustedOriginAuthorities.length){for(var o=!1,i=0,s=ProxyUtil.hostWebProxyConfig.trustedOriginAuthorities;i<s.length;i++){var a=s[i];if(RegExp(a,"ig").test(e)){o=!0;break}}if(!o){var u="The specified origin is not trusted by the HostWebProxy: "+e,c={$$command:r,$$postMessageId:n,$$result:"error",message:u,invalidOrigin:e,url:window.location.href};throw ProxyUtil.postMessage(c),Error(u)}}this.processCommand(r,n,t.data)}},HostWebProxy.prototype.processCommand=function(t,e,r){if(this.commandMap[t])try{this.commandMap[t].call(this,t,e,r)}catch(r){ProxyUtil.postMessageError(t,e,r)}finally{return}ProxyUtil.postMessage({$$command:t,$$postMessageId:e,$$result:"error",message:"Unknown or unsupported command: "+t})},HostWebProxy.prototype.fetch=function(t,e,r){return __awaiter(this,void 0,void 0,function(){var n,o,i,s,a,u,c,f,l,p,h,d;return __generator(this,function(y){switch(y.label){case 0:if(n={cache:r.cache,credentials:r.credentials,method:r.method,mode:"same-origin"},r.headers)for(n.headers=new Headers,o=0,i=Object.keys(r.headers);o<i.length;o++)s=i[o],n.headers.append(s,r.headers[s]);"GET"!==r.method.toUpperCase()&&(n.body=r.body,n.bodyUsed=!0),y.label=1;case 1:return y.trys.push([1,4,,5]),[4,fetch(r.url,n)];case 2:return a=y.sent(),u={},"function"==typeof a.headers.forEach&&a.headers.forEach(function(t,e,r){u[e]=t}),f={$$command:t,$$postMessageId:e,$$result:"success",headers:u,data:void 0},[4,a.arrayBuffer()];case 3:for(f.transferrableData=y.sent(),c=f,l=0,p=["ok","redirected","status","statusText","type","url"];l<p.length;l++)h=p[l],c[h]=a[h];return ProxyUtil.postMessage(c),[3,5];case 4:return d=y.sent(),ProxyUtil.postMessageError(t,e,d),[3,5];case 5:return[2]}})})},HostWebProxy.prototype.brew=function(t,e,r){return __awaiter(this,void 0,void 0,function(){var n,o,i,s,a,u,c,f,l=this;return __generator(this,function(p){switch(p.label){case 0:n=new HostWebWorker,p.label=1;case 1:if(p.trys.push([1,6,7,8]),!r.bootstrap)throw Error("A bootstrap script was not defined on the brew request.");return n.postMessage(r,r.data?[r.data]:void 0),s=new Promise(function(t,e){o=t,i=e}),n.onmessage=function(r){var s=r.data.result,a=r.data;if(l.workerCommandMap[s])try{var u={command:t,postMessageId:e,worker:n,workerCommand:s};l.workerCommandMap[s].call(n,o,i,a,u)}catch(t){i(t)}else{var c=new Error("Unknown or unsupported worker command: "+s);i(c)}},a=5e3,"number"==typeof r.timeout&&(a=r.timeout),u=void 0,a?[4,ProxyUtil.timeout(s,a,"A timeout occurred while invoking the Brew. ("+a+"ms)")]:[3,3];case 2:return u=p.sent(),[3,5];case 3:return[4,s];case 4:u=p.sent(),p.label=5;case 5:return c={$$command:t,$$postMessageId:e,$$result:"success",data:u.data,transferrableData:u.transferrableData},ProxyUtil.postMessage(c),[3,8];case 6:return f=p.sent(),ProxyUtil.postMessageError(t,e,f),[3,8];case 7:return n&&(n.onmessage=function(t){},n.terminate()),[7];case 8:return[2]}})})},HostWebProxy}();window.docReady(function(){var t=new HostWebProxy;window.addEventListener("error",t.errorHandler),window.addEventListener("message",t.messageHandler)})},function(t,e,r){t.exports=function(){return r(10)('!function(t){function r(e){if(n[e])return n[e].exports;var o=n[e]={i:e,l:!1,exports:{}};return t[e].call(o.exports,o,o.exports,r),o.l=!0,o.exports}var n={};r.m=t,r.c=n,r.d=function(t,n,e){r.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:e})},r.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(n,"a",n),n},r.o=function(t,r){return Object.prototype.hasOwnProperty.call(t,r)},r.p="/",r(r.s=11)}([function(t,r,n){var e=n(3),o=e(Object,"create");t.exports=o},function(t,r,n){function e(t,r){for(var n=t.length;n--;)if(o(t[n][0],r))return n;return-1}var o=n(10);t.exports=e},function(t,r,n){function e(t,r){var n=t.__data__;return o(r)?n["string"==typeof r?"string":"hash"]:n.map}var o=n(49);t.exports=e},function(t,r,n){function e(t,r){var n=i(t,r);return o(n)?n:void 0}var o=n(17),i=n(26);t.exports=e},function(t,r,n){var e=n(5),o=e.Symbol;t.exports=o},function(t,r,n){var e=n(19),o="object"==typeof self&&self&&self.Object===Object&&self,i=e||o||Function("return this")();t.exports=i},function(t,r){function n(t){var r=typeof t;return null!=t&&("object"==r||"function"==r)}t.exports=n},function(t,r){var n=Array.isArray;t.exports=n},function(t,r,n){function e(t){return"symbol"==typeof t||i(t)&&o(t)==s}var o=n(9),i=n(29),s="[object Symbol]";t.exports=e},function(t,r,n){function e(t){return null==t?void 0===t?u:a:c&&c in Object(t)?i(t):s(t)}var o=n(4),i=n(21),s=n(22),a="[object Null]",u="[object Undefined]",c=o?o.toStringTag:void 0;t.exports=e},function(t,r){function n(t,r){return t===r||t!==t&&r!==r}t.exports=n},function(t,r,n){var e=this&&this.__awaiter||function(t,r,n,e){return new(n||(n=Promise))(function(o,i){function s(t){try{u(e.next(t))}catch(t){i(t)}}function a(t){try{u(e.throw(t))}catch(t){i(t)}}function u(t){t.done?o(t.value):new n(function(r){r(t.value)}).then(s,a)}u((e=e.apply(t,r||[])).next())})},o=this&&this.__generator||function(t,r){function n(t){return function(r){return e([t,r])}}function e(n){if(o)throw new TypeError("Generator is already executing.");for(;u;)try{if(o=1,i&&(s=i[2&n[0]?"return":n[0]?"throw":"next"])&&!(s=s.call(i,n[1])).done)return s;switch(i=0,s&&(n=[0,s.value]),n[0]){case 0:case 1:s=n;break;case 4:return u.label++,{value:n[1],done:!1};case 5:u.label++,i=n[1],n=[0];continue;case 7:n=u.ops.pop(),u.trys.pop();continue;default:if(s=u.trys,!(s=s.length>0&&s[s.length-1])&&(6===n[0]||2===n[0])){u=0;continue}if(3===n[0]&&(!s||n[1]>s[0]&&n[1]<s[3])){u.label=n[1];break}if(6===n[0]&&u.label<s[1]){u.label=s[1],s=n;break}if(s&&u.label<s[2]){u.label=s[2],u.ops.push(n);break}s[2]&&u.ops.pop(),u.trys.pop();continue}n=r.call(t,u)}catch(t){n=[6,t],i=0}finally{o=s=0}if(5&n[0])throw n[1];return{value:n[0]?n[1]:void 0,done:!0}}var o,i,s,a,u={label:0,sent:function(){if(1&s[0])throw s[1];return s[1]},trys:[],ops:[]};return a={next:n(0),throw:n(1),return:n(2)},"function"==typeof Symbol&&(a[Symbol.iterator]=function(){return this}),a},i=n(12),s=function(){function t(){}return t.flatten=function(t){var r={},n=function(t,e){for(var o=0,i=Object.keys(t);o<i.length;o++){var s=i[o],a=t[s],u=Array.isArray(a),c=Object.prototype.toString.call(a),f=a instanceof ArrayBuffer,p="[object Object]"===c||"[object Array]"===c,l=e?e+"."+s:s;if(!u&&!f&&p&&Object.keys(a).length)return n(a,l);r[l]=a}};return n(t),r},t}(),a=function(){function t(t,r){this.context=t,this.request=r,this.bootstrap.bind(this),this.initialize=this.initialize.bind(this),this.postMessageError=this.postMessageError.bind(this)}return t.prototype.bootstrap=function(){if(this.request.bootstrap&&Array.isArray(this.request.bootstrap))for(var t=0,r=this.request.bootstrap;t<r.length;t++){var n=r[t];try{var e=eval;e(n)}catch(t){throw this.postMessageError(t),t}}},t.prototype.initialize=function(){return e(this,void 0,void 0,function(){var t,r,n,e,a,u,c,f,p,l,h=this;return o(this,function(o){switch(o.label){case 0:return o.trys.push([0,7,,8]),t=new Promise(function(t,r){try{h.context.requirejs([h.request.entryPointId],t,function(t){r(t instanceof Error?t:new Error(t))})}catch(t){r(t)}}),[4,t];case 1:r=o.sent(),n=s.flatten(r),e=0,a=Object.keys(n),o.label=2;case 2:if(!(e<a.length))return[3,6];if(u=a[e],"function"!=typeof(c=n[u]))return[3,3];try{self.spLookoutInstance.isClass(c)?i(r,u,c.name):i(r,u,"function")}catch(t){i(r,u,t)}return[3,5];case 3:return f=i,p=[r,u],[4,Promise.resolve(c)];case 4:f.apply(void 0,p.concat([o.sent()])),o.label=5;case 5:return e++,[3,2];case 6:return this.context.postMessage({result:"success",data:r}),[3,8];case 7:throw l=o.sent(),this.postMessageError(l),l;case 8:return[2]}})})},t.prototype.postMessageError=function(t){return e(this,void 0,void 0,function(){var r,n,e,i;return o(this,function(o){if(r={result:"error",message:t,type:Object.prototype.toString.call(t),context:"worker"},"object"==typeof t){for(r.name=t.name,r.message=t.message,r.stack=t.stack,n=0,e=Object.keys(t);n<e.length;n++)i=e[n],r[i]=t[i];r.originalError&&(r.originalError=JSON.stringify(r.originalError))}return this.context.postMessage(r),[2]})})},t}(),u=self.Request;self.Request=function(t,r){return t||(t=self.location.origin),new u(t,r)},onmessage=function(t){var r=t.data,n=self.processor=new a(self,r);n.bootstrap(),n.initialize()},onerror=function(t){var r={result:"error",message:t};t instanceof ErrorEvent&&(r.data={message:t.message,filename:t.filename,lineno:t.lineno,colno:t.colno}),self.postMessage(r)}},function(t,r,n){function e(t,r,n){return null==t?t:o(t,r,n)}var o=n(13);t.exports=e},function(t,r,n){function e(t,r,n,e){if(!a(t))return t;r=i(r,t);for(var c=-1,f=r.length,p=f-1,l=t;null!=l&&++c<f;){var h=u(r[c]),v=n;if(c!=p){var y=l[h];v=e?e(y,h,l):void 0,void 0===v&&(v=a(y)?y:s(r[c+1])?[]:{})}o(l,h,v),l=l[h]}return t}var o=n(14),i=n(27),s=n(56),a=n(6),u=n(57);t.exports=e},function(t,r,n){function e(t,r,n){var e=t[r];a.call(t,r)&&i(e,n)&&(void 0!==n||r in t)||o(t,r,n)}var o=n(15),i=n(10),s=Object.prototype,a=s.hasOwnProperty;t.exports=e},function(t,r,n){function e(t,r,n){"__proto__"==r&&o?o(t,r,{configurable:!0,enumerable:!0,value:n,writable:!0}):t[r]=n}var o=n(16);t.exports=e},function(t,r,n){var e=n(3),o=function(){try{var t=e(Object,"defineProperty");return t({},"",{}),t}catch(t){}}();t.exports=o},function(t,r,n){function e(t){return!(!s(t)||i(t))&&(o(t)?v:c).test(a(t))}var o=n(18),i=n(23),s=n(6),a=n(25),u=/[\\\\^$.*+?()[\\]{}|]/g,c=/^\\[object .+?Constructor\\]$/,f=Function.prototype,p=Object.prototype,l=f.toString,h=p.hasOwnProperty,v=RegExp("^"+l.call(h).replace(u,"\\\\$&").replace(/hasOwnProperty|(function).*?(?=\\\\\\()| for .+?(?=\\\\\\])/g,"$1.*?")+"$");t.exports=e},function(t,r,n){function e(t){if(!i(t))return!1;var r=o(t);return r==a||r==u||r==s||r==c}var o=n(9),i=n(6),s="[object AsyncFunction]",a="[object Function]",u="[object GeneratorFunction]",c="[object Proxy]";t.exports=e},function(t,r,n){(function(r){var n="object"==typeof r&&r&&r.Object===Object&&r;t.exports=n}).call(r,n(20))},function(t,r){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(n=window)}t.exports=n},function(t,r,n){function e(t){var r=s.call(t,u),n=t[u];try{t[u]=void 0;var e=!0}catch(t){}var o=a.call(t);return e&&(r?t[u]=n:delete t[u]),o}var o=n(4),i=Object.prototype,s=i.hasOwnProperty,a=i.toString,u=o?o.toStringTag:void 0;t.exports=e},function(t,r){function n(t){return o.call(t)}var e=Object.prototype,o=e.toString;t.exports=n},function(t,r,n){function e(t){return!!i&&i in t}var o=n(24),i=function(){var t=/[^.]+$/.exec(o&&o.keys&&o.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}();t.exports=e},function(t,r,n){var e=n(5),o=e["__core-js_shared__"];t.exports=o},function(t,r){function n(t){if(null!=t){try{return o.call(t)}catch(t){}try{return t+""}catch(t){}}return""}var e=Function.prototype,o=e.toString;t.exports=n},function(t,r){function n(t,r){return null==t?void 0:t[r]}t.exports=n},function(t,r,n){function e(t,r){return o(t)?t:i(t,r)?[t]:s(a(t))}var o=n(7),i=n(28),s=n(30),a=n(53);t.exports=e},function(t,r,n){function e(t,r){if(o(t))return!1;var n=typeof t;return!("number"!=n&&"symbol"!=n&&"boolean"!=n&&null!=t&&!i(t))||(a.test(t)||!s.test(t)||null!=r&&t in Object(r))}var o=n(7),i=n(8),s=/\\.|\\[(?:[^[\\]]*|(["\'])(?:(?!\\1)[^\\\\]|\\\\.)*?\\1)\\]/,a=/^\\w*$/;t.exports=e},function(t,r){function n(t){return null!=t&&"object"==typeof t}t.exports=n},function(t,r,n){var e=n(31),o=/^\\./,i=/[^.[\\]]+|\\[(?:(-?\\d+(?:\\.\\d+)?)|(["\'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2)\\]|(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))/g,s=/\\\\(\\\\)?/g,a=e(function(t){var r=[];return o.test(t)&&r.push(""),t.replace(i,function(t,n,e,o){r.push(e?o.replace(s,"$1"):n||t)}),r});t.exports=a},function(t,r,n){function e(t){var r=o(t,function(t){return n.size===i&&n.clear(),t}),n=r.cache;return r}var o=n(32),i=500;t.exports=e},function(t,r,n){function e(t,r){if("function"!=typeof t||null!=r&&"function"!=typeof r)throw new TypeError(i);var n=function(){var e=arguments,o=r?r.apply(this,e):e[0],i=n.cache;if(i.has(o))return i.get(o);var s=t.apply(this,e);return n.cache=i.set(o,s)||i,s};return n.cache=new(e.Cache||o),n}var o=n(33),i="Expected a function";e.Cache=o,t.exports=e},function(t,r,n){function e(t){var r=-1,n=null==t?0:t.length;for(this.clear();++r<n;){var e=t[r];this.set(e[0],e[1])}}var o=n(34),i=n(48),s=n(50),a=n(51),u=n(52);e.prototype.clear=o,e.prototype.delete=i,e.prototype.get=s,e.prototype.has=a,e.prototype.set=u,t.exports=e},function(t,r,n){function e(){this.size=0,this.__data__={hash:new o,map:new(s||i),string:new o}}var o=n(35),i=n(41),s=n(47);t.exports=e},function(t,r,n){function e(t){var r=-1,n=null==t?0:t.length;for(this.clear();++r<n;){var e=t[r];this.set(e[0],e[1])}}var o=n(36),i=n(37),s=n(38),a=n(39),u=n(40);e.prototype.clear=o,e.prototype.delete=i,e.prototype.get=s,e.prototype.has=a,e.prototype.set=u,t.exports=e},function(t,r,n){function e(){this.__data__=o?o(null):{},this.size=0}var o=n(0);t.exports=e},function(t,r){function n(t){var r=this.has(t)&&delete this.__data__[t];return this.size-=r?1:0,r}t.exports=n},function(t,r,n){function e(t){var r=this.__data__;if(o){var n=r[t];return n===i?void 0:n}return a.call(r,t)?r[t]:void 0}var o=n(0),i="__lodash_hash_undefined__",s=Object.prototype,a=s.hasOwnProperty;t.exports=e},function(t,r,n){function e(t){var r=this.__data__;return o?void 0!==r[t]:s.call(r,t)}var o=n(0),i=Object.prototype,s=i.hasOwnProperty;t.exports=e},function(t,r,n){function e(t,r){var n=this.__data__;return this.size+=this.has(t)?0:1,n[t]=o&&void 0===r?i:r,this}var o=n(0),i="__lodash_hash_undefined__";t.exports=e},function(t,r,n){function e(t){var r=-1,n=null==t?0:t.length;for(this.clear();++r<n;){var e=t[r];this.set(e[0],e[1])}}var o=n(42),i=n(43),s=n(44),a=n(45),u=n(46);e.prototype.clear=o,e.prototype.delete=i,e.prototype.get=s,e.prototype.has=a,e.prototype.set=u,t.exports=e},function(t,r){function n(){this.__data__=[],this.size=0}t.exports=n},function(t,r,n){function e(t){var r=this.__data__,n=o(r,t);return!(n<0)&&(n==r.length-1?r.pop():s.call(r,n,1),--this.size,!0)}var o=n(1),i=Array.prototype,s=i.splice;t.exports=e},function(t,r,n){function e(t){var r=this.__data__,n=o(r,t);return n<0?void 0:r[n][1]}var o=n(1);t.exports=e},function(t,r,n){function e(t){return o(this.__data__,t)>-1}var o=n(1);t.exports=e},function(t,r,n){function e(t,r){var n=this.__data__,e=o(n,t);return e<0?(++this.size,n.push([t,r])):n[e][1]=r,this}var o=n(1);t.exports=e},function(t,r,n){var e=n(3),o=n(5),i=e(o,"Map");t.exports=i},function(t,r,n){function e(t){var r=o(this,t).delete(t);return this.size-=r?1:0,r}var o=n(2);t.exports=e},function(t,r){function n(t){var r=typeof t;return"string"==r||"number"==r||"symbol"==r||"boolean"==r?"__proto__"!==t:null===t}t.exports=n},function(t,r,n){function e(t){return o(this,t).get(t)}var o=n(2);t.exports=e},function(t,r,n){function e(t){return o(this,t).has(t)}var o=n(2);t.exports=e},function(t,r,n){function e(t,r){var n=o(this,t),e=n.size;return n.set(t,r),this.size+=n.size==e?0:1,this}var o=n(2);t.exports=e},function(t,r,n){function e(t){return null==t?"":o(t)}var o=n(54);t.exports=e},function(t,r,n){function e(t){if("string"==typeof t)return t;if(s(t))return i(t,e)+"";if(a(t))return f?f.call(t):"";var r=t+"";return"0"==r&&1/t==-u?"-0":r}var o=n(4),i=n(55),s=n(7),a=n(8),u=1/0,c=o?o.prototype:void 0,f=c?c.toString:void 0;t.exports=e},function(t,r){function n(t,r){for(var n=-1,e=null==t?0:t.length,o=Array(e);++n<e;)o[n]=r(t[n],n,t);return o}t.exports=n},function(t,r){function n(t,r){return!!(r=null==r?e:r)&&("number"==typeof t||o.test(t))&&t>-1&&t%1==0&&t<r}var e=9007199254740991,o=/^(?:0|[1-9]\\d*)$/;t.exports=n},function(t,r,n){function e(t){if("string"==typeof t||o(t))return t;var r=t+"";return"0"==r&&1/t==-i?"-0":r}var o=n(8),i=1/0;t.exports=e}]);',r.p+"HostWebWorker.js")}},function(t,e){var r=window.URL||window.webkitURL;t.exports=function(t,e){try{try{var n;try{var o=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder;n=new o,n.append(t),n=n.getBlob()}catch(e){n=new Blob([t])}return new Worker(r.createObjectURL(n))}catch(e){return new Worker("data:application/javascript,"+encodeURIComponent(t))}}catch(t){if(!e)throw Error("Inline worker is not supported");return new Worker(e)}}}]);</script></body>

    </html>