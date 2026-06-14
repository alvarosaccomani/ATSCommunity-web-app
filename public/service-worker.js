const CACHE_NAME = 'ats-community-v1.0';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker y realizar pre-cacheo de recursos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-cacheando App Shell...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el Service Worker y limpiar cachés obsoletas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Limpiando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. Omitir peticiones de API local, Websockets de Socket.io y desarrollo en caliente
  if (
    requestUrl.pathname.startsWith('/api') || 
    event.request.url.includes('socket.io') ||
    requestUrl.hostname === 'localhost' && requestUrl.port === '4200' && requestUrl.pathname.includes('ng-cli-ws')
  ) {
    return; // Pasa directo a la red (sin interceptar)
  }

  // 2. Manejo de navegación SPA (rutas virtuales de Angular)
  // Si falla la red al intentar cargar una página, servimos index.html desde la caché
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(err => {
        console.log('[Service Worker] Navegación fallida (offline). Retornando index.html...');
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 3. Estrategia Stale-While-Revalidate para recursos estáticos (JS, CSS, imágenes, etc.)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Retornamos el recurso cacheado de inmediato
        // E iniciamos una petición de red en segundo plano para actualizar la caché
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Falla silenciosa si no hay red para la actualización
          });

        return cachedResponse;
      }

      // Si no está en caché, va a la red e intenta guardarlo en caché para la próxima vez
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
