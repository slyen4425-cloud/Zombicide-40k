'use strict';
// Run the ACTUAL GenSrpg service worker on a secure localhost page and fetch
// an approved immutable Lab sprite with the official asset resolver. This is
// a controlled browser warm/offline check, NOT a claim of Android installation.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body><main id="offline-probe">PWA officielle testée en ligne puis hors réseau</main>
<script src="/assets/gensrpg/core/asset-resolver-v1.js"></script>
</body></html>`;
const type={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.png':'image/png','.webp':'image/webp','.css':'text/css'};
async function serve(){
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname==='/pwa-offline-probe'){
    res.writeHead(200,{'Content-Type':type['.html'],'Cache-Control':'no-store'}).end(html);return;
   }
   const rel=pathname.replace(/^[/]+/,'');
   if(!rel||rel.split('/').includes('..')){res.writeHead(403).end();return;}
   for(const dir of [site,root]){
    const name=path.resolve(dir,rel);
    if(!name.startsWith(dir+path.sep))continue;
    try{
     const bytes=await fs.readFile(name);
     res.writeHead(200,{'Content-Type':type[path.extname(name)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(bytes);return;
    }catch{}
   }
   res.writeHead(404).end();
  }catch(error){res.writeHead(500).end(String(error));}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 return {server,origin:'http://127.0.0.1:'+server.address().port};
}

async function renderOfficialSprite(page){
 return page.evaluate(async()=>{
  const root='/assets/gensrpg/capture/runtime-data/';
  const [inputs,catalog,metadata]=await Promise.all(
   ['author-inputs.json','global-visual-assets.json','source.json'].map(async file=>{
    const res=await fetch(root+file);if(!res.ok)throw new Error('Official signed resource missing: '+file);
    return res.json();
   })
  );
  if(!globalThis.GensAssetResolverV1?.resolveCaptureLabAsset){
   throw new Error('Canonical Capture asset resolver missing');
  }
  const creature=inputs.creatureTransfers.find(c=>c.draft?.id==='crea_voltik');
  const id=creature?.draft?.presentation?.visual?.front?.assetId;
  if(!id)throw new Error('Exact Voltige author sprite missing');
  const media=globalThis.GensAssetResolverV1.resolveCaptureLabAsset({
   catalog,assetId:id,commit:metadata.assetsSha,
   approvedCommit:metadata.assetsSha,approvedRepository:metadata.assetsRepository
  });
  const url=media.url;
  if(!url.startsWith('https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/'+
      metadata.assetsSha+'/assets/library/'))throw Error('Not an official SHA-pinned Lab image');
  const image=document.createElement('img');
  image.alt='Sprite officiel hors ligne';image.src=url;document.body.append(image);
  await image.decode();
  const cached=await caches.match(url);
  return {url,width:image.naturalWidth,height:image.naturalHeight,
   cached:!!cached,swControlled:!!navigator.serviceWorker.controller};
 });
}

for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': official resolver image is cached by real PWA, then restored offline after a controlled reload',
  {timeout:180000},async()=>{
  const {server,origin}=await serve();
  let browser;
  try{
   browser=await engine.launch({headless:true});
   const context=await browser.newContext({viewport:{width:932,height:430},
    hasTouch:true,serviceWorkers:'allow'});
   const page=await context.newPage();page.setDefaultTimeout(60000);
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin+'/pwa-offline-probe');
   const worker=await page.evaluate(async()=>{
    if(!('serviceWorker' in navigator))throw Error('PWA service workers unavailable');
    const reg=await navigator.serviceWorker.register('/service-worker.js',{scope:'/'});
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller){
     await new Promise((ok,bad)=>{
      const timeout=setTimeout(()=>bad(Error('Service worker never controlled page')),60000);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timeout);ok()},{once:true});
     });
    }
    return {scope:reg.scope,controlled:!!navigator.serviceWorker.controller};
   });
   assert.equal(worker.controlled,true,'real service worker should control the test page');
   // A controlled online navigation stores the exact document and its scripts,
   // so a second navigation truly exercises the PWA offline document fallback.
   await page.reload();
   assert.ok(await page.locator('#offline-probe').isVisible());
   const online=await renderOfficialSprite(page);
   assert.ok(online.width>0&&online.height>0,'real remote official sprite must decode');
   assert.equal(online.swControlled,true);
   assert.equal(online.cached,true,'real SW must own the approved pinned image cache');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.ok(await page.locator('#offline-probe').isVisible(),
    'offline navigation must restore the previously controlled page');
   const offline=await renderOfficialSprite(page);
   assert.equal(offline.url,online.url,'offline sprite must preserve official SHA and ID');
   assert.equal(offline.width,online.width);
   assert.equal(offline.cached,true);
   assert.equal(offline.swControlled,true);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{
   await browser?.close();server.closeAllConnections();
   await new Promise(ok=>server.close(ok));
  }
 });
}
