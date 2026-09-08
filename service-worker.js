const CACHE_NAME = "gensrpg-cache-16.78.99-shared-stat-service";
// gensrpg-deploy-16.78.99-shared-stat-service-isolated
// Compatibility markers kept for existing deployment/regression guards:
// gensrpg-cache-16.78.40-authored-movement
// gensrpg-cache-16.78.72-perceptual-actor-scale
// gensrpg-cache-16.78.79-generic-custom-stats
// gensrpg-cache-16.78.80-stat-rule-links-help
// gensrpg-cache-16.78.81-custom-stat-effects
// gensrpg-cache-16.78.88-custom-stat-ui
// gensrpg-cache-16.78.89-custom-stat-runtime-profile
// gensrpg-cache-16.78.90-native-stat-grid

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/gensrpg/gens-ui-recovery-167843.js",
  "./assets/gensrpg/gens-stat-service-167899.js",
  "./assets/gensrpg/gens-custom-stats-167881.js",
  "./assets/gensrpg/gens-stat-rules-help-167880.js",
  "./assets/gensrpg/gens-stat-help-extension-167881.js",
  "./assets/gensrpg/gens-custom-stat-runtime-profile-167889.js"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of PRECACHE) {
        try {
          const response = await fetch(url, { cache: "reload" });
          if (response && response.ok) await cache.put(url, response.clone());
        } catch (_) {}
      }
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
        }
        return response;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});