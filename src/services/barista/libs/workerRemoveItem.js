(function () {
    return function (resolveWorker, rejectWorker, eventData, args) {
        window.localforage.removeItem(eventData.key)
            .then(function (item) {
                args.worker.postMessage({});
            }, function (err) {
                rejectWorker(err);
            });
    };
})();