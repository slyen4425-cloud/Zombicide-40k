'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');

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
  assert.equal(await frame.locator('#adventure-monster-fragments-panel').count(),1);
  assert.equal(await frame.locator('#adventure-fragment-species').isVisible(),true);
  
  await editor('drops');
  assert.equal(await frame.locator('#adventure-drops-view').isVisible(),true);
  assert.equal(await frame.locator('#adventure-library-view').isVisible(),false);
  const initialDrops=await frame.locator('#adventure-drops .rule-row').count();
  assert.ok(initialDrops>0,'newly published species already have official default drops');
  const species=await frame.locator('#adventure-drop-species option').first().getAttribute('value');
  await frame.locator('#adventure-drop-species').selectOption(species);
  assert.equal(await frame.locator('#adventure-drop-filter').isVisible(),false,
   'drop editor must show ONE monster picker, not two');
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
  

  // Merchant does not have a menu anymore. The historical deep link stays
  // compatible for existing NPC references; the NEW workflow is in the NPC.
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-view="merchant"]').count(),0);
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.open('merchant')),true);
  await frame.locator('#adventure-drop-species:not([disabled])').waitFor({state:'attached',timeout:45000});
  assert.equal(await frame.locator('#adventure-economy-panel').isVisible(),true);
  assert.equal(await frame.locator('#adventure-drops-view').isVisible(),false);
  assert.equal(await frame.locator('#adventure-loot-global-rewards').isVisible(),false,
   'global victory coins and denomination must NOT be merchant options');
  await frame.locator('#adventure-merchant-name').fill('Marchand témoin');
  // The modern merchant catalog is deliberately collapsed on landscape.
  await frame.locator('#adventure-economy-panel > details > summary').tap();
  await frame.locator('#adventure-merchant-search').fill('Relique témoin corrigée');
  await frame.locator('#adventure-merchant-library input[aria-label="Proposer Relique témoin corrigée"]').check();
  const stockField='#adventure-merchant-library input[aria-label="Stock du Relique témoin corrigée (vide : illimité)"]';
  await frame.locator(stockField).fill('3');
  assert.match(await frame.locator('#adventure-merchant-selected-count').innerText(),
    /^1 sélectionné\(s\) \/ 1 affiché\(s\) dans cette catégorie$/,
    'the selected canonical resource is checked regardless of unrelated published species');
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
  assert.equal(await frame.locator(stockField).inputValue(),'3',
   'capped stock survives a real saved-universe reload and merchant re-edit');

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
  // A real message from the scoped iframe with a removed merchant reference
  // must show an actionable error in the existing dialog, not invent a shop.
  const beforeMissing=await page.evaluate(()=>JSON.stringify(window.__merchantSession));
  await page.evaluate(()=>document.getElementById('native-explorer')
   .contentWindow.openNativeShop('merchant-removed'));
  await page.locator('#adventure-merchant-dialog[open]').waitFor({timeout:5000});
  assert.match(await page.locator('#adventure-merchant-message').innerText(),
   /boutique.*introuvable.*partie/i);
  assert.equal(await page.locator('#adventure-merchant-trades button').count(),0);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__merchantSession)),beforeMissing);
  await page.evaluate(()=>{document.getElementById('native-explorer').contentWindow.shopWasClosed=false;});
  await page.locator('#adventure-merchant-close').click();
  await page.waitForFunction(()=>
   document.getElementById('native-explorer').contentWindow.shopWasClosed===true);
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
  // A queued purchase must not execute against a later opening, even for
  // the identical shop. Hold the production shared lock, close/reopen, release.
  await page.waitForFunction(()=>!document.querySelector('#adventure-merchant-dialog').open);
  await page.evaluate(()=>document.getElementById('native-explorer').contentWindow.openNativeShop('merchant-simple'));
  await page.locator('#adventure-merchant-dialog[open]').waitFor();
  const beforeQueued=await page.evaluate(()=>JSON.stringify(window.__merchantSession));
  await page.evaluate(()=>{
   void navigator.locks.request('gensrpg.capture.v2.adventure-combat:merchant-session',()=>
    new Promise(resolve=>{window.releaseMerchantLock=resolve;}));
  });
  await page.waitForFunction(()=>typeof window.releaseMerchantLock==='function');
  await page.getByRole('button',{name:'Acheter'}).click();
  await page.waitForFunction(async()=>{
   const state=await navigator.locks.query();
   return state.pending.some(lock=>lock.name==='gensrpg.capture.v2.adventure-combat:merchant-session');
  });
  await page.locator('#adventure-merchant-close').click();
  await page.waitForFunction(()=>!document.querySelector('#adventure-merchant-dialog').open);
  // Wait for the close lifecycle before issuing a new native request.
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
  await page.evaluate(()=>document.getElementById('native-explorer').contentWindow.openNativeShop('merchant-simple'));
  await page.locator('#adventure-merchant-dialog[open]').waitFor();
  await page.evaluate(()=>window.releaseMerchantLock());
  await page.getByRole('button',{name:'Acheter'}).waitFor();
  await page.waitForFunction(()=>!Array.from(document.querySelectorAll('#adventure-merchant-trades button')).some(b=>b.disabled));
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__merchantSession)),beforeQueued,
   'closing the shop cancels the queued trade, even when the same shop reopens');
  await page.locator('#adventure-merchant-close').click();
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});

test('merchant edits inside the saved NPC; official Capture commits the inventory and only merchantId is linked', 
 {timeout:195000},async()=>{
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
  await page.locator('button.gensRootModeCard.capture').tap();
  await page.locator('#gensCaptureV2Root [data-capture-universe-select="monster-invoc"]').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  assert.equal(await page.locator('[data-capture-v2-view="merchant"]').count(),0,
   'standalone merchant navigation must be gone');
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="npc"]').tap();
  const npc=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]');
  // IndexedDB NPC catalog must finish its initial async refresh BEFORE form
  // interaction; otherwise that refresh intentionally clears unsaved fields.
  await npc.locator('#npc-count:has-text("PNJ enregistrés")')
   .waitFor({state:'visible',timeout:45000});
  await npc.locator('#npc-name').fill('Marchand intégré témoin');
  await npc.locator('#npc-role').selectOption('merchant');
  // A genuine user-uploaded 64×64 PNG, not an invented Bestiary entry.
  const png=new PNG({width:64,height:64});
  for(let i=0;i<png.data.length;i+=4){
   png.data[i]=64;png.data[i+1]=170;png.data[i+2]=140;png.data[i+3]=255;
  }
  const art=PNG.sync.write(png);
  await npc.locator('#npc-image').setInputFiles({name:'marchand-test.png',mimeType:'image/png',buffer:art});
  await npc.locator('#npc-save').tap();
  await npc.locator('#npc-status:has-text("PNJ enregistré")').waitFor({timeout:15000});
  const npcId=await npc.locator('#npc-saved').inputValue();
  assert.match(npcId,/^npc\.user\./,'saving must keep the official minted NPC ID');
  await npc.locator('#npc-merchant-config > summary').tap();
  await npc.locator('#npc-merchant-configure').tap();
  const merchant=npc.frameLocator('#npc-merchant-frame');
  await merchant.locator('#adventure-merchant-name').waitFor({state:'visible',timeout:60000});
  assert.equal(await merchant.locator('body').getAttribute('data-adventure-item-embed'),'npc');
  assert.equal(await merchant.locator('#adventure-loot-global-rewards').isVisible(),false);
  await merchant.locator('#adventure-merchant-library input[type="checkbox"]').first().check();
  await merchant.locator('#adventure-merchant-library input[aria-label^="Stock du "]').first().fill('2');
  await merchant.locator('#adventure-merchant-add').click({noWaitAfter:true});
  await npc.locator('#npc-status').filter({hasText:/Boutique enregistrée et liée|Articles et tarifs enregistrés/}).waitFor({timeout:60000});
  // Read the actual saved NPC authority, not an obsolete shop selector.
  const storedMerchantId=()=>npc.locator('body').evaluate(async(_,id)=>{
   const {createUserNpcStoreV1}=await import('./src/storage/user-npc-store-v1.js');
   return (await createUserNpcStoreV1().get(id))?.npc?.merchantId;
  },npcId);
  const merchantId=await storedMerchantId();
  assert.match(merchantId,/^merchant-/,'the saved PNJ must receive the Capture merchantId');
  await npc.locator('#npc-merchant-configure').tap();
  await merchant.locator('#adventure-merchant-name').waitFor({state:'visible',timeout:60000});
  await merchant.locator('#adventure-merchant-library input:checked').first().waitFor({timeout:40000});
  assert.equal(await storedMerchantId(),merchantId,
   'link survives reload, without creating a second shop');
  // Place the exact authored definition (not copied NPC data) in a real
  // WorldDocument; launch the native Adventure using its normal UI.
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  const adventure=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  await adventure.locator('#adventure-start-new').tap();
  await adventure.locator('#adventure-create:not([disabled])').waitFor({timeout:25000});
  await adventure.locator('#adventure-official-hero-grid .adventure-official-hero-card').first().tap();
  await page.waitForFunction(()=>/^hero\.user\.[a-f0-9-]{36}$/.test(
   document.querySelector('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
    ?.contentDocument?.querySelector('#adventure-hero-choice')?.value??''),null,{timeout:45000});
  await adventure.locator('#adventure-player-alias').fill('Marchand témoin');
  await adventure.locator('#adventure-create').tap();
  const fixture=await adventure.locator('#adventure-play').evaluate(async(_,ids)=>{
   const [{createBlankWorldBuilderDraft},{saveWorldAssemblerDraft},{normalizeWorldActorPlacement},
    {createUserNpcStoreV1},{createAdventureStoreV1},{createAdventurePortfolioStoreV1},
    {adventureMerchantPriceV1}]=await Promise.all([
     import('../../../vendor/exploration-lab/src/builder/world-builder-draft.js'),
     import('../../../vendor/exploration-lab/src/builder/world-assembler-handoff.js'),
     import('../../../vendor/exploration-lab/src/actors/world-actor-placement-model.js'),
     import('../../../vendor/exploration-lab/src/storage/user-npc-store-v1.js'),
     import('./adventure-contract-v1.mjs'),import('./adventure-portfolio-store-v1.mjs'),
     import('./adventure-economy-v1.mjs')
   ]);
   const npc=await createUserNpcStoreV1().get(ids.npcId);
   if(!npc)throw Error('PNJ enregistré introuvable');
   const world=createBlankWorldBuilderDraft({id:'merchant-ci-world',width:36*28,height:24*21});
   const area=world.areas.find(a=>a.id===world.initialAreaId);
   const spawn=area.spawns.find(s=>s.id===world.initialSpawnId);
   area.actors.push(normalizeWorldActorPlacement({id:'merchant-placement-'+crypto.randomUUID(),
    actorDefinitionId:ids.npcId,x:spawn.x+20,y:spawn.y,facingX:1}));
   saveWorldAssemblerDraft(localStorage,world);
   const options={storage:localStorage,coreStorage:window.GensStorageV1};
   const portfolio=createAdventurePortfolioStoreV1({...options,legacyStore:createAdventureStoreV1(options)});
   const session=portfolio.load();
   const shop=session.rules.economy.merchants.find(m=>m.id===ids.merchantId);
   const item=session.rules.loot.items.find(i=>i.id===shop.itemIds[0]);
   if(shop.itemStocks[item.id]!==2)throw Error('Stock créé non transporté');
   // Only fixture funding; all subsequent transactions are performed by UI.
   const currency=1000+adventureMerchantPriceV1(item.saleValue,shop.sellPercent)*2;
   portfolio.save({...session,inventory:{...session.inventory,currency}});
   return {sessionId:session.sessionId,itemId:item.id,merchantId:shop.id,
    buy:adventureMerchantPriceV1(item.saleValue,shop.sellPercent),
    sell:adventureMerchantPriceV1(item.saleValue,shop.buyPercent),currency};
  },{npcId,merchantId});
  const readSave=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+id)),fixture.sessionId);
  const play=adventure.frameLocator('#adventure-play-frame');
  await adventure.locator('#adventure-play').tap();
  await play.locator('#npc-talk').waitFor({state:'visible',timeout:45000});
  await play.locator('#npc-talk').tap();
  await adventure.locator('#adventure-merchant-dialog[open]').waitFor({timeout:15000});
  await adventure.getByRole('button',{name:'Acheter',exact:true}).tap();
  await page.waitForFunction(f=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+f.sessionId))?.merchantStocks?.[f.merchantId]?.[f.itemId]===1,fixture);
  let saved=await readSave();
  assert.equal(saved.inventory.currency,fixture.currency-fixture.buy);
  assert.equal(saved.inventory.items[fixture.itemId],1);
  await adventure.getByRole('button',{name:'Vendre',exact:true}).tap();
  await page.waitForFunction(f=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+f.sessionId))?.inventory.currency===f.currency-f.buy+f.sell,fixture);
  saved=await readSave();
  assert.equal(saved.inventory.items[fixture.itemId]??0,0);
  assert.equal(saved.merchantStocks[fixture.merchantId][fixture.itemId],1);
  await adventure.locator('#adventure-merchant-close').tap();
  await play.locator('#play-menu-button').tap();
  await adventure.locator('#adventure-menu-return-title').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  await adventure.locator('#adventure-start-load').tap();
  await adventure.locator('#adventure-save-gallery [data-save-id="'+fixture.sessionId+'"]').tap();
  await adventure.locator('#adventure-save-load').tap();
  await adventure.locator('#adventure-play:not([disabled])').tap();
  await play.locator('#npc-talk').waitFor({state:'visible',timeout:45000});
  await play.locator('#npc-talk').tap();
  await adventure.locator('#adventure-merchant-dialog[open]').waitFor({timeout:15000});
  await adventure.getByRole('button',{name:'Acheter',exact:true}).tap();
  await page.waitForFunction(f=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+f.sessionId))?.merchantStocks?.[f.merchantId]?.[f.itemId]===0,fixture);
  saved=await readSave();
  assert.equal(saved.inventory.currency,fixture.currency-2*fixture.buy+fixture.sell);
  assert.equal(saved.inventory.items[fixture.itemId],1);
  assert.equal(await adventure.getByRole('button',{name:'Acheter',exact:true}).isDisabled(),true);
  await adventure.locator('#adventure-merchant-close').tap();
  assert.deepEqual(errors.filter(e=>/SyntaxError|Uncaught|Duplicate Capture/.test(e)),[]);
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
