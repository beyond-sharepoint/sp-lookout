import * as Promise from 'bluebird';
import * as URI from 'urijs';

/**
 * Represents an object that dynamically loads resources into the current page. For instance, iframe content, javascript and css.
 */
export class ResourceLoader {
    private $document: HTMLDocument;
    private $promises: Object;

    public constructor() {
        this.$document = document;
        this.$promises = {};
    }

    /**
     * Dynamically loads an iframe pointed to the specifed source url
     * @param src The url of the iframe to load dynamically
     * @param sandbox If specified, indicates that the iframe is a sandbox with the indicated restictions.
     * @returns {*} Promise that will be resolved once the iframe has been loaded.
     */
    public loadIFrame(src: string, sandbox?: string): Promise<HTMLIFrameElement> {
        if (!src) {
            throw Error('The url of the page to load in the iframe must be specified as the first parameter.');
        }

        sandbox = sandbox || 'allow-forms allow-scripts allow-same-origin';

        src = URI(src).normalize().toString();
        return this._loader(src, () => {
            let iframe = this.$document.createElement('iframe');
            iframe.tabIndex = -1;
            iframe.style.display = 'none';
            iframe.height = '0';
            iframe.width = '0';
            iframe.frameBorder = '0';
            if (sandbox) {
                (<any>iframe).sandbox = sandbox;
            }

            iframe.src = src;

            this.$document.body.appendChild(iframe);
            return iframe;
        });
    }

    /**
     * Dynamically loads the given script
     * @param src The url of the script to load dynamically
     * @returns {*} Promise that will be resolved once the script has been loaded.
     */
    public loadScript(src: string): Promise<HTMLScriptElement> {
        if (!src) {
            throw Error('The url of the script to load must be specified as the first parameter.');
        }

        src = URI(src).normalize().toString();
        return this._loader(src, () => {
            let script = this.$document.createElement('script');

            script.src = src;

            this.$document.body.appendChild(script);
            return script;
        });
    }

    /**
     * Dynamically loads the given CSS file
     * @param href The url of the CSS to load dynamically
     * @returns {*} Promise that will be resolved once the CSS file has been loaded.
     */
    public loadCSS(href: string): Promise<HTMLLinkElement> {
        if (!href) {
            throw Error('The url of the css to load must be specified as the first parameter.');
        }

        href = URI(href).normalize().toString();
        return this._loader(href, () => {
            let style = this.$document.createElement('link');

            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = href;

            this.$document.head.appendChild(style);
            return style;
        });
    }

    /**
     * Internal method used to load resources in a generic manner.
     * @param url The url of the resource to load dynamically
     * @param createElement a custom function that performs the actual resource loading for a given dom element.
     * @returns {*} Promise that will be resolved once the resource has been loaded.
     */
    private _loader(url: string, createElement: (url: string) => HTMLElement): Promise<any> {

        if (this.$promises[url]) {
            return this.$promises[url];
        }

        let resolve, reject;
        let promise = new Promise((innerRequest, innerReject) => {
            resolve = innerRequest;
            reject = innerReject;
        });
        let element = createElement(url);

        element.onload = (<any>element).onreadystatechange = (e) => {
            if ((<any>element).readyState && (<any>element).readyState !== 'complete' && (<any>element).readyState !== 'loaded') {
                return;
            }

            resolve(element);
        };

        element.onerror = (e) => {
            reject(element);
        };

        return this.$promises[url] = promise;
    }
}
