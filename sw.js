// INCREMENTA ESTE NÚMERO CADA VEZ QUE SUBAS ALGO A GITHUB
const CACHE_NAME = 'topovias-cr-v2.0.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  return self.clients.claim();
});

// Network-First: Primero consulta a GitHub sin usar la memoria intermedia
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((netRes) => {
        if (netRes && netRes.status === 200) {
          const clone = netRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return netRes;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
