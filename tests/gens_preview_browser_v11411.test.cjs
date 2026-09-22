const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const fixture='<!doctype html><html><head><title>GenSrpG preview fixture</title></head><body><div id="menu">Menu fixture</div><script>window.__fixtureSwAttempt=(window.__fixtureSwAttempt||0)+1;if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js").then(()=>window.__fixtureSwResolved=true).catch(e=>window.__fixtureSwError=String(e&&e.name||e));}</script><script src="assets/gensrpg/core/storage-v1.js"></script><script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script></body></html>';
let previewRequests=0,swRequests=0;
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/index.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(fixture);return;
  }
  if(pathname==='/service-worker.js'){
    swRequests++;res.writeHead(500,{'content-type':'text/plain'});res.end('preview must not request a service worker');return;
  }
  if(pathname.endsWith('.js')){
    res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});res.end('window.__gensPreviewStubScripts=(window.__gensPreviewStubScripts||0)+1;');return;
  }
  const rel=pathname==='/'?'/preview.html':pathname;
  if(rel==='/preview.html')previewRequests++;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(data)})
});
async function waitReady(page){
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1'&&document.querySelector('#menu'));
  await page.waitForFunction(()=>window.__fixtureSwResolved===true||window.__fixtureSwError);
}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);
  const localFailures=[];page.on('response',r=>{try{const u=new URL(r.url());if(u.hostname==='127.0.0.1'&&r.status()>=400)localFailures.push([r.status(),u.pathname])}catch(e){}});
  try{
    await page.goto(`http://127.0.0.1:${port}/preview.html`,{waitUntil:'domcontentloaded'});
    await waitReady(page);
    const first=await page.evaluate(()=>({
      title:document.title,
      base:document.querySelector('base')?.href||'',
      srcs:[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')),
      hasMenu:!!document.querySelector('#menu'),
      perfCount:[...document.querySelectorAll('script[src]')].filter(s=>(s.getAttribute('src')||'').includes('gens-mobile-combat-performance-16781022.js')).length,
      stubScripts:Number(window.__gensPreviewStubScripts||0),
      preview:window.__GENSRPG_PREVIEW__===true,
      swAttempt:Number(window.__fixtureSwAttempt||0),
      swResolved:window.__fixtureSwResolved===true,
      swError:window.__fixtureSwError||'',
      href:location.href
    }));
    assert.equal(first.hasMenu,true,'preview must render the source document at top level');
    assert.equal(first.preview,true,'preview isolation marker must survive source-document rendering');
    assert.match(first.base,new RegExp(`^http://127\\.0\\.0\\.1:${port}/$`),'preview must resolve assets from the candidate root');
    assert.match(first.href,/\/preview\.html$/,'document.write must preserve preview.html as the reload target');
    assert.ok(first.srcs.includes('assets/dungeon/dungeon-core-318.js'),'preview must include Pages-only Dungeon Core 3.18');
    assert.ok(first.srcs.includes('assets/dungeon/dungeon-authored-runtime-167839.js?v=167840'),'preview must include authored Dungeon runtime');
    const storagePos=first.srcs.indexOf('assets/gensrpg/core/storage-v1.js');
    const textUtilsPos=first.srcs.indexOf('assets/gensrpg/core/text-utils-v1.js');
    const roomCreatorPos=first.srcs.indexOf('assets/dungeon/dungeon-room-creator-100.js');
    assert.ok(storagePos>=0,'preview must include the production-connected Core storage service');
    assert.ok(textUtilsPos>=0,'preview must include the production-connected Core Text Utils service');
    assert.ok(roomCreatorPos>textUtilsPos,'Core Text Utils must load before Room Creator');
    assert.ok(roomCreatorPos>storagePos,'Core storage must load before Room Creator');
    assert.equal(first.perfCount,1,'performance/bootstrap layer must occur exactly once in preview composition');
    assert.equal(first.srcs.at(-1),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap must remain final');
    assert.equal(first.stubScripts,30,'all 30 Pages runtime script slots must execute before preview-ready');
    assert.equal(first.swAttempt,1,'fixture must exercise the source PWA registration path');
    assert.equal(first.swResolved,true,'preview must replace service-worker registration with a harmless resolved stub');
    assert.equal(first.swError,'','preview PWA isolation must not reject source startup');
    assert.equal(swRequests,0,'preview must never request service-worker.js');

    await page.reload({waitUntil:'domcontentloaded'});
    await waitReady(page);
    const second=await page.evaluate(()=>({ready:document.documentElement?.dataset?.gensrpgPreviewReady,menu:!!document.querySelector('#menu'),preview:window.__GENSRPG_PREVIEW__===true,href:location.href,stubScripts:Number(window.__gensPreviewStubScripts||0)}));
    assert.equal(second.ready,'1','preview must become ready again after a real top-level reload');
    assert.equal(second.menu,true,'GenSrpG source UI must return after reload/restart');
    assert.equal(second.preview,true,'preview isolation must be restored after reload/restart');
    assert.match(second.href,/\/preview\.html$/,'reload/restart must remain on preview.html');
    assert.equal(second.stubScripts,30,'runtime composition must execute exactly once after restart');
    assert.ok(previewRequests>=2,'browser restart test must request preview.html again');
    assert.equal(swRequests,0,'service-worker.js must still be isolated after restart');
    assert.deepEqual(localFailures,[],'preview local requests must not return HTTP errors');
    console.log(JSON.stringify({scenario:'restart-safe manual preview',viewport:'412x915 @2.625 touch',modules:first.srcs.length,executed:first.stubScripts,previewRequests,swRequests}));
  }finally{
    try{await context.close()}catch(e){}try{await browser.close()}catch(e){}
    try{server.closeAllConnections?.()}catch(e){}
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
