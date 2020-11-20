console.log("reached sw.js");

const FILE_CACHE_NAME = "cachedFile-v1";
const DATA_CACHE_NAME = "cachedData-v1";

const urlsToCache = [
	"/",
	"/index.html",
	"/style.css",
	"/index.js",
	"/db.js",
	"/icons/icon-192x192.png",
	"/icons/icon-512x512.png"
];

self.addEventListener("install", function(event) {
	console.log("hit installation");

	// Perform install steps
	event.waitUntil(
		//waitUntil install completes and then cache files
		caches
			.open(FILE_CACHE_NAME)
			.then(function(cache) {
				console.log("Opened cache");
				return cache.addAll(urlsToCache);
			})
			.catch((error) => console.log("error caching files on install: ", error))
	);
	//forces the waiting service worker to become the active service worker.
	self.skipWaiting();
});

self.addEventListener("fetch", function(event) {
	console.log("hit fetch");
	console.log("fetch event:", event);

	// handle api caching n using cached data in indexDB
	if (event.request.url.includes("/api")) {
		console.log("hit fetch /api");

		return event.respondWith(
			caches
				.open(DATA_CACHE_NAME)
				.then((cache) => {
					return fetch(event.request)
						.then((response) => {
							if (response.status === 200) {
								cache.put(event.request.url, response.clone());
							}

							return response;
						})
						.catch((error) => {
							// network failed, use cached
							return cache.match(event.request);
						});
				})
				.catch((error) => console.log("error fetching api: ", error))
		);
	}
	event.respondWith(
		caches
			.match(event.request)
			.then(function(response) {
				// Cache hit - return response
				console.log("hit caches.match inside fetch!");

				if (response) {
					return response;
				}

				return fetch(event.request).then(function(response) {
					// Check if we received a valid response
					if (!response || response.status !== 200 || response.type !== "basic") {
						console.log("fetch response: ", response);
						return response;
					}

					// IMPORTANT: Clone the response. A response is a stream
					// and because we want the browser to consume the response
					// as well as the cache consuming the response, we need
					// to clone it so we have two streams.
					const responseToCache = response.clone();

					caches
						.open(FILE_CACHE_NAME)
						.then(function(cache) {
							cache.put(event.request, responseToCache);
						})
						.catch((error) => console.log(error));

					return response;
				});
			})
			.catch((error) => console.log("error"))
	);
});

self.addEventListener("activate", function(event) {
	console.log("hit activate");

	const cacheAllowlist = [ "pages-cache-v1", "blog-posts-cache-v1" ];

	event.waitUntil(
		//The keys() method of the Cache interface returns a Promise that resolves to an array of Cache keys.
		caches
			.keys()
			.then(function(cacheNames) {
				console.log(cacheNames);
				return Promise.all(
					cacheNames.map(function(cacheName) {
						if (cacheAllowlist.indexOf(cacheName) === -1) {
							return caches.delete(cacheName);
						}
					})
				);
			})
			.catch((error) => console.log("activation error: ", error))
	);
	// if any open clients, update to active SW
	self.clients.claim();
});
