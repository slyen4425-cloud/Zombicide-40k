const CACHE_NAME = "gensrpg-cache-16.163";
const CORE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of CORE) {
        try {
          await cache.add(url);
        } catch (e) {}
      }
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names
        .filter(name => name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // HTML / navigation :
  // toujours essayer la version GitHub en premier.
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, {
          cache: "no-store"
        });

        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());

        return fresh;
      } catch (e) {
        return (
          await caches.match(request) ||
          await caches.match("./index.html") ||
          Response.error()
        );
      }
    })());

    return;
  }

  // Images / sons / manifest / autres fichiers :
  // cache d'abord, réseau si absent.
  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    try {
      const fresh = await fetch(request);

      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
      }

      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
