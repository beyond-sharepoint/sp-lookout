(function (that) {
    if (!requirejs) {
        throw Error('RequireJS was not found.');
    }

    if (processor.request.requireConfig) {
        requirejs.config(processor.request.requireConfig);
    }

    //Define the requirejs errorhandler.
    requirejs.onError = processor.postMessageError;
})(this)
