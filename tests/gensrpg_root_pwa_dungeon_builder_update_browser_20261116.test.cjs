'use strict';
// Real installed mobile browser with same origin/scope and a previously
// installed root service worker. Reopens without uninstalling or clearing data.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const scope='/Zombicide-40k/';
test('installed old root PWA relaunch updates to the real Dungeon Builder script with saves and Capture preview cache intact',{timeout:180000},async()=>{
 const {stampShellForCommit,stampWorkerForCommit}=await import('../tools/version_pwa_release_worker.mjs');
 const oldSha='a'.repeat(40),oldVersion='gensrpg-release-'+oldSha.slice(0,12);
 const currentHtml=fs.readFileSync(path.join(site,'index.html'),'utf8');
 const currentSw=fs.readFileSync(path.join(site,'service-worker.js'),'utf8');
 const sourceHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sourceSw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const oldHtml=stampShellForCommit(sourceHtml,oldSha),oldSw=stampWorkerForCommit(sourceSw,oldSha);
 const extract=html=>html.slice(html.indexOf('const Z40K_APP_VERSION = '),html.indexOf('/* Ancien ajout automatique'));
 assert.ok(extract(oldHtml).length>2500&&extract(currentHtml).length>2500,'use the complete existing ~2.7K PWA updater, never a stub');
 const version=currentHtml.match(/<meta name="z40k-app-version" content="([^"]+)">/)?.[1];
 assert.match(version||'',/^gensrpg-release-[a-f0-9]{12}$/);
 const servePage=(newer)=>{
  const html=newer?currentHtml:oldHtml,ver=newer?version:oldVersion;
  return '<!doctype html><html><head><meta name="z40k-app-version" content="'+ver+'"></head>'+
  '<body><div id="z40kUpdateBanner"><button class="z40kUpdateBtn">Update</button></div>'+
  '<script src="assets/dungeon/dungeon-world-builder-167821.js"></script>'+
  '<script>'+extract(html)+'</script></body></html>';
 };
 let newer=false;const requests=[];
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');requests.push(url.pathname);
  res.setHeader('Cache-Control','no-store');
  if(url.pathname===scope+'service-worker.js'){res.setHeader('Content-Type','text/javascript');res.end(newer?currentSw:oldSw);return}
  if(url.pathname===scope||url.pathname===scope+'index.html'){res.setHeader('Content-Type','text/html');res.end(servePage(newer));return}
  if(url.pathname===scope+'assets/dungeon/dungeon-world-builder-167821.js'){
   res.setHeader('Content-Type','text/javascript');
   res.end(newer?'window.DungeonWorldBuilder167821={open(){return true}};':'window.DungeonWorldBuilder167821=undefined;');return;
  }
  res.setHeader('Content-Type','text/plain');res.end('fixture');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'allow'});
  const url='http://127.0.0.1:'+server.address().port+scope;
  let p=await ctx.newPage();p.setDefaultTimeout(60000);
  await p.goto(url,{waitUntil:'load'});
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  assert.equal(await p.evaluate(()=>!!window.DungeonWorldBuilder167821),false);
  await p.evaluate(async()=>{localStorage.setItem('gensrpg-builder-save','keep');await caches.open('gensrpg-preview-capture-v2-preserve')});
  newer=true;await p.close();p=await ctx.newPage();p.setDefaultTimeout(60000);
  await p.goto(url,{waitUntil:'load'});
  await p.waitForFunction(()=>typeof window.DungeonWorldBuilder167821?.open==='function');
  assert.equal(await p.evaluate(()=>localStorage.getItem('gensrpg-builder-save')),'keep');
  await p.waitForFunction(async()=>{
   const keys=await caches.keys(),reg=await navigator.serviceWorker.getRegistration();
   return reg?.active?.state==='activated'&&!reg.waiting&&!reg.installing&&
    keys.includes('gensrpg-preview-capture-v2-preserve')&&
    keys.includes('gensrpg-cache-release-'+version.slice(-12))&&
    !keys.includes('gensrpg-cache-release-'+('a'.repeat(12)));
  },null,{timeout:60000});
  assert.ok(requests.some(x=>x.endsWith('/assets/dungeon/dungeon-world-builder-167821.js')));
  await ctx.close();
 }finally{
  await browser?.close();server.closeAllConnections?.();server.closeIdleConnections?.();
  await new Promise(resolve=>server.close(resolve));
 }
});

test('old installed Capture shortcut opens the GenSRPG module chooser with ZERO manual click in mobile Chromium',{timeout:60000},async()=>{
 const handoff=fs.readFileSync(path.join(root,'assets/gensrpg/shell/capture-v2-from-main-entry-v1.js'),'utf8');
 const prefix='/Zombicide-40k/';
 let previewLoads=0,rootLoads=0;
 const server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://127.0.0.1').pathname;
   res.setHeader('Cache-Control','no-store');
   if(pathname===prefix+'preview/capture-v2-pr225/assets/gensrpg/shell/capture-v2-from-main-entry-v1.js'){
     res.setHeader('Content-Type','text/javascript');res.end(handoff);return;
   }
   if(pathname===prefix+'preview/capture-v2-pr225/' || pathname===prefix+'preview/capture-v2-pr225/index.html'){
     previewLoads++;res.setHeader('Content-Type','text/html');
     res.end('<!doctype html><html><head><script src="assets/gensrpg/shell/capture-v2-from-main-entry-v1.js"></script></head><body><main id="capture-only">CAPTURE PREVIEW</main></body></html>');
     return;
   }
   if(pathname===prefix || pathname===prefix+'index.html'){
     rootLoads++;res.setHeader('Content-Type','text/html');
     res.end('<!doctype html><html><body><main id="gensrpg-module-chooser"><button>Monster InvoC</button><button>Dungeon</button><button>Survie</button><button>PvP</button></main></body></html>');
     return;
   }
   res.writeHead(404).end('not found');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
   browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
   const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'allow'});
   await ctx.addInitScript(()=>{
     const orig=window.matchMedia.bind(window);
     window.matchMedia=(query)=>query==='(display-mode: standalone)'
       ?{matches:true,media:query,addListener(){},removeListener(){}}:orig(query);
   });
   const page=await ctx.newPage();
   const base='http://127.0.0.1:'+server.address().port+prefix;
   await page.goto(base+'preview/capture-v2-pr225/',{waitUntil:'domcontentloaded'});
   await page.waitForURL(base,{timeout:20000});
   assert.equal(await page.locator('#gensrpg-module-chooser button').count(),4,
     'launch must expose the four module choices from the official app root');
   assert.equal(await page.locator('#capture-only').count(),0,
     'no forced Capture landing on installed icon launch');
   assert.equal(previewLoads,1);assert.equal(rootLoads,1);
   await ctx.close();
 }finally{
   await browser?.close();server.closeAllConnections?.();server.closeIdleConnections?.();
   await new Promise(resolve=>server.close(resolve));
 }
});
