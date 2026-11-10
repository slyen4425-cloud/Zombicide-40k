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
  assert.equal(await frame.locator('#adventure-item-import').isDisabled(),false,
   'verified user-uploaded icons make the optional official import available');
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
  assert.equal(await frame.locator('#adventure-item-icon option').count(),13,
   'all twelve real uploaded pictures must be selectable in the single editor');
  await frame.locator('#adventure-items .rule-row').first()
   .getByRole('button',{name:'Modifier'}).tap();
  await frame.locator('#adventure-item-icon').selectOption('visuel-pieuvre');
  await frame.locator('#adventure-item-add').tap();
  assert.equal(await frame.locator('#adventure-items img.sheet-item-icon').count(),1,
   'unassigned author picture is usable without pretending Pieuvre is Krakenor');

  const templateSpecies=await frame.locator('body').evaluate(async()=>{
   const response=await fetch('./item-templates.v1.json',{cache:'no-store'});
   if(!response.ok)throw Error('Missing verified item manifest');
   return (await response.json()).items.map(item=>item.speciesId);
  });
  const publishedIds=new Set(officialSpecies.map(x=>x.id));
  assert.equal(templateSpecies.length,8);
  assert.ok(templateSpecies.every(id=>publishedIds.has(id)),
   'every automatic creature drop must refer to the actual published Combat Bestiary');
  await frame.locator('#adventure-item-import').tap();
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),9);
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),9);
  const images=frame.locator('#adventure-items img.sheet-item-icon');
  assert.equal(await images.count(),9);
  await images.first().evaluate(img=>img.decode());
  await images.nth(1).evaluate(img=>img.decode());
  await frame.locator('#adventure-save-rules').tap();
  await page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
   .evaluate(iframe=>iframe.contentWindow.location.reload());
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({timeout:40000});
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),9,
   'imported items persist through the one AdventureRules save owner');
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),9);
  await frame.locator('#adventure-item-import').tap();
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),9,
   "reimport must never duplicate the author's items");
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),9);

  // Real native UI: edit world currency + a merchant that sells an authored
  // item for coins AND a second resource, without any NPC/map duplication.
  await frame.locator('#adventure-economy-panel summary').tap();
  await frame.locator('#adventure-money-singular').fill('jeton');
  await frame.locator('#adventure-money-plural').fill('jetons');
  await frame.locator('#adventure-merchant-name').fill('Marchand témoin');
  await frame.locator('#adventure-merchant-add').tap();
  assert.equal(await frame.locator('#adventure-merchants .rule-row').count(),1);
  assert.ok(await frame.locator('#adventure-merchant-item option[value^="fragment:"]').count()>0,
   'a rare merchant may offer fragments of published creatures, not a fake item');
  await frame.locator('#adventure-merchant-item').selectOption({index:0});
  await frame.locator('#adventure-merchant-resource').selectOption({index:2});
  await frame.locator('#adventure-merchant-resource-qty').fill('2');
  await frame.locator('#adventure-merchant-resource-add').tap();
  assert.equal(await frame.locator('#adventure-merchant-resource-list .rule-row').count(),1);
  await frame.locator('#adventure-merchant-price').fill('7');
  await frame.locator('#adventure-merchant-unlimited').uncheck();
  await frame.locator('#adventure-merchant-stock').fill('3');
  await frame.locator('#adventure-merchant-offer-add').tap();
  assert.equal(await frame.locator('#adventure-merchant-offers .rule-row').count(),1);
  assert.match(await frame.locator('#adventure-merchant-offers').innerText(),
   /7 jetons.*stock 3/s);
  await frame.locator('#adventure-save-rules').tap();
  await page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
   .evaluate(iframe=>iframe.contentWindow.location.reload());
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({timeout:40000});
  assert.equal(await frame.locator('#adventure-money-plural').inputValue(),'jetons');
  assert.equal(await frame.locator('#adventure-merchants .rule-row').count(),1,
   'merchant persists with the canonical AdventureRules draft');
  assert.equal(await frame.locator('#adventure-merchant-offers .rule-row').count(),1);
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),9,
   'merchant configuration may not create or duplicate item definitions');

  const big=await frame.locator('#adventure-loot-panel').boundingBox();
  assert.ok(big.width>300&&big.width<=932,'editor fits phone landscape viewport');
  assert.deepEqual(errors.filter(e=>/Uncaught|SyntaxError|Duplicate Capture|Competing Capture/.test(e)),[]);
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
