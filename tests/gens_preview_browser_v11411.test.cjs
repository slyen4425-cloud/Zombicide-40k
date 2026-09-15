const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const localFailures=[];page.on('response',r=>{try{const u=new URL(r.url());if(u.hostname==='127.0.0.1'&&r.status()>=400)localFailures.push([r.status(),u.pathname])}catch(e){}});
  try{
    await page.goto(`http://127.0.0.1:${port}/preview.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>document.getElementById('status')?.classList.contains('hide')===true);
    await page.waitForFunction(()=>document.getElementById('app')?.contentDocument?.querySelector('#menu'));
    const state=await page.evaluate(()=>{
      const f=document.getElementById('app'),d=f.contentDocument,w=f.contentWindow;
      return {
        title:d.title,
        base:d.querySelector('base')?.href||'',
        srcs:[...d.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')),
        hasMenu:!!d.querySelector('#menu'),
        perfCount:[...d.querySelectorAll('script[src]')].filter(s=>(s.getAttribute('src')||'').includes('gens-mobile-combat-performance-16781022.js')).length,
        tacticalBridge:!!w.GensRpgTacticalCombatV2Bridge
      };
    });
    assert.equal(state.hasMenu,true,'preview must render the real GenSrpG source document');
    assert.match(state.base,new RegExp(`^http://127\\.0\\.0\\.1:${port}/$`),'preview iframe must resolve assets from the candidate root');
    assert.ok(state.srcs.includes('assets/dungeon/dungeon-core-318.js'),'preview must include Pages-only Dungeon Core 3.18');
    assert.ok(state.srcs.includes('assets/dungeon/dungeon-authored-runtime-167839.js?v=167840'),'preview must include authored Dungeon runtime');
    assert.equal(state.perfCount,1,'performance/bootstrap layer must occur exactly once in preview composition');
    assert.equal(state.srcs.at(-1),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap must remain final');
    assert.deepEqual(localFailures,[],'preview local assets must not return HTTP errors');
    console.log(JSON.stringify({scenario:'manual preview loader',viewport:'412x915 @2.625 touch',modules:state.srcs.length,final:state.srcs.at(-1),bridgeLoaded:state.tacticalBridge}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
