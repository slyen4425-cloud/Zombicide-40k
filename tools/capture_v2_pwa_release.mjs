// GenSRPG Pages is the ONE build authority for both stable and Capture Preview PWAs.
// The preview source stays immutable; the installed preview RELEASE is the
// current Pages commit SHA, not the older, separately pinned Capture author SHA.
import {stampShellForCommit} from './version_pwa_release_worker.mjs';

export function releasePreviewPwaForCommit(sourceWorker,sourceHtml,releaseSha){
  if(typeof releaseSha!=='string'||!/^[a-f0-9]{40}$/.test(releaseSha))
    throw Error('Invalid immutable Pages release commit SHA');
  if(typeof sourceWorker!=='string')throw Error('Invalid preview worker source');
  const versions=[...sourceWorker.matchAll(/^const CACHE_NAME = "gensrpg-cache-[^"]+";$/gm)];
  if(versions.length!==1)throw Error('Exactly one source PWA cache owner required');
  const rootCleanup='name.startsWith("gensrpg-cache-")&&name!==CACHE_NAME';
  if(sourceWorker.split(rootCleanup).length!==2)
    throw Error('Unknown root cache cleanup authority');
  const cacheName='gensrpg-preview-capture-v2-'+releaseSha.slice(0,12);
  const scoped=sourceWorker
    .replace(versions[0][0],'const CACHE_NAME = "'+cacheName+'";')
    .replace(rootCleanup,'name.startsWith("gensrpg-preview-capture-v2-")&&name!==CACHE_NAME');
  if(scoped===sourceWorker||scoped.includes(rootCleanup))
    throw Error('Preview cache isolation failed');
  // The early skipWaiting() call must NOT be awaited by install.waitUntil:
  // Chromium may resolve that promise only after activation, while activation
  // itself waits for the installation lifetime to finish. Awaiting it creates
  // a cyclic lifecycle dependency and leaves the update permanently waiting.
  // Keep ONLY precache in waitUntil, request activation non-blockingly before
  // and after precache (same worker / cache owner, no second authority).
  const oldInstall='self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{for(const file of CORE_FILES)await cacheFresh(cache,file)}))});';
  const activatedInstall='self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);for(const file of CORE_FILES)await cacheFresh(cache,file);self.skipWaiting()})())});';
  if(scoped.split(oldInstall).length!==2)
    throw Error('Unknown preview install lifecycle; fail closed');
  const lifecycleWorker=scoped.replace(oldInstall,activatedInstall);
  // Stale worker fetches can complete AFTER a fresh worker has activated and
  // deleted their old cache. An unconditional caches.open(CACHE_NAME) would
  // resurrect the retired namespace, even while the new client is current.
  // Cache only when this worker's namespace still exists. Install pre-cache
  // still creates the current namespace; unrelated root caches are untouched.
  const rawWrite='const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())';
  if(lifecycleWorker.split(rawWrite).length!==4)
    throw Error('Unknown service worker fetch cache ownership; refuse blind patch');
  const safeWrite='if((await caches.keys()).includes(CACHE_NAME)){'+rawWrite+'}';
  // Do not bind skipWaiting() to an ExtendableMessage event lifetime:
  // Chromium may resolve that promise only once the replacement activates,
  // while the still-running message event blocks the replacement. That
  // lifecycle cycle leaves a fully installed worker waiting indefinitely.
  // The ONE canonical worker already invokes skipWaiting() on install, and
  // the shell additionally notifies already installed waiting candidates.
  // Keep this native message handler non-blocking (same SW, no extra owner).
  const oldMessage='self.addEventListener("message",event=>{if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting()});';
  const existingWorker=lifecycleWorker.replaceAll(rawWrite,safeWrite);
  if(existingWorker.split(oldMessage).length!==2)
    throw Error('Preview worker activation message contract changed');
  // The shell checks for an update at launch. Keeping a navigation event in
  // the retiring worker alive until its own registration.update() settles
  // can leave an installed replacement waiting behind that navigation.
  const navigationUpdate='event.waitUntil(self.registration.update().catch(()=>{}));';
  if(existingWorker.split(navigationUpdate).length!==2)
    throw Error('Unknown preview navigation update owner');
  const worker=existingWorker.replace(navigationUpdate,'');
  // The already-existing update checker compares these two source markers.
  // Stamp both in the published preview HTML, not in the immutable source.
  const html=stampShellForCommit(sourceHtml,releaseSha);
  return Object.freeze({cacheName,worker,html});
}


/** Reuse the existing Shell service-worker registration; no extra controller.
 * The old UI surfaced a button when a new worker was WAITING. Preview V2
 * instead activates it automatically, leaving an active session's DOM intact
 * until the next normal navigation/reopen (network-first documents).
 */
export function enableAutomaticPreviewActivation(sourceHtml){
  if(typeof sourceHtml!=='string')throw Error('Invalid preview PWA Shell');
  // Only the generated Capture preview's existing native registration changes.
  // Inspect reg.installing too: when register() resolves, updatefound may
  // already have fired. The waiting worker must never require user interaction.
  const legacy=`      await reg.update();

      if(reg.waiting){
        z40kWaitingWorker=reg.waiting;
        z40kShowUpdateBanner();
      }

      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed' && navigator.serviceWorker.controller){
            z40kWaitingWorker=worker;
            z40kShowUpdateBanner();
          }
        });
      });`;
  const automatic=`      // One existing registration; handle both workers discovered BEFORE
      // and AFTER the browser's updatefound event without polling/reloading.
      const observedCaptureWorkers=new Set();
      const activateCaptureCandidate=worker=>{
        if(!worker||worker===reg.active||observedCaptureWorkers.has(worker))return;
        observedCaptureWorkers.add(worker);
        const requestActivation=()=>{
          if(worker.state==='installed'){
            z40kWaitingWorker=worker;
            worker.postMessage({type:'SKIP_WAITING'});
          }
        };
        worker.addEventListener('statechange',requestActivation);
        requestActivation();
      };
      if(reg.waiting){
        z40kWaitingWorker=reg.waiting;
        reg.waiting.postMessage({type:'SKIP_WAITING'});
      }
      activateCaptureCandidate(reg.installing);
      reg.addEventListener('updatefound',()=>activateCaptureCandidate(reg.installing));
      void reg.update().then(()=>{
        // update() may resolve after a worker became WAITING, even if the
        // page missed its earlier updatefound transition.
        if(reg.waiting){
          z40kWaitingWorker=reg.waiting;
          reg.waiting.postMessage({type:'SKIP_WAITING'});
        }
        activateCaptureCandidate(reg.installing);
      }).catch(()=>{});`;
  if(sourceHtml.split(legacy).length!==2)
    throw Error('Preview PWA registration seam changed; fail closed');
  return sourceHtml.replace(legacy,automatic);
}
