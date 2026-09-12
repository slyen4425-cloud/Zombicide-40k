const CACHE_NAME = "gensrpg-cache-16.78.129-bounded-chrome-home-recovery";
// Compatibility markers kept for existing deployment guards:
// gensrpg-cache-16.78.40-authored-movement
// gensrpg-cache-16.78.72-perceptual-actor-scale
// gensrpg-cache-16.78.73-clean-dynamic-stats
// gensrpg-cache-16.78.74-restored-visuals
// gensrpg-cache-16.78.75-final-exit-hero-art
// gensrpg-cache-16.78.76-direct-final-exit
// gensrpg-cache-16.78.77-builder-events
// gensrpg-cache-16.78.78-event-popup-ambush-finish
// gensrpg-cache-16.78.79-final-popup-reinforcement
// gensrpg-cache-16.78.80-terminal-button-position
// gensrpg-cache-16.78.81-configurable-events
// gensrpg-cache-16.78.82-event-palette
// gensrpg-cache-16.78.83-event-config-click
// gensrpg-cache-16.78.84-event-highlight
// gensrpg-cache-16.78.92-stat-runtime-link
// gensrpg-cache-16.78.93-editor-cleanup
// gensrpg-cache-16.78.94-stat-engine-cleanup
// gensrpg-cache-16.78.95-native-defense-armor-movement
// gensrpg-cache-16.78.97-stability-guard
// gensrpg-cache-16.78.98-hero-art-stat-cost
// gensrpg-cache-16.78.99-sheet-ui-stability
// gensrpg-cache-16.78.100-ui-cleanup
// gensrpg-cache-16.78.101-canonical-stats-consolidation
// gensrpg-cache-16.78.102-equipment-stat-cleanup
// gensrpg-cache-16.78.103-equipment-bonus-persistence
// gensrpg-cache-16.78.104-equipment-reload-stability
// gensrpg-cache-16.78.105-enemy-stats-module
// gensrpg-cache-16.78.106-party-art-runtime-fix

const CORE_FILES = [
  "./","./index.html","./assets/dungeon/dungeon-core-317.js","./assets/dungeon/dungeon-core-318.js","./assets/dungeon/dungeon-large-room-support-167834.js","./assets/dungeon/dungeon-room-creator-100.js","./assets/dungeon/dungeon-room-creator-v2-167819.js","./assets/dungeon/dungeon-room-creator-feedback-167821.js","./assets/dungeon/dungeon-room-visual-config-167826.js","./assets/dungeon/dungeon-room-visual-hotfix-167827.js","./assets/dungeon/dungeon-authored-cache-visual-167852.js","./assets/dungeon/dungeon-authored-event-cells-167877.js","./assets/dungeon/dungeon-event-runtime-fix-167878.js","./assets/dungeon/dungeon-grid-display-recovery-167856.js","./assets/dungeon/dungeon-source-render-stability-167877.js","./assets/dungeon/dungeon-authored-final-exit-167875.js","./assets/dungeon/creatures/dng_wall_block.jpg","./assets/dungeon/creatures/dng_floor_stone_01.png","./assets/dungeon/creatures/dng_floor_cave_01.png","./assets/dungeon/creatures/dng_floor_forest_01.png","./assets/dungeon/creatures/dng_floor_ice_01.png","./assets/dungeon/creatures/dng_floor_lava_01.png","./assets/dungeon/creatures/dng_aldren.png","./assets/dungeon/creatures/dng_lyra.png","./assets/dungeon/creatures/dng_brom.png","./assets/dungeon/dungeon-room-template-content-167828.js","./assets/dungeon/dungeon-room-grid-capture-167830.js","./assets/dungeon/dungeon-room-content-ui-167831.js","./assets/dungeon/dungeon-random-library-content-167832.js","./assets/dungeon/dungeon-world-builder-167821.js","./assets/dungeon/dungeon-room-runtime-167822.js","./assets/dungeon/dungeon-world-runtime-167823.js","./assets/dungeon/dungeon-world-session-bridge-167832.js","./assets/dungeon/dungeon-zone-content-167824.js","./assets/dungeon/dungeon-authored-runtime-167839.js","./assets/dungeon/dungeon-equipment-ui.js","./assets/dungeon/dungeon-equipment-hotfix-167817.js","./assets/dungeon/dungeon-set-editor-167818.js","./assets/gensrpg/gens-world-summary-167820.js","./assets/gensrpg/gens-multiplayer-entry-167831.js","./assets/gensrpg/gens-ui-recovery-167843.js","./assets/gensrpg/gens-rpg-stats-clean-167874.js","./assets/gensrpg/gens-dungeon-hero-art-repair-167874.js","./assets/gensrpg/gens-hero-editor-dynamic-167897.js","./assets/gensrpg/gens-dungeon-hero-ingame-art-167898.js","./assets/gensrpg/gens-dungeon-sheet-art-stability-167899.js","./assets/gensrpg/gens-stat-upgrade-policy-167898.js","./assets/gensrpg/gens-dungeon-ui-cleanup-1678100.js","./assets/gensrpg/gens-equipment-stat-cleanup-1678102.js","./assets/gensrpg/gens-equipment-bonus-persistence-1678103.js","./assets/gensrpg/gens-enemy-canonical-stats-1678105.js","./assets/gensrpg/gens-canonical-detection-1678107.js","./assets/gensrpg/gens-chrome-startup-diag-1678122.js","./manifest.json"
];
async function cacheFresh(cache,file){try{const url=new URL(file,self.registration.scope);const request=new Request(url.href,{cache:"reload"});const response=await fetch(request);if(response&&response.ok)await cache.put(request,response.clone())}catch(error){console.warn("Impossible de mettre en cache :",file)}}
async function networkFirst(request){try{const fresh=await fetch(request,{cache:"no-store"});if(fresh&&fresh.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())}return fresh}catch(error){return (await caches.match(request))||Response.error()}}
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{for(const file of CORE_FILES)await cacheFresh(cache,file)}))});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const cacheNames=await caches.keys();await Promise.all(cacheNames.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)));await self.clients.claim()})())});
self.addEventListener("message",event=>{if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==="navigate"||request.destination==="document"){event.respondWith((async()=>{try{const fresh=await fetch(request,{cache:"no-store"});if(fresh&&fresh.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())}return fresh}catch(error){return (await caches.match(request))||(await caches.match("./index.html"))||Response.error()}})());return}if(request.destination==="script"||request.destination==="style"||/\.(?:js|css)$/i.test(url.pathname)){event.respondWith(networkFirst(request));return}if(request.destination==="manifest"||request.destination==="audio"||/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)||url.pathname.includes("/assets/dungeon/")||url.pathname.includes("/assets/gensrpg/")){event.respondWith(networkFirst(request));return}event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;try{const fresh=await fetch(request);if(fresh&&fresh.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())}return fresh}catch(error){return Response.error()}})())});