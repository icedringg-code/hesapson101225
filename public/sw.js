const CACHE_VERSION = 'v4-' + Date.now();

self.addEventListener('install', (event) => {
  console.log('SW Installing version:', CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW Activating version:', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        console.log('SW Deleting caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }),
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          console.log('SW Reloading client:', client.url);
          client.postMessage({ type: 'CACHE_CLEARED', version: CACHE_VERSION });
        });
      })
    ]).then(() => {
      console.log('SW Taking control');
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
