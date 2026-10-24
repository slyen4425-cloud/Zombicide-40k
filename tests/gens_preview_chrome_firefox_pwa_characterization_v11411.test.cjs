const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,firefox}=require('playwright');

const root=path.join(__dirname,'..');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const serviceWorker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

const staleIndex='<!doctype html><html><head><meta charset="utf-8"><title>STALE GenSrpG</title></head><body style="margin:0;background:#fff;color:#fff"><div id="stale-index-marker">STALE_INDEX_FROM_PWA_CACHE</div></body></html>';
const freshIndex='<!doctype html><html><head><meta charset="utf-8"><title>FRESH GenSrpG</title></head><body style="margin:0;background:#080808;color:#fff"><div id="fresh-index-marker">FRESH_INDEX_FROM_NETWORK</div><script>window.__sourceBooted=true;if("serviceWorker" in navigator)navigator.serviceWorker.register("service-worker.js").catch(()=>{});<\/script></body></html>';

let indexMode='fresh';
let indexRequests=[];

function send(res,status,type,body){
  res.writeHead(status,{'content-type':type,'cache-control':'no-store'});
  res.end(body);
}

const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');
  const pathname=decodeURIComponent(u.pathname);
  if(pathname==='/preview.html'||pathname==='/')return send(res,200,'text/html; charset=utf-8',preview);
  if(pathname==='/service-worker.js')return send(res,200,'text/javascript; charset=utf-8',serviceWorker);
  if(pathname==='/seed.html')return send(res,200,'text/html; charset=utf-8','<!doctype html><html><body>seed</body></html>');
  if(pathname==='/index.html'){
    indexRequests.push({mode:indexMode,search:u.search});
    return send(res,200,'text/html; charset=utf-8',indexMode==='stale'?staleIndex:freshIndex);
  }
  if(/\.js$/i.test(pathname))return send(res,200,'text/javascript; charset=utf-8','window.__previewStubCount=(window.__previewStubCount||0)+1;');
  if(/\.(?:json|webmanifest)$/i.test(pathname))return send(res,200,'application/json; charset=utf-8','{}');
  if(/\.(?:png|jpg|jpeg|webp|gif|mp3|wav|ogg|m4a)$/i.test(pathname))return send(res,200,'application/octet-stream','stub');
  return send(res,200,'text/plain; charset=utf-8','stub');
});

async function snapshot(page,label,errors,failed,httpErrors){
  return page.evaluate(({label,errors,failed,httpErrors})=>({
    label,
    href:location.href,
    title:document.title,
    ready:document.documentElement?.dataset?.gensrpgPreviewReady||'',
    fresh:!!document.getElementById('fresh-index-marker'),
    stale:!!document.getElementById('stale-index-marker'),
    sourceBooted:window.__sourceBooted===true,
    background:getComputedStyle(document.body).backgroundColor,
    controller:navigator.serviceWorker?.controller?.scriptURL||'',
    text:(document.body?.innerText||'').slice(0,160),
    errors,failed,httpErrors
  }),{label,errors:[...errors],failed:[...failed],httpErrors:[...httpErrors]});
}

async function runScenario(browserType,name,controlled,port){
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  const errors=[]; const failed=[]; const httpErrors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('requestfailed',r=>failed.push((r.failure()?.errorText||'failed')+' '+new URL(r.url()).pathname));
  page.on('response',r=>{if(r.status()>=400)httpErrors.push(r.status()+' '+new URL(r.url()).pathname)});
  try{
    if(controlled){
      indexMode='stale';
      await page.goto(`http://127.0.0.1:${port}/seed.html`,{waitUntil:'domcontentloaded'});
      await page.evaluate(async()=>{
        const reg=await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;
        return reg.scope;
      });
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      indexMode='fresh';
    }else{
      indexMode='fresh';
    }

    await page.goto(`http://127.0.0.1:${port}/preview.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1');
    const state=await snapshot(page,`${name}-${controlled?'controlled-stale-cache':'fresh-profile'}`,errors,failed,httpErrors);
    state.registrations=await page.evaluate(async()=>('serviceWorker' in navigator)?(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope):[]);
    state.cacheKeys=await page.evaluate(async()=>('caches' in window)?await caches.keys():[]);
    return state;
  }finally{
    await context.close();
    await browser.close();
  }
}

(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;
  const results=[];
  try{
    results.push(await runScenario(chromium,'chromium',false,port));
    results.push(await runScenario(firefox,'firefox',false,port));
    results.push(await runScenario(chromium,'chromium',true,port));
    results.push(await runScenario(firefox,'firefox',true,port));

    console.log(JSON.stringify({scenario:'GenSrpG preview browser/PWA characterization',results,indexRequests},null,2));

    const chromeFresh=results.find(x=>x.label==='chromium-fresh-profile');
    const firefoxFresh=results.find(x=>x.label==='firefox-fresh-profile');
    const chromeControlled=results.find(x=>x.label==='chromium-controlled-stale-cache');
    const firefoxControlled=results.find(x=>x.label==='firefox-controlled-stale-cache');

    assert.equal(chromeFresh.fresh,true,'fresh Chromium profile must load current index.html');
    assert.equal(firefoxFresh.fresh,true,'fresh Firefox profile must load current index.html');
    assert.equal(chromeFresh.stale,false);
    assert.equal(firefoxFresh.stale,false);

    assert.equal(
      chromeControlled.fresh,
      true,
      'preview must not reuse stale index.html from a preexisting GenSrpG service-worker cache in Chromium; state='+JSON.stringify(chromeControlled)
    );
    assert.equal(chromeControlled.stale,false,'Chromium controlled preview must never render stale cached index.html');
    assert.equal(firefoxControlled.fresh,true,'same SHA and same controlled-cache state must also remain fresh in Firefox');
    assert.equal(firefoxControlled.stale,false,'Firefox controlled preview must never render stale cached index.html');
  }finally{
    try{server.closeAllConnections?.()}catch(_){}
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
