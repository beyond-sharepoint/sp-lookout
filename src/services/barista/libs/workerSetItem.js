(function () {
    return function (resolveWorker, rejectWorker, eventData, args) {
        window.localforage.setItem(eventData.key, eventData.value)
            .then(function (item) {
                args.worker.postMessage({
                    value: item
                });
            }, function (err) {
                rejectWorker(err);
            });
    };
})();