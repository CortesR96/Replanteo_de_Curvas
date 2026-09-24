// CADA VEZ QUE SUBAS UN CAMBIO A GITHUB, CAMBIA ESTE NUMERITO (ej: v1.0.1, v1.0.2, etc.)
const CACHE_NAME = 'topocurvas-cr-v1.0.1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación: Forzar que el nuevo SW tome el control sin esperar
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activación: Borrar inmediatamente todos los cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Borrando caché antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia Network-First con fallback a Caché (Crucial para actualizar siempre que haya red)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si hay internet, actualizamos el caché en segundo plano y servimos la respuesta fresca
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red (offline en campo), cargamos del caché
        return caches.match(event.request);
      })
  );
});

// Escuchar mensaje para forzar recarga inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
