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
  const activatedInstall='self.addEventListener("install",event=>{event.waitUntil((async()=>{await self.skipWaiting();const cache=await caches.open(CACHE_NAME);for(const file of CORE_FILES)await cacheFresh(cache,file)})())});';
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
  const worker=lifecycleWorker.replaceAll(rawWrite,safeWrite);
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
  const waiting=`      if(reg.waiting){
        z40kWaitingWorker=reg.waiting;
        z40kShowUpdateBanner();
      }`;
  const installed=`          if(worker.state==='installed' && navigator.serviceWorker.controller){
            z40kWaitingWorker=worker;
            z40kShowUpdateBanner();
          }`;
  if(sourceHtml.split(waiting).length!==2||sourceHtml.split(installed).length!==2)
    throw Error('Existing PWA Shell activation seam not uniquely identified');
  return sourceHtml
    .replace(waiting,waiting.replace('z40kShowUpdateBanner();',
      "reg.waiting.postMessage({type:'SKIP_WAITING'});"))
    .replace(installed,installed.replace('z40kShowUpdateBanner();',
      "worker.postMessage({type:'SKIP_WAITING'});"));
}
