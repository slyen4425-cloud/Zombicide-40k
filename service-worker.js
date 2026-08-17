const Z40K_SW_VERSION = 'z40k-sw-2';
const STATIC_CACHE = Z40K_SW_VERSION + '-static';
const RUNTIME_CACHE = Z40K_SW_VERSION + '-runtime';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(k => !k.startsWith(Z40K_SW_VERSION))
        .map(k => caches.delete(k))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // INDEX / HTML :
  // toujours chercher la dernière version sur GitHub en priorité.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, {
          cache: 'no-store'
        });

        if (fresh && fresh.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put('./index.html', fresh.clone());
        }

        return fresh;
      } catch (e) {
        return (
          await caches.match('./index.html')
        ) || Response.error();
      }
    })());

    return;
  }

  // Manifest :
  // priorité à la version en ligne.
  if (url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith(
      fetch(req, {
        cache: 'no-store'
      }).catch(() => caches.match(req))
    );

    return;
  }

  // Images / icônes :
  // on garde le cache pour accélérer l'application.
  if (
    req.destination === 'image' ||
    req.destination === 'font' ||
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/icons/')
  ) {
    event.respondWith((async () => {
      const cached = await caches.match(req);

      if (cached) return cached;

      const res = await fetch(req);

      if (res && res.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(req, res.clone());
      }

      return res;
    })());

    return;
  }

  // Autres fichiers :
  // réseau en priorité, cache seulement en secours.
  event.respondWith((async () => {
    try {
      const res = await fetch(req);

      if (res && res.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, res.clone());
      }

      return res;
    } catch (e) {
      return (
        await caches.match(req)
      ) || Response.error();
    }
  })());
});
