const CACHE_NAME = "gensrpg-cache-16.79.01-stat-service";
// gensrpg-deploy-16.79.01-stat-service
// gensrpg-publish-trigger-16.79.01
// Compatibility markers kept for existing deployment/regression guards:
// gensrpg-cache-16.78.40-authored-movement
// gensrpg-cache-16.78.72-perceptual-actor-scale
// gensrpg-cache-16.78.79-generic-custom-stats
// gensrpg-cache-16.78.80-stat-rule-links-help
// gensrpg-cache-16.78.81-custom-stat-effects
// gensrpg-cache-16.78.82-rpg-rule-unification
// gensrpg-cache-16.78.83-ui-freeze-rollback
// gensrpg-cache-16.78.84-safe-editor-only
// gensrpg-cache-16.78.85-equipment-ability-runtime
// gensrpg-cache-16.78.86-ui-freeze-rollback
// gensrpg-cache-16.78.87-generic-stat-links
// gensrpg-cache-16.78.88-custom-stat-ui
// gensrpg-cache-16.78.89-custom-stat-runtime-profile
// gensrpg-cache-16.78.90-native-stat-grid
// gensrpg-cache-16.78.91-current-hero-stat-grid
// gensrpg-cache-16.78.92-complete-custom-stat-cards
// gensrpg-cache-16.78.93-lexical-profile-stat-grid
// gensrpg-cache-16.78.94-active-rpg-profile-stats
// gensrpg-cache-16.78.95-custom-stat-authority
// gensrpg-cache-16.78.96-unified-dynamic-stats
// gensrpg-cache-16.78.97-canonical-stat-registry
// gensrpg-cache-16.78.98-stat-talent-cleanup
// gensrpg-cache-16.79.00-intermode-safety

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
  "./assets/dungeon/dungeon-authored-cache-visual-167852.js",
  "./assets/dungeon/dungeon-source-render-stability-167877.js",
  "./assets/dungeon/dungeon-enemy-target-randomizer-167878.js",
  "./assets/dungeon/creatures/dng_wall_block.jpg",
  "./assets/dungeon/creatures/dng_floor_stone_01.png",
  "./assets/dungeon/creatures/dng_floor_cave_01.png",
  "./assets/dungeon/creatures/dng_floor_forest_01.png",
  "./assets/dungeon/creatures/dng_floor_ice_01.png",
  "./assets/dungeon/creatures/dng_floor_lava_01.png",
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
  "./assets/gensrpg/gens-intermode-safety-167900.js",
  "./assets/gensrpg/gens-multiplayer-entry-167831.js",
  "./assets/gensrpg/gens-ui-recovery-167843.js",
  "./assets/gensrpg/gens-custom-stats-167881.js",
  "./assets/gensrpg/gens-stat-rules-help-167880.js",
  "./assets/gensrpg/gens-stat-help-extension-167881.js",
  "./assets/gensrpg/gens-custom-stat-runtime-profile-167889.js",
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

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    for(const file of CORE_FILES)await cacheFresh(cache,file);
  }));
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const cacheNames=await caches.keys();
    await Promise.all(cacheNames.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

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

  if(request.destination==="script"||request.destination==="style"||/\.(?:js|css)$/i.test(url.pathname)){
    event.respondWith(networkFirst(request));
    return;
  }

  if(request.destination==="manifest"||request.destination==="audio"||/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)||url.pathname.includes("/assets/dungeon/")||url.pathname.includes("/assets/gensrpg/")){
    event.respondWith(networkFirst(request));
    return;
  }

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