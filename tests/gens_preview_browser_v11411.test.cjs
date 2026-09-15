const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const fixture='<!doctype html><html><head><title>GenSrpG preview fixture</title></head><body><div id="menu">Menu fixture</div><script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script></body></html>';
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/index.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(fixture);return;
  }
  if(pathname.endsWith('.js')){
    res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});res.end('window.__gensPreviewStubScripts=(window.__gensPreviewStubScripts||0)+1;');return;
  }
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(data)})
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);
  const localFailures=[];page.on('response',r=>{try{const u=new URL(r.url());if(u.hostname==='127.0.0.1'&&r.status()>=400)localFailures.push([r.status(),u.pathname])}catch(e){}});
  try{
    await page.goto(`http://127.0.0.1:${port}/preview.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('status')?.classList.contains('hide')===true);
    const state=await page.evaluate(()=>{
      const f=document.getElementById('app'),d=f.contentDocument,w=f.contentWindow;
      return {
        title:d.title,
        base:d.querySelector('base')?.href||'',
        srcs:[...d.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')),
        hasMenu:!!d.querySelector('#menu'),
        perfCount:[...d.querySelectorAll('script[src]')].filter(s=>(s.getAttribute('src')||'').includes('gens-mobile-combat-performance-16781022.js')).length,
        stubScripts:Number(w.__gensPreviewStubScripts||0)
      };
    });
    assert.equal(state.hasMenu,true,'preview must render the source document inside its iframe');
    assert.match(state.base,new RegExp(`^http://127\\.0\\.0\\.1:${port}/$`),'preview iframe must resolve assets from the candidate root');
    assert.ok(state.srcs.includes('assets/dungeon/dungeon-core-318.js'),'preview must include Pages-only Dungeon Core 3.18');
    assert.ok(state.srcs.includes('assets/dungeon/dungeon-authored-runtime-167839.js?v=167840'),'preview must include authored Dungeon runtime');
    assert.equal(state.perfCount,1,'performance/bootstrap layer must occur exactly once in preview composition');
    assert.equal(state.srcs.at(-1),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap must remain final');
    assert.equal(state.stubScripts,19,'all 19 Pages runtime script slots must execute before preview-ready');
    assert.deepEqual(localFailures,[],'preview local requests must not return HTTP errors');
    console.log(JSON.stringify({scenario:'manual preview loader fixture',viewport:'412x915 @2.625 touch',modules:state.srcs.length,executed:state.stubScripts,final:state.srcs.at(-1)}));
  }finally{
    try{await context.close()}catch(e){}try{await browser.close()}catch(e){}
    try{server.closeAllConnections?.()}catch(e){}
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
