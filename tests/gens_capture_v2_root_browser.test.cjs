'use strict';
// Real app gate: open the FOUR-MODE GenSrpg root, choose Capture, and use
// the two unchanged, main-pinned Lab UIs. No legacy Capture harness / fake data.
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const vendor=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.css':'text/css;charset=utf-8','.webmanifest':'application/manifest+json',
 '.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml',
 '.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const rel=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
  if(rel.split('/').includes('..')){res.writeHead(403).end();return;}
  let file,body;
  for(const folder of [vendor,root]){
   const candidate=path.resolve(folder,rel);
   if(!candidate.startsWith(folder+path.sep))continue;
   try{body=await fs.readFile(candidate);file=candidate;break;}catch{}
  }
  if(!body){res.writeHead(404).end('Missing real file: '+rel);return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(body);
 }catch(e){res.writeHead(500).end(String(e));}
});
test('real four-mode root enters the NEW Capture Shell and opens original pinned Labs, no old Hub',
 {timeout:115000},async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser,context;
 const errors=[];
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   serviceWorkers:'block',locale:'fr-FR'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.GensCaptureV2&&
   !!window.GensShellModuleLaunchV1&&
   document.querySelectorAll('button.gensRootModeCard').length===4,null,{timeout:60000});
  assert.equal(await page.locator('button.gensRootModeCard').count(),4);
  assert.equal(await page.locator('#captureGameHub').count(),0);
  assert.equal(await page.evaluate(()=>window.GensCaptureV1.VERSION),'2.0.0');
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),false);
  await page.locator('button.gensRootModeCard.capture').tap();
  await page.locator('#gensFamilyGames [data-rpg-profile] .gensUniverseMainBtn').first().waitFor();
  const choices=await page.locator('#gensFamilyGames [data-rpg-profile]').count();
  assert.ok(choices>=1,'Actual Capture built-in profile must still be selectable from the Shell');
  await page.locator('#gensFamilyGames [data-rpg-profile] .gensUniverseMainBtn').first().tap();
  await page.waitForFunction(()=>window.GensShellModuleLaunchV1.activeModule()==='capture',
   null,{timeout:20000});
  assert.equal(await page.evaluate(()=>window.GensShellModuleLaunchV1.startModuleSession('capture')),true);
  await page.locator('#gensCaptureV2Root').waitFor({state:'visible'});
  assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-view="explore"]').count(),0);
  const buttons=page.locator('#gensCaptureV2Root [data-capture-v2-view]');
  assert.equal(await buttons.count(),7);
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="creature"]').tap();
  const iframe=page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="combat"]');
  await iframe.waitFor({state:'visible'});
  assert.match(await iframe.getAttribute('src'),/vendor\/combat-lab\/examples\/dom-demo\/capture-editor-v2\.html/);
  await page.frameLocator('#gensCaptureV2Root iframe').locator('[data-capture-editor-human]').waitFor({timeout:25000});
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="bestiary"]').tap();
  await page.frameLocator('#gensCaptureV2Root iframe').locator('[data-bestiary]').waitFor({timeout:25000});
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="explore"]').tap();
  await page.frameLocator('#gensCaptureV2Root iframe').locator('canvas#game').waitFor({timeout:25000});
  assert.equal(await page.locator('button.gensRootModeCard').count(),4);
  await page.getByRole('button',{name:'Quitter le mode'}).tap();
  assert.equal(await page.locator('#gensCaptureV2Root').count(),0);
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),false);
  // No assertion about XP/encounters or Lab session/save ownership: deferred.
  assert.deepEqual(errors.filter(x=>/GensCaptureV2|Competing Capture|Duplicate Capture/.test(x)),[]);
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
