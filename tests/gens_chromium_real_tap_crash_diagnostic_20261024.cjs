/* Real touch events on production index: diagnostic only. No app source changes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,firefox}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 let n;try{n=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch(_){res.writeHead(400);res.end();return}
 const f=path.resolve(root,'.'+(n==='/'?'/index.html':n));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.stat(f,(e,s)=>{if(e||!s.isFile()){res.writeHead(404);res.end('not found');return}
 res.writeHead(200,{'content-type':mime[path.extname(f).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(f).pipe(res)});
});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function bounded(p,ms=4000){let tid;try{return await Promise.race([p,new Promise((_,rej)=>tid=setTimeout(()=>rej(Error('TIMEOUT '+ms+'ms')),ms))])}finally{clearTimeout(tid)}}
function bootProbe(){
 const p=window.__gensTapDiag={born:performance.now(),clicks:0,pointers:0,touches:0,stalledFrames:0,frames:0,lastFrame:performance.now(),events:[],longTaskMs:0,longTasks:0};
 let prev=performance.now();
 function raf(t){p.frames++;if(t-prev>250)p.stalledFrames++;p.lastFrame=t;prev=t;requestAnimationFrame(raf)}
 requestAnimationFrame(raf);
 for(const type of ['click','pointerdown','pointerup','touchstart','touchend']){
  window.addEventListener(type,e=>{if(type==='click')p.clicks++;if(type==='pointerdown')p.pointers++;if(type==='touchstart')p.touches++;if(p.events.length<35)p.events.push({type,target:String(e.target?.id||e.target?.className||e.target?.tagName||'').slice(0,100),ts:Math.round(performance.now())})},{capture:true,passive:true})
 }
 try{new PerformanceObserver(l=>{for(const e of l.getEntries()){p.longTasks++;p.longTaskMs+=e.duration}}).observe({entryTypes:['longtask']})}catch(_){}
}
const screen=async(page,label,cdp)=>{
 let s=await bounded(page.evaluate(label=>{
 const p=window.__gensTapDiag||{};
 return {label,time:Date.now(),href:location.href,ready:document.readyState,frames:p.frames||0,stalledFrames:p.stalledFrames||0,clicks:p.clicks||0,pointers:p.pointers||0,touches:p.touches||0,events:(p.events||[]).slice(-8),longTasks:p.longTasks||0,longTaskMs:Math.round(p.longTaskMs||0),elements:document.querySelectorAll('*').length,visibleBodyChildren:[...document.body.children].filter(x=>x.getClientRects().length).map(x=>x.id||x.tagName).slice(0,15),main:document.querySelector('#gensRootHome')?.getClientRects().length||0,family:document.querySelector('#gensFamilyHome')?.getClientRects().length||0,game:document.querySelector('#gensGameHome')?.getClientRects().length||0,swControlled:!!navigator.serviceWorker?.controller};
 },label),4500);
 if(cdp)try{const a=await bounded(cdp.send('Performance.getMetrics'),2500);for(const key of ['Nodes','JSHeapUsedSize','TaskDuration','ScriptDuration'])s[key]=a.metrics.find(m=>m.name===key)?.value}catch(_){}
 return s;
};
async function run(type,name,sw,port){
 let browser,context;const result={browser:name,sw,started:new Date().toISOString(),steps:[],errors:[],events:[],crashed:false,topVisibleButtons:[]};
 try{
  browser=await type.launch({headless:true,args:name==='chromium'?['--disable-dev-shm-usage']:[]});
  context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:name==='chromium',hasTouch:true,locale:'fr-FR',serviceWorkers:sw?'allow':'block'});
  const page=await context.newPage();
  page.on('crash',()=>{result.crashed=true;result.events.push('CRASH')});
  page.on('pageerror',e=>{if(result.errors.length<12)result.errors.push(String(e))});
  page.on('dialog',async d=>{result.events.push('DIALOG '+d.type());try{await d.dismiss()}catch(_){}});
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())result.events.push('NAVIGATED '+frame.url().slice(0,150))});
  await page.addInitScript(bootProbe);
  let cdp;if(name==='chromium'){cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})}
  await bounded(page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'domcontentloaded',timeout:30000}),33000);
  await pause(1900);
  result.steps.push(await screen(page,'boot',cdp));
  result.topVisibleButtons=await page.evaluate(()=>[...document.querySelectorAll('button,a,[role=button]')].filter(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>4&&r.height>4&&s.visibility!=='hidden'&&s.display!=='none'}).slice(0,35).map(x=>({tag:x.tagName,id:x.id,className:String(x.className).slice(0,90),text:String(x.innerText||x.textContent||'').trim().slice(0,80),onclick:x.getAttribute('onclick')})));
  // Real pointer interaction, not direct invocation of application functions.
  for(const family of ['survival','adventure','capture','pvp']){
   const target=page.locator('button.gensRootModeCard.'+family);
   if(await target.count()!==1){result.events.push('NO_ROOT_BUTTON '+family);continue}
   try{
    await bounded(target.tap({timeout:7000}),9000);
    await pause(1100);
    result.steps.push(await screen(page,'tap-'+family,cdp));
    // A real touch on the family back button, if present; diagnostic fallback navigates by app API,
    // explicitly tagged so no false claim about real-back coverage is possible.
    let touched=false;
    const candidates=page.locator('#gensFamilyHome button:visible,#gensFamilyHome [role=button]:visible');
    const n=Math.min(await candidates.count(),20);
    for(let i=0;i<n;i++){
      const b=candidates.nth(i);
      const t=await b.innerText().catch(()=>'');
      if(/retour|accueil|←|back/i.test(t)){try{await bounded(b.tap({timeout:4000}),5500);touched=true;break}catch(e){result.events.push('REAL_BACK_FAILED '+String(e).slice(0,120))}}
    }
    if(!touched){await bounded(page.evaluate(()=>{if(typeof window.showGensRootHome==='function')window.showGensRootHome()}),5000);result.events.push('BACK_FALLBACK_API '+family)}
    await pause(650);
    result.steps.push(await screen(page,'back-'+family,cdp));
   }catch(e){result.events.push('TAP_FAILED '+family+' '+String(e).slice(0,300));break}
  }
  // Real finger-like scroll on home, after interactions
  try{
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.mouse.move(190,660);await page.mouse.wheel(0,650);await pause(700);
   result.steps.push(await screen(page,'after-scroll',cdp));
  }catch(e){result.events.push('SCROLL_FAILED '+String(e).slice(0,120))}
  result.summary={count:result.steps.length,peakElements:Math.max(...result.steps.map(s=>s.elements)),firstElements:result.steps[0]?.elements,lastElements:result.steps.at(-1)?.elements,peakNodes:Math.max(...result.steps.map(s=>s.Nodes||0)),heapStart:result.steps[0]?.JSHeapUsedSize,heapEnd:result.steps.at(-1)?.JSHeapUsedSize};
 }catch(e){result.events.push('SCENARIO_FAILED '+String(e).slice(0,320))}
 finally{try{await bounded(context?.close()||Promise.resolve(),5000)}catch(_){}try{await bounded(browser?.close()||Promise.resolve(),5000)}catch(_){}}
 return result;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 try{
 const results=[];
 for(const [type,name,sw] of [[chromium,'chromium',true],[chromium,'chromium',false],[firefox,'firefox',true]]){
 const o=await run(type,name,sw,port);results.push(o);
 console.log('REAL_TAP_DIAGNOSTIC '+JSON.stringify({browser:o.browser,sw:o.sw,crashed:o.crashed,summary:o.summary,events:o.events,errors:o.errors,steps:o.steps.map(x=>({label:x.label,elements:x.elements,clicks:x.clicks,touches:x.touches,stalledFrames:x.stalledFrames,longTasks:x.longTasks,Nodes:x.Nodes,JSHeapUsedSize:x.JSHeapUsedSize}))}));
 }
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
 fs.writeFileSync(path.join(root,'artifacts','chromium-real-tap-diagnostic.json'),JSON.stringify({purpose:'Real pointer taps in Linux Playwright mobile-emulated browsers, not Chrome Android device',results},null,2));
 }finally{server.closeAllConnections?.();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
