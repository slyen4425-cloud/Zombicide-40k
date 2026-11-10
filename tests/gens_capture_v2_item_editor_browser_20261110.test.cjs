'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');

const site=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.css':'text/css;charset=utf-8','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
   .replace(/^\/+/,'')||'index.html';
  const name=path.resolve(site,rel);
  if(!name.startsWith(site+path.sep)){res.writeHead(403).end();return;}
  const bytes=await fs.readFile(name);
  res.writeHead(200,{'Content-Type':types[path.extname(name)]||
   'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
 }catch(error){res.writeHead(404).end('Missing real published asset');}
});

test('real smartphone editor: one native view, create/edit drop, save and reload without duplicate owner',
 {timeout:125000},async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:932,height:430},
   hasTouch:true,serviceWorkers:'block',locale:'fr-FR'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.GensCaptureV2&&
   document.querySelectorAll('button.gensRootModeCard').length===4,null,{timeout:60000});
  await page.locator('button.gensRootModeCard.capture').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  await page.locator('#gensCaptureV2Root [data-editor-group="economy"] [data-capture-v2-view="items"]').tap();
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),'items');
  const frame=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  await frame.locator('#adventure-loot-panel:visible').waitFor({timeout:30000});
  await frame.locator('#adventure-status').waitFor({timeout:30000});
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({timeout:40000});
  const officialSpecies=await frame.locator('#adventure-drop-species option')
   .evaluateAll(nodes=>nodes.map(x=>({id:x.value,name:x.textContent})));
  console.log('AUTHORED_DROP_OFFICIAL_SPECIES',JSON.stringify(officialSpecies));
  assert.equal(await frame.locator('body').getAttribute('data-adventure-item-editor'),'true');
  assert.equal(await frame.locator('#adventure-item-import').isDisabled(),true,
   'do not invent official item images before deposit');
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),0);
  assert.equal(await frame.locator('#adventure-create:visible').count(),0,
   'item editor must not expose a second game creation screen');

  await frame.locator('#adventure-item-name').fill('Relique témoin');
  await frame.locator('#adventure-item-value').fill('37');
  await frame.locator('#adventure-item-add').tap();
  assert.match(await frame.locator('#adventure-items').innerText(),/Relique témoin.*37 pièces/s);
  const item=frame.locator('#adventure-items .rule-row').first();
  await item.getByRole('button',{name:'Modifier'}).tap();
  await frame.locator('#adventure-item-name').fill('Relique témoin corrigée');
  await frame.locator('#adventure-item-value').fill('48');
  await frame.locator('#adventure-item-add').tap();
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),1,
   'editing must preserve item identity, not duplicate it');
  assert.match(await frame.locator('#adventure-items').innerText(),/Relique témoin corrigée.*48 pièces/s);

  await frame.locator('#adventure-drop-species').selectOption({index:0});
  await frame.locator('#adventure-drop-chance').fill('35');
  await frame.locator('#adventure-drop-min').fill('1');
  await frame.locator('#adventure-drop-max').fill('2');
  await frame.locator('#adventure-drop-add').tap();
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),1);
  await frame.locator('#adventure-drops .rule-row button').last().tap(); // Modifier
  await frame.locator('#adventure-drop-chance').fill('47');
  await frame.locator('#adventure-drop-add').tap();
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),1,
   'editing must update one encounter rule, not create a duplicate');
  assert.match(await frame.locator('#adventure-drops').innerText(),/47 %/);
  await frame.locator('#adventure-save-rules').tap();
  await page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
   .evaluate(iframe=>iframe.contentWindow.location.reload());
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({timeout:40000});
  assert.match(await frame.locator('#adventure-items').innerText(),/Relique témoin corrigée.*48 pièces/s,
   'reload must use the same canonical AdventureRules draft');
  assert.match(await frame.locator('#adventure-drops').innerText(),/47 %/);
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),1);

  const big=await frame.locator('#adventure-loot-panel').boundingBox();
  assert.ok(big.width>300&&big.width<=932,'editor fits phone landscape viewport');
  assert.deepEqual(errors.filter(e=>/Uncaught|SyntaxError|Duplicate Capture|Competing Capture/.test(e)),[]);
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
