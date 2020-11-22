const fileCacheName = 'file-v2';
const dataCacheName = 'data-v1';

const filesToCache = [
	'/',
	'/index.html',
	'/style.css',
	'/db.js',
	'/index.js',
	'/manifest.webmanifest',
	'/icons/icon-192x192.png',
	'/icons/icon-512x512.png'
];

// install lifecycle method
self.addEventListener('install', (event) => {
	//caching files upon installation
	event.waitUntil(
		caches
			.open(fileCacheName)
			.then((cache) => {
				return cache.addAll(filesToCache);
			})
			.catch((error) => console.log('error caching files on install: ', error))
	);

	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	//check the cached file and delete outdated keys before activating new serviceworker
	event.waitUntil(
		caches
			.keys()
			.then((keyList) => {
				return Promise.all(
					keyList.map((key) => {
						// if current key does not equal current cache name, delete it
						if (key !== fileCacheName && key !== dataCacheName) {
							return caches.delete(key);
						}
					})
				);
			})
			.catch((error) => console.log('activation error: ', error))
	);

	// if any open clients, update to active SW
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	// handle api caching
	if (event.request.url.includes('/api')) {
		return event.respondWith(
			caches
				.open(dataCacheName)
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
				.catch((error) => console.log('error fetching api: ', error))
		);
	}

	event.respondWith(
		caches
			.match(event.request)
			.then((response) => {
				if (response) {
					return response;
				}

				return fetch(event.request).then((response) => {
					if (!response || !response.basic || !response.status !== 200) {
						return response;
					}

					// response is a stream, clone the reponse for both reading by browser and for caching
					const responseToCache = response.clone();

					caches
						.open(cacheName)
						.then((cache) => {
							cache.put(event.request, responseToCache);
						})
						.catch((error) => console.log(error));

					return response;
				});
			})
			.catch((error) => console.log('error'))
	);
});
