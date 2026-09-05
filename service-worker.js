const CACHE_NAME = "gensrpg-cache-16.78.44-authored-content";
// Compatibility marker for the previous UI recovery guard: gensrpg-cache-16.78.43-ui-recovery
// Compatibility marker kept for the existing V16.78.40 deployment guard:
// gensrpg-cache-16.78.40-authored-movement

const CORE_FILES = [
  "./",
  "./index.html",
  "./assets/dungeon/dungeon-core-317.js",
  "./assets/dungeon/dungeon-core-318.js",
  "./assets/dungeon/dungeon-large-room-support-167834.js",
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
  "./assets/dungeon/dungeon-authored-runtime-167839.js",
  "./assets/dungeon/dungeon-equipment-ui.js",
  "./assets/dungeon/dungeon-equipment-hotfix-167817.js",
  "./assets/dungeon/dungeon-set-editor-167818.js",
  "./assets/gensrpg/gens-world-summary-167820.js",
  "./assets/gensrpg/gens-multiplayer-entry-167831.js",
  "./assets/gensrpg/gens-ui-recovery-167843.js",
  "./manifest.json"
];

async function cacheFresh(cache,file){
  try{
    const url=new URL(file,self.registration.scope);
    const request=new Request(url.href,{cache:"reload"});
    const response=await fetch(request);
    if(response&&response.ok)await cache.put(request,response.clone());
  }catch(error){
    console.warn("Impossible de mettre en cache :",file);
  }
}

async function networkFirst(request){
  try{
    const fresh=await fetch(request,{cache:"no-store"});
    if(fresh&&fresh.ok){
      const cache=await caches.open(CACHE_NAME);
      await cache.put(request,fresh.clone());
    }
    return fresh;
  }catch(error){
    return (await caches.match(request))||Response.error();
  }
}

/* =========================
   INSTALLATION
   ========================= */
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    for(const file of CORE_FILES)await cacheFresh(cache,file);
  }));
});

/* =========================
   ACTIVATION
   ========================= */
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const cacheNames=await caches.keys();
    await Promise.all(cacheNames.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

/* =========================
   MISE À JOUR IMMÉDIATE
   ========================= */
self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

/* =========================
   REQUÊTES
   ========================= */
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  /* HTML / navigation : toujours réseau d'abord. */
  if(request.mode==="navigate"||request.destination==="document"){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:"no-store"});
        if(fresh&&fresh.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())}
        return fresh;
      }catch(error){
        return (await caches.match(request))||(await caches.match("./index.html"))||Response.error();
      }
    })());
    return;
  }

  /* JS / CSS : réseau d'abord pour empêcher le mélange de versions PWA. */
  if(request.destination==="script"||request.destination==="style"||/\.(?:js|css)$/i.test(url.pathname)){
    event.respondWith(networkFirst(request));
    return;
  }

  /* Manifest, sons et assets Dungeon : réseau d'abord. */
  if(request.destination==="manifest"||request.destination==="audio"||/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)||url.pathname.includes("/assets/dungeon/")){
    event.respondWith(networkFirst(request));
    return;
  }

  /* Autres assets : cache d'abord, puis réseau. */
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const fresh=await fetch(request);
      if(fresh&&fresh.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())}
      return fresh;
    }catch(error){return Response.error()}
  })());
});