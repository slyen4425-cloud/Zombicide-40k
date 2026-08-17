const Z40K_SW_VERSION = 'z40k-sw-3';
const STATIC_CACHE = Z40K_SW_VERSION + '-static';
const RUNTIME_CACHE = Z40K_SW_VERSION + '-runtime';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => !key.startsWith(Z40K_SW_VERSION))
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // IMPORTANT :
  // La page principale ne doit jamais rester bloquée
  // sur une ancienne version.
  if (
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('/index.html')
  ) {
    event.respondWith((async () => {
      try {
        return await fetch(req, {
          cache: 'no-store'
        });
      } catch (err) {
        return (
          await caches.match('./index.html')
        ) || Response.error();
      }
    })());

    return;
  }

  // Manifest : toujours chercher la dernière version.
  if (url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith(
      fetch(req, {
        cache: 'no-store'
      }).catch(() => caches.match(req))
    );

    return;
  }

  // Images / icônes / assets :
  // cache autorisé pour accélérer l'application.
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

      if (res?.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(req, res.clone());
      }

      return res;
    })());

    return;
  }

  // JS, CSS, Supabase, QR code, etc.
  // Réseau d'abord, cache uniquement en secours.
  event.respondWith((async () => {
    try {
      const res = await fetch(req, {
        cache: 'no-cache'
      });

      if (res?.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, res.clone());
      }

      return res;
    } catch (err) {
      return (
        await caches.match(req)
      ) || Response.error();
    }
  })());
});
