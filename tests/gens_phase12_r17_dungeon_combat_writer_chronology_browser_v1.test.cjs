'use strict';
/* Phase 12 / R17 — browser-only chronology of Dungeon combat and legacy AI assignments.
 * One read-only production preview; instrumentation belongs exclusively to the test context.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const keys=['renderDungeonCombatRound','dungeonRunAi156','dungeonAdvanceTurn156'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/preview.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
 fs.readFile(file,(error,data)=>{
  if(error){res.writeHead(404);res.end('not found');return}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(names=>{
   try{if(!sessionStorage.getItem('__r17WriterBooted')){localStorage.clear();sessionStorage.clear();sessionStorage.setItem('__r17WriterBooted','1')}}catch(e){}
   window.supabase={createClient:()=>({})};
   const log=[];
   Object.defineProperty(window,'__gensR17DungeonWriterTrace',{configurable:false,value:log});
   names.forEach(name=>{
    let value;
    Object.defineProperty(window,name,{
     configurable:true,enumerable:true,
     get(){return value},
     set(next){
      const script=document.currentScript;
      log.push({name,scriptId:script?.id||'',scriptSrc:script?.getAttribute('src')||'',kind:typeof next,readyState:document.readyState});
      value=next;
     }
    });
   });
  },keys);
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof window.__dc302RenderCombat==='function'&&typeof window.__dc214RenderCombat==='function',null,{timeout:60000});
  const result=await page.evaluate(()=>({
   finalRenderer:window.renderDungeonCombatRound===window.__dc302RenderCombat?'core303':window.renderDungeonCombatRound===window.__dc214RenderCombat?'core214':'other',
   renderType:typeof window.renderDungeonCombatRound,
   oldAiType:typeof window.dungeonRunAi156,
   oldAdvanceType:typeof window.dungeonAdvanceTurn156,
   oldTimelineActive:!!window.dungeonTurn156?.active,
   ownerSrc:document.querySelector('#dungeonCore303TimelineRootFix')?.getAttribute('src')||null,
   writes:[...window.__gensR17DungeonWriterTrace]
  }));
  assert.equal(result.ownerSrc,'assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js','R16 owner parser slot must remain exact');
  assert.equal(result.finalRenderer,'core303','Core303 must be final runtime renderer; no late wrapper may steal the contract');
  assert.equal(result.oldTimelineActive,false,'Legacy timeline may not restart after boot');
  for(const name of keys)assert.ok(result.writes.some(w=>w.name===name&&w.scriptId==='dungeonCore303TimelineRootFix'),name+' must be explicitly finalized by Core303');
  assert.equal(result.writes.at(-1)?.scriptId,'dungeonCore303TimelineRootFix','Last observed combat/IA writer after preview boot must be Core303');
  console.log(JSON.stringify({scenario:'R17 real browser Dungeon combat/AI writer chronology',result},null,2));
  await context.close();
 }finally{server.closeAllConnections?.();server.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
