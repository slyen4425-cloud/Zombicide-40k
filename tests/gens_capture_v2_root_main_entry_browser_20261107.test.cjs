'use strict';
// Production browser path: ONE installed GenSRPG entry -> published Capture V2
// -> real official Adventure iframe -> original GenSRPG home. Never run V1.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const mount='/Zombicide-40k/';
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.css':'text/css;charset=utf-8','.webmanifest':'application/manifest+json',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp',
 '.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(!url.pathname.startsWith(mount)){res.writeHead(404).end('outside main scope');return}
  const rel=decodeURIComponent(url.pathname.slice(mount.length))||'index.html';
  const file=path.resolve(site,rel);
  if(!file.startsWith(site+path.sep)){res.writeHead(403).end('forbidden');return}
  const body=await fs.readFile(file);
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
 }catch(error){res.writeHead(404).end('missing resource')}
});
test('public main Capture click opens the ONE V2 owner, Jouer is native, return preserves main menu',
 {timeout:180000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
    isMobile:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const base='http://127.0.0.1:'+server.address().port+mount;
  const errors=[];
  const missing=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()===404)missing.push(r.url())});
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>
    typeof window.GensCaptureMainEntryV1?.open==='function' &&
    !!document.querySelector('script[data-gensrpg-main-capture-route="v2"]'),
    null,{timeout:30000});
  await page.locator('button.gensRootModeCard.capture').tap();
  await page.waitForURL(/\\/preview\\/capture-v2-pr225\\/index\\.html\\?entry=gensrpg-main$/,{timeout:60000});
  const capture=page.locator('#gensCaptureV2Root');
  await capture.waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#gensCaptureV2Root').count(),1);
  assert.equal(await page.evaluate(()=>window.GensCaptureV2?.status().active),true);
  const back=page.locator('a.gensCaptureReturnToMain');
  await back.waitFor({state:'attached'});
  assert.equal(await back.getAttribute('href'),base);
  await page.locator('[data-capture-v2-view="adventure"]').tap();
  const adventure=page.frameLocator('#gensCaptureV2Root iframe');
  await adventure.locator('#adventure-create').waitFor({state:'attached',timeout:45000});
  await page.locator('.gensCaptureV2NativeBack').tap();
  await back.tap();
  await page.waitForURL(base,{timeout:30000});
  await page.locator('button.gensRootModeCard.survival').waitFor({state:'attached'});
  assert.deepEqual(missing,[],'all main and V2 native resources must resolve from one publisher');
  assert.deepEqual(errors.filter(e=>/Duplicate Capture|GensCaptureV2/.test(e)),[],
    'no duplicate Capture runtime may become active');
 }finally{
  await context?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await new Promise(resolve=>server.close(resolve));
 }
});
