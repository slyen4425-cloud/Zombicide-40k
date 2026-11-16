'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const built=p=>fs.readFileSync(path.join(site,p),'utf8');
test('installed root release automatically activates a fresh service worker and keeps the Dungeon precache',()=>{
 const sha=process.env.GITHUB_SHA;assert.match(sha||'',/^[a-f0-9]{40}$/);
 const html=built('index.html'),sw=built('service-worker.js');
 assert.match(html,new RegExp('gensrpg-release-'+sha.slice(0,12)));
 assert.match(sw,new RegExp('gensrpg-cache-release-'+sha.slice(0,12)));
 assert.ok(html.includes("reg.waiting.postMessage({type:'SKIP_WAITING'});"));
 assert.ok(html.includes("worker.postMessage({type:'SKIP_WAITING'});"));
 assert.ok(sw.includes('await self.skipWaiting();const cache=await caches.open(CACHE_NAME);'));
 assert.ok(sw.includes('Promise.all(CORE_FILES.slice(i,i+8).map(file=>cacheFresh(cache,file)))'));
 assert.ok(sw.includes('dungeon-world-builder-167821.js'));
 assert.ok(sw.includes('name.startsWith("gensrpg-cache-")&&name!==CACHE_NAME'));
 assert.equal(read('service-worker.js').includes('event.waitUntil((async()=>{await self.skipWaiting();'),false,'no source SW or storage migration');
});
test('preview Capture and root keep distinct launcher labels but the SAME original scope and ID',()=>{
 const rootManifest=JSON.parse(read('manifest.webmanifest'));
 const releasedRoot=JSON.parse(built('manifest.webmanifest'));
 const releasedCapture=JSON.parse(built('preview/capture-v2-pr225/manifest.webmanifest'));
 assert.deepEqual(releasedRoot,rootManifest);
 assert.equal(rootManifest.name,'GenSrpG');
 assert.equal(releasedCapture.name,'Monster InvoC — Capture');
 assert.equal(releasedCapture.short_name,'InvoC Capture');
 for(const key of ['id','start_url','scope','display','orientation','icons','theme_color','background_color'])
   assert.deepEqual(releasedCapture[key],rootManifest[key],key);
});
test('direct installed Capture launch never forces Capture mode, and offers main Dungeon entry',()=>{
 const src=read('assets/gensrpg/shell/capture-v2-from-main-entry-v1.js');
 for(const [query,clicks] of [['',0],['?entry=gensrpg-main',1]]){
   let cb,click=0,added=[];
   const doc={body:{append:x=>added.push(x)},
    addEventListener:(n,f)=>{if(n==='DOMContentLoaded')cb=f},
    querySelector:()=>({click(){click++}}),
    getElementById:()=>({querySelector:()=>({append:x=>added.push(x)})}),
    createElement:()=>({style:{},className:''})};
   const url='https://slyen4425-cloud.github.io/Zombicide-40k/preview/capture-v2-pr225/index.html'+query;
   vm.runInNewContext(src,{window:{document:doc,location:{href:url,search:query}},URL,URLSearchParams});
   cb();assert.equal(click,clicks);assert.equal(added.length,1);
   assert.equal(added[0].href,'https://slyen4425-cloud.github.io/Zombicide-40k/');
   if(!query)assert.match(added[0].textContent,/GenSRPG.*Dungeon/);
 }
});
