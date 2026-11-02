'use strict';
// C2 acceptance: actual installed service worker update in a same-origin
// Chromium PWA context, preserving localStorage, IndexedDB and unrelated caches.
// The old SW fixture differs from the approved source in CACHE_NAME only.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const fsSync=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const swSource=fsSync.readFileSync(path.join(root,'service-worker.js'),'utf8');
const match=swSource.match(/const CACHE_NAME\s*=\s*"([^"]+)";/);
assert.ok(match,'real versioned SW cache owner must exist');
const newKey=match[1];
const oldKey='gensrpg-cache-16.78.116-ci-previous-install';
const otherKey='unrelated-tool-cache-ci-preserve';
assert.notEqual(newKey,oldKey,'upgraded cache revision must differ');
let revision='old';
const serverRequests=[];
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8',
 '.webmanifest':'application/manifest+json','.png':'image/png',
 '.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/__ci_pwa_probe'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'})
     .end('<!doctype html><title>PWA update probe</title><p>Same-origin PWA probe</p>');
   return;
  }
  if(url.pathname==='/service-worker.js'){
   const body=revision==='old'
     ?swSource.replace(/const CACHE_NAME\s*=\s*"[^"]+";/,'const CACHE_NAME = "'+oldKey+'";')
     :swSource;
   res.writeHead(200,{'content-type':'text/javascript;charset=utf-8','cache-control':'no-store'})
     .end(body);
   return;
  }
  const rel=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
  if(rel.split('/').includes('..')){res.writeHead(403).end();return;}
  const file=path.resolve(site,rel);
  if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
  const data=await fs.readFile(file);
  serverRequests.push({path:url.pathname,status:200,size:data.length});
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream',
   'cache-control':'no-store'}).end(data);
 }catch(error){serverRequests.push({path:req.url,status:404,error:error.message});res.writeHead(404).end('Missing actual Pages asset');}
});
const eventually=async(page,predicate,timeout=70000)=>
 page.waitForFunction(predicate,null,{timeout});
// Wait on settled CacheStorage keys from Node: an async waitForFunction
// callback can return a truthy Promise before worker activation finishes.
const waitForCacheState=async(page,accept,label,timeout=70000)=>{
 const start=Date.now();let keys=[];
 for(;;){
  keys=await page.evaluate(()=>caches.keys());
  if(accept(keys))return keys;
  if(Date.now()-start>timeout)throw new Error(label+'; cache keys='+JSON.stringify(keys));
  await new Promise(resolve=>setTimeout(resolve,150));
 }
};
test('an already installed Capture V2 PWA upgrades without deleting saved data or unrelated caches',
 {timeout:195000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 try{
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   locale:'fr-FR',serviceWorkers:'allow'});
  const page=await context.newPage();
  const url='http://127.0.0.1:'+server.address().port;
  await page.goto(url+'/__ci_pwa_probe',{waitUntil:'domcontentloaded'});
  const initial=await page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.register('/service-worker.js',{scope:'/'});
   await navigator.serviceWorker.ready;
   return !!registration.active;
  });
  assert.equal(initial,true,'real previous PWA SW must activate');
  await eventually(page,()=>!!navigator.serviceWorker.controller);
  const before=await page.evaluate(async key=>{
   localStorage.setItem('gensrpg-ci-protected-save','profile-kept');
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('gensrpg-ci-saved-profile',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('profiles');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('profiles','readwrite');
    tx.objectStore('profiles').put({hero:'unchanged',level:3},'test');
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   });
   db.close();
   const foreign=await caches.open(key);
   await foreign.put('/unrelated-app-page',new Response('preserve-other-owner'));
   return caches.keys();
  },otherKey);
  assert.ok(before.includes(oldKey),'previous SW must have a distinct installed cache');
  assert.ok(before.includes(otherKey),'independent same-origin cache seeded for regression');
  await page.evaluate(()=>{window.__gensCiOldWorker=navigator.serviceWorker.controller;window.__gensCiControllerChanges=0;navigator.serviceWorker.addEventListener('controllerchange',()=>{window.__gensCiControllerChanges++});});
  revision='new';
  await page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.getRegistration('/');
   if(!registration)throw new Error('Installed PWA SW registration missing');
   await registration.update();
  });
  // A cache created during INSTALL is not proof that the worker is ACTIVE.
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&
    navigator.serviceWorker.controller!==window.__gensCiOldWorker,null,{timeout:70000});
  await waitForCacheState(page,keys=>keys.includes(newKey)&&!keys.includes(oldKey),
   'new PWA worker must finish activation and retire the old GenSrpg cache');
  const actual=await page.evaluate(async key=>{
   const keys=await caches.keys();
   const foreign=await caches.open(key);
   const saved=await foreign.match('/unrelated-app-page');
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('gensrpg-ci-saved-profile',1);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const stored=await new Promise((resolve,reject)=>{
    const r=db.transaction('profiles').objectStore('profiles').get('test');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   db.close();
   const registration=await navigator.serviceWorker.getRegistration('/');
   return {keys,foreign:saved?await saved.text():null,
    profile:stored,local:localStorage.getItem('gensrpg-ci-protected-save'),
    workerState:registration?.active?.state,
    controllerIsOld:navigator.serviceWorker.controller===window.__gensCiOldWorker,
    activeIsOld:registration?.active===window.__gensCiOldWorker,
    controllerChanges:window.__gensCiControllerChanges};
  },otherKey);
  assert.ok(actual.keys.includes(newKey),'new SW cache activated');
  assert.ok(!actual.keys.includes(oldKey),'old GenSrpg SW cache retired');
  assert.equal(actual.controllerIsOld,false,'replacement PWA worker controls the page');
  assert.equal(actual.activeIsOld,false,'replacement PWA worker is the active registration');
  assert.ok(actual.controllerChanges>=1,'browser emitted a real controllerchange');
  assert.equal(actual.foreign,'preserve-other-owner','foreign CacheStorage owner must survive');
  assert.deepEqual(actual.profile,{hero:'unchanged',level:3},'IndexedDB saved profiles unchanged');
  assert.equal(actual.local,'profile-kept','localStorage saved profile unchanged');
  // Offline navigation is intentionally only a SHELL guarantee. Native Labs
  // are not promised offline and must not be copied into the SW owner.
  await page.goto(url+'/index.html',{waitUntil:'domcontentloaded',timeout:45000});
  const offlinePreflight=await page.evaluate(async key=>{
   const registration=await navigator.serviceWorker.getRegistration('/');
   const owned=await caches.open(key);
   const entries=await owned.keys();
   const cachedIndex=await owned.match('/index.html');
   const cachedRoot=await owned.match('/');
   return {controller:!!navigator.serviceWorker.controller,
    workerState:registration?.active?.state,
    cachedIndex:!!cachedIndex,indexStatus:cachedIndex?.status,
    cachedRoot:!!cachedRoot,entryCount:entries.length,
    sample:entries.slice(0,8).map(request=>request.url),keys:await caches.keys()};
  },newKey);
  assert.equal(offlinePreflight.controller,true,
   'the installed worker must control real GenSrpg index before offline test: '+JSON.stringify(offlinePreflight));
  assert.equal(offlinePreflight.cachedIndex,true,
   'the active worker must have saved real index.html for offline shell: '+JSON.stringify({offlinePreflight,serverRequests:serverRequests.slice(0,160),requestCount:serverRequests.length}));
  await context.setOffline(true);
  try{await page.reload({waitUntil:'domcontentloaded',timeout:45000});}
  catch(error){throw new Error('PWA offline shell navigation failed; preflight='+
   JSON.stringify(offlinePreflight)+'; cause='+error.message);}
  assert.match(await page.content(),/gensRootHome/,
   'installed PWA must serve its real GenSrpg shell HTML while offline');
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg-ci-protected-save')),
   'profile-kept','saved data stays intact during offline restart');
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
});
