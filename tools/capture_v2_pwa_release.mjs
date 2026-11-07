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
  // Stale worker fetches can complete AFTER a fresh worker has activated and
  // deleted their old cache. An unconditional caches.open(CACHE_NAME) would
  // resurrect the retired namespace, even while the new client is current.
  // Cache only when this worker's namespace still exists. Install pre-cache
  // still creates the current namespace; unrelated root caches are untouched.
  const rawWrite='const cache=await caches.open(CACHE_NAME);await cache.put(request,fresh.clone())';
  if(scoped.split(rawWrite).length!==4)
    throw Error('Unknown service worker fetch cache ownership; refuse blind patch');
  const safeWrite='if((await caches.keys()).includes(CACHE_NAME)){'+rawWrite+'}';
  const worker=scoped.replaceAll(rawWrite,safeWrite);
  // The already-existing update checker compares these two source markers.
  // Stamp both in the published preview HTML, not in the immutable source.
  const html=stampShellForCommit(sourceHtml,releaseSha);
  return Object.freeze({cacheName,worker,html});
}
