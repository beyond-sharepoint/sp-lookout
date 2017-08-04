(function (that) {
    if (!self.requirejs) {
        throw Error('RequireJS was not found.');
    }

    if (self.request.requireConfig) {
        self.requirejs.config(request.requireConfig);
    }

    //Define the requirejs errorhandler.
    self.requirejs.onError = self.postMessageError;
})(this)
