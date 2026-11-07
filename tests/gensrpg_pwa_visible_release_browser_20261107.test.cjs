'use strict';
// Real mobile Chromium / installed-PWA regression, not a mocked service worker.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const oldSha='a'.repeat(40),newSha='b'.repeat(40);

test('installed old GenSRPG sees newer Pages, updates on click, preserves local data and other PWA cache',async()=>{
  const {stampShellForCommit,stampWorkerForCommit}=await import('../tools/version_pwa_release_worker.mjs');
  const old=stampShellForCommit(source,oldSha);
  const fresh=stampShellForCommit(source,newSha);
  const from=old.indexOf('const Z40K_APP_VERSION = ');
  const to=old.indexOf('/* Ancien ajout automatique',from);
  assert.ok(from>0&&to>from,'use the original public Shell update handler');
  const snippet=html=>html.slice(html.indexOf('const Z40K_APP_VERSION = '),
    html.indexOf('/* Ancien ajout automatique'));
  const html=(app,sha)=>'<html lang="fr"><head><meta name="z40k-app-version" content="gensrpg-release-'+sha.slice(0,12)+'"></head>'+
   '<body><div id="z40kUpdateBanner"><button class="z40kUpdateBtn" onclick="z40kApplyUpdate()">Mettre à jour</button></div>'+
   '<script>'+snippet(app)+'</script></body></html>';
  let newest=false;
  const oldWorker=stampWorkerForCommit(worker,oldSha),newWorker=stampWorkerForCommit(worker,newSha);
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    res.setHeader('Cache-Control','no-store');
    if(url.pathname==='/Zombicide-40k/service-worker.js'){
      res.setHeader('Content-Type','text/javascript');
      res.end(newest?newWorker:oldWorker);return;
    }
    if(url.pathname==='/Zombicide-40k/'||url.pathname==='/Zombicide-40k/index.html'){
      res.setHeader('Content-Type','text/html;charset=utf-8');
      res.end(newest?html(fresh,newSha):html(old,oldSha));return;
    }
    // Only the real worker's legacy CORE_FILES prefetches need harmless bytes.
    res.setHeader('Content-Type','text/plain');
    res.end('fixture');
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const address='http://127.0.0.1:'+server.address().port+'/Zombicide-40k/';
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
    const context=await browser.newContext({
      viewport:{width:932,height:430},isMobile:true,hasTouch:true,
      locale:'fr-FR',serviceWorkers:'allow'
    });
    const page=await context.newPage();
    page.setDefaultTimeout(25000);
    await page.goto(address,{waitUntil:'load'});
    await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
    await page.evaluate(async()=>{
      localStorage.setItem('gensrpg-save-sentinel','unchanged');
      await caches.open('gensrpg-preview-capture-v2-preserved');
      await new Promise((resolve,reject)=>{
        const open=indexedDB.open('gensrpg-existing-player-save',1);
        open.onupgradeneeded=()=>open.result.createObjectStore('data');
        open.onerror=()=>reject(open.error);
        open.onsuccess=()=>{
          const db=open.result,tx=db.transaction('data','readwrite');
          tx.objectStore('data').put('kept','world');
          tx.oncomplete=()=>{db.close();resolve()};
          tx.onerror=()=>reject(tx.error);
        };
      });
    });
    newest=true;
    // Existing installed page remains loaded, but the new version is now served.
    await page.evaluate(()=>z40kCheckPublishedVersion());
    assert.equal(await page.locator('#z40kUpdateBanner').evaluate(e=>e.classList.contains('show')),true,
      'old installed page must notice the new real Pages HTML');
    await page.locator('.z40kUpdateBtn').click();
    await page.waitForFunction(()=>
      document.querySelector('meta[name="z40k-app-version"]')?.content==='gensrpg-release-bbbbbbbbbbbb');
    assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg-save-sentinel')),'unchanged');
    assert.equal(await page.evaluate(async()=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('gensrpg-existing-player-save');
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{
        const db=req.result,tx=db.transaction('data','readonly');
        const get=tx.objectStore('data').get('world');
        get.onsuccess=()=>{db.close();resolve(get.result)};
        get.onerror=()=>reject(get.error);
      };
    })),'kept');
    assert.equal(await page.evaluate(async()=>{
      return (await caches.keys()).includes('gensrpg-preview-capture-v2-preserved');
    }),true,'root update must not evict an isolated preview PWA cache');
    await context.close();
  } finally {
    if(browser)await browser.close();
    await new Promise(ok=>server.close(ok));
  }
});
