const CACHE_NAME = "gensrpg-cache-16.78.33-single-adventure-selection";

const CORE_FILES = [
  "./",
  "./index.html",
  "./assets/dungeon/dungeon-core-317.js",
  "./assets/dungeon/dungeon-core-318.js",
  "./assets/dungeon/dungeon-room-creator-100.js",
  "./assets/dungeon/dungeon-room-creator-v2-167819.js",
  "./assets/dungeon/dungeon-room-creator-feedback-167821.js",
  "./assets/dungeon/dungeon-room-visual-config-167826.js",
  "./assets/dungeon/dungeon-room-visual-hotfix-167827.js",
  "./assets/dungeon/dungeon-room-template-content-167828.js",
  "./assets/dungeon/dungeon-room-grid-capture-167830.js",
  "./assets/dungeon/dungeon-room-content-ui-167831.js",
  "./assets/dungeon/dungeon-random-library-content-167832.js",
  "./assets/dungeon/dungeon-world-builder-167821.js",
  "./assets/dungeon/dungeon-room-runtime-167822.js",
  "./assets/dungeon/dungeon-world-runtime-167823.js",
  "./assets/dungeon/dungeon-world-session-bridge-167832.js",
  "./assets/dungeon/dungeon-zone-content-167824.js",
  "./assets/dungeon/dungeon-equipment-ui.js",
  "./assets/dungeon/dungeon-equipment-hotfix-167817.js",
  "./assets/dungeon/dungeon-set-editor-167818.js",
  "./assets/gensrpg/gens-world-summary-167820.js",
  "./assets/gensrpg/gens-multiplayer-entry-167831.js",
  "./manifest.json"
];

/* =========================
   INSTALLATION
   ========================= */

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of CORE_FILES) {
        try {
          await cache.add(file);
        } catch (error) {
          console.warn("Impossible de mettre en cache :", file);
        }
      }
    })
  );
});


/* =========================
   ACTIVATION
   ========================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      /* Supprime tous les anciens caches */
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );

      /* Le nouveau SW prend immédiatement le contrôle */
      await self.clients.claim();
    })()
  );
});


/* =========================
   MISE À JOUR IMMÉDIATE
   ========================= */

self.addEventListener("message", event => {
  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
    self.skipWaiting();
  }
});


/* =========================
   REQUÊTES
   ========================= */

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* Seulement les fichiers du site GenSrpG */
  if (url.origin !== self.location.origin) {
    return;
  }


  /* =====================================
     HTML / NAVIGATION
     NETWORK FIRST
     ===================================== */

  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      (async () => {
        try {
          const freshResponse = await fetch(
            request,
            {
              cache: "no-store"
            }
          );

          if (freshResponse && freshResponse.ok) {
            const cache =
              await caches.open(CACHE_NAME);

            await cache.put(
              request,
              freshResponse.clone()
            );
          }

          return freshResponse;

        } catch (error) {
          const cached =
            await caches.match(request);

          if (cached) {
            return cached;
          }

          const fallback =
            await caches.match("./index.html");

          if (fallback) {
            return fallback;
          }

          return Response.error();
        }
      })()
    );

    return;
  }


  /* =====================================
     MANIFEST
     NETWORK FIRST
     ===================================== */

  if (request.destination === "manifest") {
    event.respondWith(
      (async () => {
        try {
          const fresh =
            await fetch(
              request,
              {
                cache: "no-store"
              }
          );

          if (fresh && fresh.ok) {
            const cache =
              await caches.open(CACHE_NAME);

            await cache.put(
              request,
              fresh.clone()
            );
          }

          return fresh;

        } catch (error) {
          return (
            await caches.match(request)
          ) || Response.error();
        }
      })()
    );

    return;
  }


  /* =====================================
     SONS / AUDIO
     NETWORK FIRST
     ===================================== */

  if (
    request.destination === "audio" ||
    /\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        try {
          const fresh =
            await fetch(
              request,
              {
                cache: "no-store"
              }
            );

          if (fresh && fresh.ok) {
            const cache =
              await caches.open(CACHE_NAME);

            await cache.put(
              request,
              fresh.clone()
            );
          }

          return fresh;

        } catch (error) {
          const cached =
            await caches.match(request);

          if (cached) {
            return cached;
          }

          return Response.error();
        }
      })()
    );

    return;
  }


  /* =====================================
     IMAGES / ASSETS DUNGEON
     NETWORK FIRST
     ===================================== */

  if (
    url.pathname.includes(
      "/assets/dungeon/"
    )
  ) {
    event.respondWith(
      (async () => {
        try {
          const fresh =
            await fetch(
              request,
              {
                cache: "no-store"
              }
            );

          if (fresh && fresh.ok) {
            const cache =
              await caches.open(CACHE_NAME);

            await cache.put(
              request,
              fresh.clone()
            );
          }

          return fresh;

        } catch (error) {
          const cached =
            await caches.match(request);

          if (cached) {
            return cached;
          }

          return Response.error();
        }
      })()
    );

    return;
  }


  /* =====================================
     AUTRES ASSETS
     CACHE FIRST
     ===================================== */

  event.respondWith(
    (async () => {
      const cached =
        await caches.match(request);

      if (cached) {
        return cached;
      }

      try {
        const fresh =
          await fetch(request);

        if (fresh && fresh.ok) {
          const cache =
            await caches.open(CACHE_NAME);

          await cache.put(
            request,
            fresh.clone()
          );
        }

        return fresh;

      } catch (error) {
        return Response.error();
      }
    })()
  );
});
