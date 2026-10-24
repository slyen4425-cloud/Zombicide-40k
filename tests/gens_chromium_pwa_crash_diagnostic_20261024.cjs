/* Diagnostic only: no production runtime changes. Real index.html and real service worker. */
'use strict';
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,firefox}=require('playwright');

const root=path.resolve(__dirname,'..');
const diagnosticsDir=path.join(root,'artifacts');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2'};

const server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch(_){res.writeHead(400);res.end();return}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    const stream=fs.createReadStream(file);
    stream.on('error',()=>res.destroy());
    stream.pipe(res);
  });
});

const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function bounded(promise,ms){
  let timer;
  try{return await Promise.race([promise,new Promise((_,rej)=>{timer=setTimeout(()=>rej(new Error('main-thread timeout '+ms+'ms')),ms)})])}
  finally{clearTimeout(timer)}
}
const installProbe=()=>{
  const p=window.__gensChromeProbe={started:Date.now(),ticks:0,frames:0,worstFrameGap:0,longTaskCount:0,longTaskTotal:0,longTaskMax:0,errors:[]};
  let previous=performance.now();
  function frame(t){p.frames++;const gap=t-previous;previous=t;if(gap>p.worstFrameGap)p.worstFrameGap=gap;requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
  setInterval(()=>{p.ticks++},250);
  window.addEventListener('error',e=>{if(p.errors.length<30)p.errors.push('error:'+String(e.message||e.error))});
  window.addEventListener('unhandledrejection',e=>{if(p.errors.length<30)p.errors.push('rejection:'+String(e.reason))});
  try{new PerformanceObserver(list=>{for(const e of list.getEntries()){p.longTaskCount++;p.longTaskTotal+=e.duration;p.longTaskMax=Math.max(p.longTaskMax,e.duration)}}).observe({entryTypes:['longtask']})}catch(_){}
};
async function scenario(browserType,name,sw,port){
  const record={browser:name,serviceWorker:sw?'enabled':'blocked',at:new Date().toISOString(),events:[],samples:[],requests:0,failed:0,httpErrors:0,consoleErrors:[],pageErrors:[],crashed:false};
  let browser,context;
  try{
    browser=await browserType.launch({headless:true,args:name==='chromium'?['--disable-dev-shm-usage']:[]});
    context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,isMobile:name==='chromium',locale:'fr-FR',serviceWorkers:sw?'allow':'block'});
    const page=await context.newPage();
    page.setDefaultTimeout(7000);
    page.on('crash',()=>{record.crashed=true;record.events.push('PAGE_CRASH')});
    page.on('close',()=>record.events.push('PAGE_CLOSED'));
    page.on('pageerror',e=>{if(record.pageErrors.length<30)record.pageErrors.push(String(e))});
    page.on('console',e=>{if(e.type()==='error'&&record.consoleErrors.length<30)record.consoleErrors.push(e.text())});
    page.on('request',()=>record.requests++);
    page.on('requestfailed',()=>record.failed++);
    page.on('response',r=>{if(r.status()>=400)record.httpErrors++});
    await page.addInitScript(installProbe);
    let cdp=null;
    if(name==='chromium'){
      cdp=await context.newCDPSession(page);
      await cdp.send('Performance.enable');
      // Approximate midrange-mobile CPU contention, without changing the game.
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:3});
    }
    const url='http://127.0.0.1:'+port+'/index.html';
    const started=Date.now();
    try{await bounded(page.goto(url,{waitUntil:'domcontentloaded',timeout:24000}),26000);record.events.push('DOMContentLoaded '+(Date.now()-started)+'ms')}
    catch(e){record.events.push('NAVIGATION_ERROR '+String(e).slice(0,200))}
    for(let i=0;i<9;i++){
      await pause(2000);
      if(record.crashed||page.isClosed())break;
      try{
        const snap=await bounded(page.evaluate(()=>{
          const p=window.__gensChromeProbe||{};
          return {time:Date.now(),readyState:document.readyState,visibility:document.visibilityState,menu:!!document.getElementById('menu'),ticks:p.ticks||0,frames:p.frames||0,worstFrameGap:Math.round(p.worstFrameGap||0),longTaskCount:p.longTaskCount||0,longTaskTotal:Math.round(p.longTaskTotal||0),longTaskMax:Math.round(p.longTaskMax||0),errors:(p.errors||[]).slice(0,5),memory:performance.memory?{used:performance.memory.usedJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null,swControlled:!!navigator.serviceWorker?.controller,swRegistrations:'serviceWorker' in navigator?null:'unsupported'}
        }),2500);
        if(cdp){try{const m=await bounded(cdp.send('Performance.getMetrics'),2000);for(const k of ['JSHeapUsedSize','Nodes','Documents','TaskDuration','ScriptDuration']){const met=m.metrics?.find(x=>x.name===k);if(met)snap[k]=met.value}}catch(e){record.events.push('CDP_ERROR '+String(e).slice(0,120))}}
        record.samples.push(snap);
      }catch(e){record.events.push('PROBE_STALLED '+String(e).slice(0,160));break}
    }
    try{record.sw=await bounded(page.evaluate(async()=>('serviceWorker' in navigator)?{controller:!!navigator.serviceWorker.controller,registrations:(await navigator.serviceWorker.getRegistrations()).map(x=>({scope:x.scope,active:x.active?.state,installing:x.installing?.state})),cacheNames:await caches.keys()}:null),2500)}catch(e){record.events.push('SW_INSPECT_TIMEOUT '+String(e).slice(0,140))}
    const a=record.samples;
    if(a.length>=2){
      record.summary={observedSeconds:Math.round((a.at(-1).time-a[0].time)/1000),ticksDelta:a.at(-1).ticks-a[0].ticks,framesDelta:a.at(-1).frames-a[0].frames,peakHeapBytes:Math.max(...a.map(x=>x.JSHeapUsedSize||x.memory?.used||0)),peakNodes:Math.max(...a.map(x=>x.Nodes||0)),worstFrameGapMs:Math.max(...a.map(x=>x.worstFrameGap||0))};
    }
  }catch(e){record.events.push('TEST_EXCEPTION '+String(e).slice(0,300))}
  finally{
    try{await bounded(context?.close()||Promise.resolve(),5000)}catch(_){}
    try{await bounded(browser?.close()||Promise.resolve(),5000)}catch(_){}
  }
  return record;
}

(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;
  const results=[];
  try{
    for(const [type,name,sw] of [[chromium,'chromium',false],[chromium,'chromium',true],[firefox,'firefox',false],[firefox,'firefox',true]]){
      const result=await scenario(type,name,sw,port);
      results.push(result);
      console.log('DIAGNOSTIC_SCENARIO '+JSON.stringify({browser:result.browser,serviceWorker:result.serviceWorker,crashed:result.crashed,summary:result.summary,events:result.events,errors:result.pageErrors}));
    }
  }finally{
    fs.mkdirSync(diagnosticsDir,{recursive:true});
    const out=path.join(diagnosticsDir,'chromium-pwa-diagnostic.json');
    fs.writeFileSync(out,JSON.stringify({purpose:'Desktop browser emulating touch/viewport and throttled CPU; NOT a physical Android Chrome reproduction',sha:process.env.GITHUB_SHA||'',results},null,2));
    console.log('REPORT '+out);
    server.closeAllConnections?.();
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
