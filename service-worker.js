const CACHE_NAME =
    "neet-command-center-v2";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./app.js",

    "./firebase-cloud.js",

    "./share.html",

    "./manifest.json"

];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )

            .then(
                cache =>
                    cache.addAll(
                        FILES_TO_CACHE
                    )
            )

            .then(
                () =>
                    self.skipWaiting()
            )

        );

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(keys =>

                    Promise.all(

                        keys

                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )

                            .map(
                                key =>
                                    caches.delete(
                                        key
                                    )
                            )

                    )

                )

        );

        self.clients.claim();

    }
);


self.addEventListener(
    "fetch",
    event => {

        /*
           Firebase / external network requests
           should go directly to the network.
        */

        const url =
            new URL(
                event.request.url
            );


        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        event.respondWith(

            caches.match(
                event.request
            )

            .then(
                cached =>
                    cached ||
                    fetch(
                        event.request
                    )
            )

        );

    }
);
