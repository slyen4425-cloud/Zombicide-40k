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

test('real landscape UI: library, drops, fragments and NPC shop share one saved Capture owner',
 {timeout:185000},async()=>{
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
  await page.locator('#gensCaptureV2Root [data-capture-universe-select="monster-invoc"]').tap();
  const frame=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  async function editor(kind,first=false){
   if(!first)await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
   await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
   await page.locator('#gensCaptureV2Root [data-capture-v2-view="'+kind+'"]').tap();
   await page.waitForFunction(value=>window.GensCaptureV2?.status().view===value,kind);
   await frame.locator('#adventure-drop-species:not([disabled])').waitFor({
    state:'attached',timeout:45000});
  }
  await editor('items',true);
  assert.equal(await frame.locator('#adventure-library-view').isVisible(),true);
  assert.equal(await frame.locator('#adventure-drops-view').isVisible(),false);
  assert.equal(await frame.locator('#adventure-economy-panel').isVisible(),false);
  await frame.locator('[data-capture-item-category="resource"]').tap();
  await frame.locator('#adventure-item-search').fill('Relique témoin');
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),0);
  await frame.locator('#adventure-item-name').fill('Relique témoin');
  await frame.locator('#adventure-item-value').fill('37');
  await frame.locator('#adventure-item-add').tap();
  assert.match(await frame.locator('#adventure-items').innerText(),/Relique témoin.*37 pièces/s);
  await frame.locator('#adventure-items .rule-row').first()
   .getByRole('button',{name:'Modifier'}).tap();
  await frame.locator('#adventure-item-name').fill('Relique témoin corrigée');
  await frame.locator('#adventure-item-value').fill('48');
  await frame.locator('#adventure-item-add').tap();
  await frame.locator('#adventure-item-search').fill('Relique témoin corrigée');
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),1);
  await frame.locator('#adventure-save-rules').tap();
  await page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
   .evaluate(iframe=>iframe.contentWindow.location.reload());
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({state:'attached',timeout:45000});
  await frame.locator('[data-capture-item-category="resource"]').tap();
  await frame.locator('#adventure-item-search').fill('Relique témoin corrigée');
  assert.equal(await frame.locator('#adventure-items .rule-row').count(),1,
   'the original saved AdventureRules owns the edited item after reload');
  // Fragment records are virtual: always derived from the published Bestiary.
  await frame.locator('[data-capture-item-category="fragment"]').tap();
  assert.equal(await frame.locator('#adventure-fragment-library-list').isVisible(),true);
  assert.ok(await frame.locator('[data-capture-fragment-cards] .adventure-item-library-card').count()>0);
  assert.equal(await frame.locator('#adventure-fragments-panel').count(),1,
   'fragment settings are MOVED, not copied');
  
  await editor('drops');
  assert.equal(await frame.locator('#adventure-drops-view').isVisible(),true);
  assert.equal(await frame.locator('#adventure-library-view').isVisible(),false);
  const initialDrops=await frame.locator('#adventure-drops .rule-row').count();
  assert.ok(initialDrops>0,'newly published species already have official default drops');
  const species=await frame.locator('#adventure-drop-species option').first().getAttribute('value');
  await frame.locator('#adventure-drop-species').selectOption(species);
  await frame.locator('#adventure-drop-item').selectOption({label:'Relique témoin corrigée'});
  await frame.locator('#adventure-drop-chance').fill('35');
  await frame.locator('#adventure-drop-min').fill('1');
  await frame.locator('#adventure-drop-max').fill('2');
  await frame.locator('#adventure-drop-add').tap();
  const authored=frame.locator('#adventure-drops .rule-row')
   .filter({hasText:'Relique témoin corrigée'});
  assert.equal(await authored.count(),1);
  await authored.getByRole('button',{name:'Modifier'}).tap();
  await frame.locator('#adventure-drop-chance').fill('47');
  await frame.locator('#adventure-drop-add').tap();
  assert.match(await authored.innerText(),/47 %/);
  await frame.locator('#adventure-save-rules').tap();
  await page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
   .evaluate(iframe=>iframe.contentWindow.location.reload());
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({state:'attached',timeout:45000});
  assert.equal(await frame.locator('#adventure-drops .rule-row')
   .filter({hasText:'Relique témoin corrigée'}).count(),1);
  

  await editor('merchant');
  assert.equal(await frame.locator('#adventure-economy-panel').isVisible(),true);
  assert.equal(await frame.locator('#adventure-drops-view').isVisible(),false);
  await frame.locator('#adventure-money-singular').fill('jeton');
  await frame.locator('#adventure-money-plural').fill('jetons');
  await frame.locator('#adventure-merchant-name').fill('Marchand témoin');
  await frame.locator('#adventure-merchant-search').fill('Relique témoin corrigée');
  await frame.locator('#adventure-merchant-library input[aria-label="Proposer Relique témoin corrigée"]').check();
  assert.equal(await frame.locator('#adventure-merchant-selected-count').innerText(),
    '1 objet(s) proposés parmi 11');
  await frame.locator('#adventure-merchant-add').tap();
  assert.equal(await frame.locator('#adventure-merchants .rule-row').count(),1);
  await frame.locator('#adventure-save-rules').tap();
  await page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
   .evaluate(iframe=>iframe.contentWindow.location.reload());
  await frame.locator('#adventure-merchants .rule-row').waitFor({state:'visible',timeout:45000});
  await frame.locator('#adventure-merchants .rule-row').first()
   .getByRole('button',{name:'Modifier'}).tap();
  assert.equal(await frame.locator('#adventure-merchant-sell-percent').inputValue(),'10');
  assert.equal(await frame.locator('#adventure-merchant-buy-percent').inputValue(),'-50');
  assert.equal(await frame.locator('#adventure-merchant-library input:checked').count(),1);

  // Real Shell routing (same iframe, same stored AdventureRules): opening the
  // selected PNJ's linked merchant preselects this shop and returning restores
  // the specific saved NPC instead of losing authoring context.

  const linkedId=await frame.locator('#adventure-merchants .rule-row')
   .first().getAttribute('data-merchant-id');
  assert.ok(linkedId,'real merchant must have a stable ID');
  assert.equal(await page.evaluate(merchantId=>window.GensCaptureV2.open('merchant',{
   returnTo:'npc',npcId:'npc-linked-test',merchantId
  }),linkedId),true);
  assert.equal(await page.locator('#gensCaptureV2Root iframe').evaluate(el=>
   new URL(el.src).searchParams.get('npcId')),'npc-linked-test');
  await page.waitForFunction(()=>{
   const doc=document.querySelector('#gensCaptureV2Root iframe')?.contentDocument;
   return /Boutique liée à ton PNJ/.test(
    doc?.querySelector('#adventure-status')?.textContent??'');
  },null,{timeout:45000});
  assert.equal(await frame.locator('#adventure-merchant-name').inputValue(),'Marchand témoin');
  assert.equal(await frame.locator('#adventure-merchant-buy-percent').inputValue(),'-50');
  const size=await frame.locator('#adventure-loot-panel').boundingBox();
  assert.ok(size&&size.width>300&&size.width<=932,'landscape editor stays inside viewport');
  await frame.locator('#adventure-return-preparation').tap();
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),'npc');
  assert.equal(await page.locator('#gensCaptureV2Root iframe').evaluate(el=>
   new URL(el.src).searchParams.get('edit')),'npc-linked-test');
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
     {id:'potion',name:'Potion',saleValue:4},
     {id:'relique',name:'Relique',saleValue:10}],drops:[]},
    economy:{currency:{singular:'jeton',plural:'jetons'},merchants:[{
     id:'merchant-test',name:'Marchand de la forêt',buysItems:true,
     offers:[{itemId:'potion',currencyPrice:8,
      resourceCosts:[{itemId:'wood',quantity:1}],stock:2}]
    },{id:'merchant-simple',name:'Marchand simple',
      itemIds:['relique'],sellPercent:10,buyPercent:-50}]}
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
   iframe.srcdoc='<script>window.openNativeShop=(merchantId="merchant-test")=>parent.postMessage('+
    '{schema:"gensrpg.exploration.npc.merchant.open.v1",'+
    'sessionId:"merchant-session",merchantId,actorId:"actor-1"},'+
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
  // Same real Exploration NPC message, this time for the new percentage model.
  await page.evaluate(()=>document.getElementById('native-explorer')
   .contentWindow.openNativeShop('merchant-simple'));
  await page.locator('#adventure-merchant-dialog[open]').waitFor();
  assert.match(await page.locator('#adventure-merchant-title').innerText(),/Marchand simple/);
  assert.match(await page.locator('#adventure-merchant-trades').innerText(),
   /Relique · 11 jetons.*illimité/s);
  await page.getByRole('button',{name:'Acheter'}).click();
  await page.waitForFunction(()=>window.__merchantSession.inventory.items.relique===1);
  assert.equal(await page.evaluate(()=>window.__merchantSession.inventory.currency),15);
  assert.equal(await page.evaluate(()=>
   window.__merchantSession.merchantStocks?.['merchant-simple']),undefined,
   'modern merchant does not maintain individual stock');
  assert.match(await page.locator('#adventure-merchant-trades').innerText(),
   /Relique · 5 jetons \/ unité/s);
  await page.getByRole('button',{name:'Vendre'}).click();
  await page.waitForFunction(()=>window.__merchantSession.inventory.currency===20);
  assert.equal(await page.evaluate(()=>window.__merchantSession.inventory.items.relique??0),0);
  await page.locator('#adventure-merchant-close').click();
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
