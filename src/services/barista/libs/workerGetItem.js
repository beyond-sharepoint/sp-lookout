(function () {
    return function (resolveWorker, rejectWorker, eventData, args) {
        window.localforage.getItem(eventData.key)
            .then(function (item) {
                args.worker.postMessage(item);
            }, function (err) {
                rejectWorker(err);
            });
    };
})();