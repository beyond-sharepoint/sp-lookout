(function (that) {
    const flatten = function (target) {
        const delimiter = '.';
        const output = {};

        const step = function (object, prev) {
            for (const key of Object.keys(object)) {
                const value = object[key];
                const isArray = Array.isArray(value);
                const type = Object.prototype.toString.call(value);
                const isBuffer = value instanceof ArrayBuffer;
                const isObject = (
                    type === '[object Object]' ||
                    type === '[object Array]'
                );

                const newKey = prev ?
                    prev + delimiter + key :
                    key;

                if (!isArray && !isBuffer && isObject && Object.keys(value).length) {
                    return step(value, newKey);
                }

                output[newKey] = value;
            }
        };

        step(target);
        return output;
    }

    const unflatten = function (target, opts) {
        opts = opts || {};

        const delimiter = opts.delimiter || '.';
        const overwrite = opts.overwrite || false;
        const result = {};

        const isbuffer = target instanceof ArrayBuffer;
        if (isbuffer || Object.prototype.toString.call(target) !== '[object Object]') {
            return target;
        }

        // safely ensure that the key is
        // an integer.
        const getkey = function(key) {
            const parsedKey = Number(key);

            return (
                    isNaN(parsedKey) ||
                    key.indexOf('.') !== -1 ||
                    opts.object
                ) ? key :
                parsedKey;
        };

        Object.keys(target).forEach(function (key) {
            const split = key.split(delimiter);
            let key1 = getkey(split.shift());
            let key2 = getkey(split[0]);
            let recipient = result;

            while (key2 !== undefined) {
                const type = Object.prototype.toString.call(recipient[key1]);
                const isobject = (
                    type === '[object Object]' ||
                    type === '[object Array]'
                );

                // do not write over falsey, non-undefined values if overwrite is false
                if (!overwrite && !isobject && typeof recipient[key1] !== 'undefined') {
                    return;
                }

                if ((overwrite && !isobject) || (!overwrite && recipient[key1] == null)) {
                    recipient[key1] = (
                        typeof key2 === 'number' &&
                        !opts.object ? [] : {}
                    );
                }

                recipient = recipient[key1];
                if (split.length > 0) {
                    key1 = getkey(split.shift());
                    key2 = getkey(split[0]);
                }
            }

            // unflatten again for 'messy objects'
            recipient[key1] = unflatten(target[key], opts);
        })

        return result;
    }

    if (!requirejs) {
        throw Error('RequireJS was not found.');
    }

    if (that.processor.request.requireConfig) {
        requirejs.config(that.processor.request.requireConfig);
    }

    //Define the requirejs errorhandler.
    requirejs.onError = that.processor.postMessageError;

    //Redefine brew in the worker to use requirejs.
    that.processor.brew = function () {
        const evalPromise = new Promise(function (resolve, reject) {
            try {
                that.requirejs([that.processor.request.entryPointId], resolve, function (err) {
                    if (err instanceof Error) {
                        reject(err);
                    } else {
                        reject(new Error(err));
                    }
                });
            } catch (ex) {
                reject(ex);
            }
        });

        return evalPromise;
    }

    //Redefine process result to better output the result.
    that.processor.processResult = function (requireResult) {
        if (typeof requireResult === 'undefined' || requireResult === null) {
            return requireResult;
        }

        const promises = [];
        //So, to make it easier for the end user, and to avoid 'xxx could not be cloned' messages,
        //let's go through and invoke functions and resolve any promises that we encounter.
        const resultPaths = flatten(requireResult);
        for (const path of Object.keys(resultPaths)) {
            const value = resultPaths[path];
            if (typeof value === 'function') {
                try {
                    if (self.spLookoutInstance.isClass(value)) {
                        resultPaths[path] = value.name;
                    } else {
                        resultPaths[path] = 'function';
                    }
                } catch (ex) {
                    resultPaths[path] = ex;
                }
            } else {
                const promise = Promise.resolve(value)
                    .then(function (result) {
                        resultPaths[path] = result;
                    })
                    .catch(function (err) {
                        resultPaths[path] = err;
                    });

                promises.push(promise);
            }
        }

        return Promise.all(promises).then(function () {
            return unflatten(resultPaths);
        });
    }
})(this)