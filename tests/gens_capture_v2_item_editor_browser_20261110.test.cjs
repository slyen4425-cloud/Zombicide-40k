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

  // The drop editor uses ONE official species registry, not a second
  // per-monster inventory. Filtering must not alter the other species.
  await frame.locator('#adventure-drop-filter').selectOption(templateSpecies[1]);
  assert.equal(await frame.locator('#adventure-drop-species').inputValue(),templateSpecies[1],
   'focused monster is also the edited monster, including fragment policy');
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),1,
   'one authored imported drop is visible for this published species');
  await frame.locator('#adventure-drop-filter').selectOption('');
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),9,
   'other monster drops remain present after switching the filter');

  // Override ONLY the selected monster's fragment chance and quantities.
  await frame.locator('#adventure-drop-species').selectOption(templateSpecies[0]);
  await frame.locator('#adventure-monster-fragments-panel summary').tap();
  await frame.locator('#adventure-monster-fragments-chance').fill('33');
  await frame.locator('#adventure-monster-fragments-min').fill('2');
  await frame.locator('#adventure-monster-fragments-max').fill('4');
  await frame.locator('#adventure-monster-fragments-save').tap();
  assert.match(await frame.locator('#adventure-monster-fragments-status').innerText(),
   /particulières enregistrées/);
  await frame.locator('#adventure-save-rules').tap();

  // Navigation replaces the iframe, but saves the SAME Capture AdventureRules
  // first. The preplay view has a summary rather than a competing item form.
  await frame.locator('#adventure-return-preparation').tap();
  await page.waitForFunction(()=>window.GensCaptureV2?.status?.().view==='adventure');
  await frame.locator('#adventure-loot-panel summary').first().tap();
  await frame.locator('#adventure-loot-preparation-count').filter({hasText:/9 objet\(s\)/})
   .waitFor({timeout:40000});
  assert.equal(await frame.locator('#adventure-item-authoring').isVisible(),false,
   'preplay must not expose a second catalogue or merchant editor');
  assert.match(await frame.locator('#adventure-loot-preparation-count').innerText(),
   /9 objet\(s\).*9 règle\(s\) de drop/s);
  await frame.locator('#adventure-open-item-editor').tap();
  await page.waitForFunction(()=>window.GensCaptureV2?.status?.().view==='items');
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({timeout:40000});
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),9);
  assert.equal(await frame.locator('#adventure-drops .rule-row').count(),9);
  assert.equal(await frame.locator('#adventure-money-plural').inputValue(),'jetons');
  await frame.locator('#adventure-drop-species').selectOption(templateSpecies[0]);
  assert.equal(await frame.locator('#adventure-monster-fragments-chance').inputValue(),'33');
  assert.equal(await frame.locator('#adventure-monster-fragments-min').inputValue(),'2');
  assert.equal(await frame.locator('#adventure-monster-fragments-max').inputValue(),'4');

  const big=await frame.locator('#adventure-loot-panel').boundingBox();
  assert.ok(big.width>300&&big.width<=932,'editor fits phone landscape viewport');
  assert.deepEqual(errors.filter(e=>/Uncaught|SyntaxError|Duplicate Capture|Competing Capture/.test(e)),[]);
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});

test('real smartphone merchant: proximity iframe opens only canonical shop and buys/sells through one session',
 {timeout:95000},async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:932,height:430},
   serviceWorkers:'block',locale:'fr-FR'});
  const page=await context.newPage(),origin='http://127.0.0.1:'+server.address().port;
  await page.route('**/merchant-host.html',route=>route.fulfill({
   status:200,contentType:'text/html',
   body:'<!doctype html><meta charset="utf-8"><body data-adventure-playing="true">'+
    '<iframe id="native-explorer"></iframe>'+
    '<dialog id="adventure-merchant-dialog" aria-labelledby="adventure-merchant-title">'+
    '<h2 id="adventure-merchant-title"></h2><p id="adventure-merchant-balance"></p>'+
    '<div id="adventure-merchant-trades"></div>'+
    '<output id="adventure-merchant-message"></output>'+
    '<button id="adventure-merchant-close">Retour au monde</button></dialog></body>'
  }));
  await page.goto(origin+'/merchant-host.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const card={id:'crea_nat_1',name:'Grainou',
    skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]};
   const contract=await import('/assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
   const rules=contract.normalizeAdventureRulesV1({
    ...contract.DEFAULT_ADVENTURE_RULES_V1,
    loot:{currencyPerVictory:0,items:[
     {id:'wood',name:'Bois',saleValue:0},
     {id:'potion',name:'Potion',saleValue:4}],drops:[]},
    economy:{currency:{singular:'jeton',plural:'jetons'},merchants:[{
     id:'merchant-test',name:'Marchand de la forêt',buysItems:true,
     offers:[{itemId:'potion',currencyPrice:8,
      resourceCosts:[{itemId:'wood',quantity:1}],stock:2}]
    }]}
   });
   const base=contract.createAdventureSessionV1({
    bestiaryCards:[card],starterId:card.id,rules,
    ids:{sessionId:'merchant-session',instanceId:'merchant-creature'},
    now:'2026-11-10T20:00:00.000Z'
   });
   window.__merchantSession={...base,status:'playing',
    inventory:{currency:30,items:{wood:2}}};
   const host=await import('/assets/gensrpg/capture-v2/adventure-merchant-play-v1.mjs');
   const iframe=document.getElementById('native-explorer');
   iframe.srcdoc='<script>window.openNativeShop=()=>parent.postMessage('+
    '{schema:"gensrpg.exploration.npc.merchant.open.v1",'+
    'sessionId:"merchant-session",merchantId:"merchant-test",actorId:"actor-1"},'+
    'parent.location.origin);window.addEventListener("message",event=>{'+
    'if(event.data?.schema==="gensrpg.capture.v2.npc.merchant.closed.v1")'+
    'window.shopWasClosed=true;});</script>';
   host.installAdventureMerchantPlayV1({
    window,document,frame:iframe,load:()=>window.__merchantSession,
    save:session=>{window.__merchantSession=session;},
    sessionId:()=>window.__merchantSession.sessionId,
    bestiaryCards:()=>[card],hasPendingCombat:()=>false,afterSave:()=>{}
   });
  });
  await page.waitForFunction(()=>
   typeof document.getElementById('native-explorer').contentWindow.openNativeShop==='function');
  await page.evaluate(()=>document.getElementById('native-explorer').contentWindow.openNativeShop());
  await page.locator('#adventure-merchant-dialog[open]').waitFor();
  assert.match(await page.locator('#adventure-merchant-title').innerText(),/Marchand de la forêt/);
  assert.match(await page.locator('#adventure-merchant-balance').innerText(),/30 jetons/);
  await page.getByRole('button',{name:'Acheter'}).click();
  await page.waitForFunction(()=>window.__merchantSession.inventory.items.potion===1);
  assert.equal(await page.evaluate(()=>window.__merchantSession.inventory.currency),22);
  assert.equal(await page.evaluate(()=>window.__merchantSession.inventory.items.wood),1);
  assert.equal(await page.evaluate(()=>
   window.__merchantSession.merchantStocks['merchant-test'].potion),1);
  await page.getByRole('button',{name:'Vendre'}).click();
  await page.waitForFunction(()=>
   window.__merchantSession.inventory.currency===26);
  assert.equal(await page.evaluate(()=>
   window.__merchantSession.inventory.items.potion??0),0);
  await page.locator('#adventure-merchant-close').click();
  await page.waitForFunction(()=>
   document.getElementById('native-explorer').contentWindow.shopWasClosed===true);
  assert.equal(await page.locator('#adventure-merchant-dialog').evaluate(e=>e.open),false);
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
