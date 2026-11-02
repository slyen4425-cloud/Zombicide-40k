'use strict';
// Test the actual SAME-ORIGIN URL subdirectory the existing GenSrpg Pages
// publisher will serve, not the html-preview.github.io cross-origin bridge.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const scope='/preview/capture-v2-pr225/';
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.json':'application/json;charset=utf-8','.css':'text/css;charset=utf-8',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
 '.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(request,response)=>{
 try{
  const rel=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
  const full=path.resolve(site,rel);
  if(!full.startsWith(site+path.sep)){response.writeHead(403).end();return;}
  const bytes=await fs.readFile(full);
  response.writeHead(200,{'content-type':mime[path.extname(full)]||'application/octet-stream',
   'cache-control':'no-store'}).end(bytes);
 }catch(e){response.writeHead(404).end('Missing _site resource');}
});
test('one-origin nested Pages URL renders real Capture/Combat/2.5D and leaves root unchanged',
 {timeout:180000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 const errors=[];
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})};});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+scope+'index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.GensCaptureV2&&
   document.querySelectorAll('button.gensRootModeCard').length===4,null,{timeout:60000});
  assert.equal(await page.locator('button.gensRootModeCard').count(),4);
  await page.locator('button.gensRootModeCard.capture').tap();
  await page.locator('[data-capture-v2-view="creature"]').tap();
  const combat=page.locator('#gensCaptureV2Root iframe');
  await combat.waitFor({state:'visible'});
  const source=await combat.getAttribute('src');
  assert.ok(source.includes(scope+'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html'),
   'Combat must load inside the single isolated Pages origin: '+source);
  const combatFrame=page.frameLocator('#gensCaptureV2Root iframe');
  await combatFrame.locator('[data-editor-test-combat]:not([disabled])')
   .waitFor({state:'visible',timeout:30000});
  await combatFrame.locator('[data-editor-test-combat]').tap();
  const arena=combatFrame.locator('[data-combat-arena]:visible');
  await arena.waitFor({timeout:30000});
  const geometry=await arena.evaluate(node=>{
   const rect=node.getBoundingClientRect();
   return {width:rect.width,height:rect.height,w:innerWidth,h:innerHeight};
  });
  assert.ok(geometry.width>=geometry.w*.65&&geometry.height>=geometry.h*.65,
   'Real native Combat main arena too small in nested Pages: '+JSON.stringify(geometry));
  await combatFrame.locator('[data-preview-back-editor]').tap();
  await combatFrame.locator('[data-capture-editor-human]:visible').waitFor();
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('[data-capture-v2-view="builder"]').tap();
  const frame=page.locator('#gensCaptureV2Root iframe');
  assert.ok((await frame.getAttribute('src')).includes(scope+'vendor/exploration-lab/sculpt-lab.html'));
  const sculpt=page.frameLocator('#gensCaptureV2Root iframe');
  const canvas=sculpt.locator('#sculpt-canvas');
  await canvas.waitFor({timeout:25000});
  await canvas.evaluate(async c=>{
   for(let i=0;i<75;i++){
    if(typeof window.__sculptLabProbe==='function'&&c.width>300&&c.height>150)return;
    await new Promise(resolve=>setTimeout(resolve,300));
   }
   throw Error('Official Exploration 2.5D did not initialize');
  });
  const img=PNG.sync.read(await canvas.screenshot({animations:'disabled',timeout:30000}));
  const colors=new Set();
  for(let y=1;y<=8;y++)for(let x=1;x<=8;x++){
   const i=(Math.floor(img.height*y/9)*img.width+Math.floor(img.width*x/9))*4;
   colors.add([img.data[i],img.data[i+1],img.data[i+2]].join(','));
  }
  assert.ok(colors.size>=4,'2.5D map must paint varied real terrain, not fake black canvas');
  const tester=sculpt.locator('#navigation-toggle');
  await tester.tap();
  await sculpt.locator('#navigation-stick:visible').waitFor({timeout:8000});
  assert.equal(await tester.getAttribute('aria-pressed'),'true');
  await tester.tap();
  assert.equal(await tester.getAttribute('aria-pressed'),'false');
  const rootHtml=await page.request.get(base+'/index.html');
  assert.equal(rootHtml.status(),200);
  assert.doesNotMatch(await rootHtml.text(),
   /assets\/gensrpg\/capture-v2\/shell-entry-v1\.js/,
   'production root cannot be replaced by unapproved Capture V2 candidate');
  assert.deepEqual(errors.filter(t=>/GensCaptureV2|Duplicate Capture/.test(t)),[]);
  console.log('GENSRPG_CAPTURE_V2_NESTED_PAGES_PROOF',JSON.stringify({
   scope,arena:geometry,terrainColors:colors.size,source:'immutable main Labs'
  }));
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
});
