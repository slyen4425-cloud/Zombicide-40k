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
  // The pinned worker called skipWaiting() without binding its promise
  // to the install lifetime. In mobile Chromium a newly installed release
  // could remain WAITING behind its predecessor after reopening the app.
  // Request activation at the START of installation, not only after a
  // long, sequential precache. The previous release could finish install and
  // remain WAITING behind the old PWA on Android despite the new cache being
  // present. Bind skipWaiting to waitUntil so the installation lifecycle owns
  // its promise, while letting cache population finish before install settles.
  const oldInstall='self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{for(const file of CORE_FILES)await cacheFresh(cache,file)}))});';
  // Request activation immediately AND once after precache resolves. Chromium
  // can retain an installed waiting worker when the first request happened
  // before its installation settled; the late call is an idempotent safety
  // handshake owned by the SAME install event and SAME service worker.
  // No extra registration, polling, cache namespace, or user data mutation.
  const activatedInstall='self.addEventListener("install",event=>{event.waitUntil((async()=>{await self.skipWaiting();const cache=await caches.open(CACHE_NAME);for(const file of CORE_FILES)await cacheFresh(cache,file);await self.skipWaiting()})())});';
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
  // The installed/waiting worker may be terminated immediately after a
  // SKIP_WAITING message. Bind its activation promise to the ExtendableMessage
  // event lifetime, as for install. Otherwise Chromium can retain "waiting"
  // even though the new release's cache was fully populated.
  // This is an event-lifetime fix in the SAME canonical ServiceWorker.
  const oldMessage='self.addEventListener("message",event=>{if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting()});';
  const safeMessage='self.addEventListener("message",event=>{if(event.data&&event.data.type==="SKIP_WAITING")event.waitUntil(self.skipWaiting())});';
  const existingWorker=lifecycleWorker.replaceAll(rawWrite,safeWrite);
  if(existingWorker.split(oldMessage).length!==2)
    throw Error('Preview worker activation message contract changed');
  const worker=existingWorker.replace(oldMessage,safeMessage);
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
