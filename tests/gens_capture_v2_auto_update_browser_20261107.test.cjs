'use strict';
// A real Chromium mobile SW registration is re-launched at SAME preview URL.
// Use the ACTUAL compiled preview update handler and ACTUAL published SW bytes;
// the small HTML harness merely avoids loading the entire Capture game twice.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const preview=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site','preview/capture-v2-pr225');
const baseHtml=fs.readFileSync(path.join(preview,'index.html'),'utf8');
const sourceWorker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const oldSha='a'.repeat(40),newSha='b'.repeat(40);
const scope='/Zombicide-40k/preview/capture-v2-pr225/';

test('existing installed Capture V2 auto-updates on reopening its SAME URL, no user click or reinstall',
 {timeout:120000},async()=>{
 const {releasePreviewPwaForCommit}=await import('../tools/capture_v2_pwa_release.mjs');
 const old=releasePreviewPwaForCommit(sourceWorker,baseHtml,oldSha);
 const latest=releasePreviewPwaForCommit(sourceWorker,baseHtml,newSha);
 const start=baseHtml.indexOf('const Z40K_APP_VERSION = ');
 const end=baseHtml.indexOf('/* Ancien ajout automatique',start);
 assert.ok(start>0&&end>start,'use the genuine built Preview Shell update handler');
 const code=baseHtml.slice(start,end);
 const wrap=app=>{
   const version=app.html.match(/<meta name="z40k-app-version" content="([^"]+)">/)?.[1];
   assert.ok(version);
   const live=code.replace(/const Z40K_APP_VERSION = "[^"]+";/,
     'const Z40K_APP_VERSION = "'+version+'";');
   return '<!doctype html><html><head><meta name="z40k-app-version" content="'+version+'"></head>'+
     '<body><div id="z40kUpdateBanner"><button class="z40kUpdateBtn" onclick="z40kApplyUpdate()">Mettre à jour</button></div>'+
     '<script>'+live+'</script></body></html>';
 };
 let live=false;
 const server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://127.0.0.1');
   res.setHeader('Cache-Control','no-store');
   if(url.pathname===scope+'service-worker.js'){
     res.setHeader('Content-Type','text/javascript;charset=utf-8');
     res.end(live?latest.worker:old.worker);return;
   }
   if(url.pathname===scope||url.pathname===scope+'index.html'){
     res.setHeader('Content-Type','text/html;charset=utf-8');
     res.end(wrap(live?latest:old));return;
   }
   res.setHeader('Content-Type','text/plain');
   res.end('asset fixture');
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
   browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
   const context=await browser.newContext({
     viewport:{width:932,height:430},isMobile:true,hasTouch:true,
     locale:'fr-FR',serviceWorkers:'allow'
   });
   const url='http://127.0.0.1:'+server.address().port+scope;
   const before=await context.newPage();
   before.setDefaultTimeout(60000);
   await before.goto(url,{waitUntil:'load'});
   await before.waitForFunction(()=>navigator.serviceWorker.controller!==null);
   assert.equal(await before.locator('meta[name="z40k-app-version"]').getAttribute('content'),
     'gensrpg-release-aaaaaaaaaaaa');
   await before.evaluate(async()=>{
     localStorage.setItem('gensrpg-v2-installed-identity','same-install');
     await caches.open('gensrpg-cache-release-root-keep');
   });
   live=true;
   await before.close();
   // Like tapping the already installed PWA icon again. Same origin/scope,
   // browser context and service worker registration; NO app reinstall and
   // NO click on the legacy update banner.
   const after=await context.newPage();
   after.setDefaultTimeout(60000);
   await after.goto(url,{waitUntil:'load'});
   await after.waitForFunction(()=>
     document.querySelector('meta[name="z40k-app-version"]')?.content===
       'gensrpg-release-bbbbbbbbbbbb');
   assert.equal(await after.evaluate(()=>localStorage.getItem('gensrpg-v2-installed-identity')),
     'same-install');
   // Cache creation happens during install; eviction runs only once the NEW
   // worker activates. Wait for both, not just the newly created cache.
   await after.waitForFunction(async()=>{
     const names=await caches.keys();
     const reg=await navigator.serviceWorker.getRegistration();
     return reg?.active?.state==='activated' &&
       names.includes('gensrpg-preview-capture-v2-bbbbbbbbbbbb') &&
       !names.includes('gensrpg-preview-capture-v2-aaaaaaaaaaaa');
   },null,{timeout:60000});
   const cachesAfter=await after.evaluate(()=>caches.keys());
   assert.ok(cachesAfter.includes('gensrpg-cache-release-root-keep'));
   assert.ok(!cachesAfter.includes('gensrpg-preview-capture-v2-aaaaaaaaaaaa'),
     'preview SW removes ONLY previous preview releases');
   await context.close();
 }finally{
   if(browser)await browser.close();
   server.closeAllConnections();
   await new Promise(ok=>server.close(ok));
 }
});
