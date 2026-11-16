// One existing root Shell and one existing root SW. Only compiled _site
// artifacts are patched for the immutable Pages SHA. Never change source,
// PWA scope, storage, installed id, user game, or a module.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {enableAutomaticPreviewActivation} from './capture_v2_pwa_release.mjs';
export function prepareRootPwaInstalledUpdate(sw,html){
  if(typeof sw!=='string'||typeof html!=='string')throw TypeError('Invalid root PWA build');
  if(!/^const CACHE_NAME = "gensrpg-cache-release-[a-f0-9]{12}";/m.test(sw)||
     !/<meta name="z40k-app-version" content="gensrpg-release-[a-f0-9]{12}">/.test(html))
    throw Error('Root release must be stamped before auto-activation');
  const owner='name.startsWith("gensrpg-cache-")&&name!==CACHE_NAME';
  if(sw.split(owner).length!==2)throw Error('Root cache authority drift');
  const from='self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{for(const file of CORE_FILES)await cacheFresh(cache,file)}))});';
  const to='self.addEventListener("install",event=>{event.waitUntil((async()=>{await self.skipWaiting();const cache=await caches.open(CACHE_NAME);for(let i=0;i<CORE_FILES.length;i+=8){await Promise.all(CORE_FILES.slice(i,i+8).map(file=>cacheFresh(cache,file)))}})())});';
  if(sw.split(from).length!==2)throw Error('Root SW install owner drift');
  const rootHtml=enableAutomaticPreviewActivation(html);
  if(!rootHtml.includes("reg.waiting.postMessage({type:'SKIP_WAITING'});")||
     !rootHtml.includes("worker.postMessage({type:'SKIP_WAITING'});"))
    throw Error('Root Shell update event handler drift');
  return Object.freeze({worker:sw.replace(from,to),html:rootHtml});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
   if(process.argv.length!==4)throw Error('Usage: install_root_pwa_autoupdate_release_20261116.mjs <worker> <html>');
   const [workerFile,htmlFile]=process.argv.slice(2);
   const out=prepareRootPwaInstalledUpdate(fs.readFileSync(workerFile,'utf8'),fs.readFileSync(htmlFile,'utf8'));
   fs.writeFileSync(workerFile,out.worker,'utf8');
   fs.writeFileSync(htmlFile,out.html,'utf8');
   console.log('Main PWA: installed update activation on relaunch, bounded precache, scope and saves preserved');
 }catch(e){console.error('::error::'+e.message);process.exitCode=1}
}
