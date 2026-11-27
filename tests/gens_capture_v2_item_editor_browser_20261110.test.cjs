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
   const choice=page.locator('#gensCaptureV2Root [data-capture-v2-view="'+kind+'"]');
   const group=choice.locator('xpath=ancestor::details[1]');
   if(await group.getAttribute('open')===null)await group.locator('summary').tap();
   await choice.tap();
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
 {timeout:300000},async()=>{
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
  // Authoring a world after already having a save used to write the shop
  // only to that save, while the next Nouvelle partie ignored it.
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  const prior=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  await prior.locator('#adventure-start-new').tap();
  await prior.locator('#adventure-create:not([disabled])').waitFor({timeout:25000});
  await prior.locator('#adventure-official-hero-grid .adventure-official-hero-card').first().tap();
  await page.waitForFunction(()=>/^hero\.user\.[a-f0-9-]{36}$/.test(
   document.querySelector('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')
    ?.contentDocument?.querySelector('#adventure-hero-choice')?.value??''),null,{timeout:45000});
  await prior.locator('#adventure-player-alias').fill('Partie précédente');
  await prior.locator('#adventure-create').tap();
  await prior.locator('#adventure-play:not([disabled])').waitFor({timeout:25000});
  const oldSessionId=await page.evaluate(()=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.portfolio.v1')).selectedSessionId);
  assert.ok(oldSessionId);
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  assert.equal(await page.locator('[data-capture-v2-view="merchant"]').count(),0,
   'standalone merchant navigation must be gone');
  if(await page.locator('[data-editor-group="npc"]').getAttribute('open')===null)await page.locator('[data-editor-group="npc"] > summary').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="npc"]').tap();
  const npc=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]');
  // IndexedDB NPC catalog must finish its initial async refresh BEFORE form
  // interaction; otherwise that refresh intentionally clears unsaved fields.
  await npc.locator('#npc-count:has-text("PNJ enregistrés")')
   .waitFor({state:'visible',timeout:45000});
  await npc.locator('#npc-name').fill('Marchand intégré témoin');
  await npc.locator('#npc-role').selectOption('merchant');
  await npc.locator('#npc-dialogue').fill('Bienvenue dans ma boutique !');
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
  assert.equal(await npc.locator('#npc-merchant-choice').count(),0,'no competing shop picker in the native NPC editor');
  await npc.locator('#npc-merchant-config > summary').tap();
  await npc.locator('#npc-merchant-configure').tap();
  const merchant=npc.frameLocator('#npc-merchant-frame');
  await merchant.locator('#adventure-merchant-name').waitFor({state:'visible',timeout:60000});
  assert.equal(await merchant.locator('body').getAttribute('data-adventure-item-embed'),'npc');
  assert.equal(await merchant.locator('#adventure-loot-global-rewards').isVisible(),false);
  await merchant.locator('#adventure-merchant-category').selectOption('usable');
  await merchant.getByRole('checkbox',{name:'Proposer Potion de soins',exact:true}).check();
  await merchant.getByRole('checkbox',{name:'Proposer Potion de réanimation',exact:true}).check();
  const stockInput=merchant.getByRole('spinbutton',{name:'Stock du Potion de soins (vide : illimité)',exact:true});
  const stockBox=await stockInput.boundingBox();
  assert.ok(stockBox&&stockBox.width>=90&&stockBox.height>=40,'stock control readable on mobile');
  assert.equal(await stockInput.getAttribute('placeholder'),'Illimité');
  assert.equal(await merchant.locator('#adventure-status').isVisible(),true,'inline validation remains visible before save');
  await stockInput.fill('3');
  await merchant.getByRole('spinbutton',{name:'Stock du Potion de réanimation (vide : illimité)',exact:true}).fill('3');
  await merchant.locator('#adventure-merchant-add').click({noWaitAfter:true});
  await npc.locator('#npc-status').filter({hasText:/Boutique enregistrée et liée|Articles et tarifs enregistrés/}).waitFor({timeout:60000});
  // The native NPC owner closes the child iframe on successful refresh.
  // The parent status above is the visible acknowledgement after linking.
  // Read the actual saved NPC authority, not an obsolete shop selector.
  const storedMerchantId=()=>npc.locator('body').evaluate(async(_,id)=>{
   const {createUserNpcStoreV1}=await import('./src/storage/user-npc-store-v1.js');
   return (await createUserNpcStoreV1().get(id))?.npc?.merchantId;
  },npcId);
  const merchantId=await storedMerchantId();
  assert.equal(merchantId,'merchant-'+npcId,'new PNJ gets a stable automatic shop reference');
  await npc.locator('#npc-merchant-configure').tap();
  await merchant.locator('#adventure-merchant-name').waitFor({state:'visible',timeout:60000});
  await merchant.locator('#adventure-merchant-category').selectOption('usable');
  await merchant.locator('#adventure-merchant-library input:checked').first().waitFor({timeout:40000});
  assert.equal(await storedMerchantId(),merchantId,
   'link survives reload, without creating a second shop');
  assert.equal(await merchant.getByRole('spinbutton',{name:'Stock du Potion de soins (vide : illimité)',exact:true}).inputValue(),'3');
  assert.equal(await merchant.getByRole('spinbutton',{name:'Stock du Potion de réanimation (vide : illimité)',exact:true}).inputValue(),'3');
  // Verify the exact Capture-owned modal used by the editor test bridge.
  // Read existing authored rules, buy with test funds, close, and prove that
  // neither the old save nor the future-game draft was mutated.
  const snapshot=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage)
   .filter(k=>k.includes('gensrpg.capture.v2.adventure')).sort()
   .map(k=>[k,localStorage.getItem(k)])));
  const beforeTest=await snapshot();
  await page.evaluate(id=>{
   const testFrame=document.createElement('iframe');
   testFrame.id='merchant-test-fixture';
   testFrame.style='position:fixed;inset:0;width:100vw;height:100dvh;z-index:99999;background:white';
   const url=new URL('assets/gensrpg/capture-v2/adventure.html',document.baseURI);
   url.searchParams.set('merchantTest',id);
   url.searchParams.set('merchantTestNonce',crypto.randomUUID());
   testFrame.src=url.href;document.body.append(testFrame);
  },merchantId);
  const preview=page.frameLocator('#merchant-test-fixture');
  await preview.locator('#adventure-merchant-dialog[open]').waitFor({timeout:60000});
  assert.match(await preview.locator('#adventure-merchant-balance').innerText(),/TEST.*fictif/);
  assert.match(await preview.locator('#adventure-merchant-trades').innerText(),/Potion de soins.*stock 3/);
  await preview.getByRole('button',{name:'Acheter',exact:true}).first().tap();
  await preview.locator('#adventure-merchant-trades').filter({hasText:/Potion de soins.*stock 2/}).waitFor();
  assert.deepEqual(await snapshot(),beforeTest,'simulation must not write any Adventure persistence');
  await preview.locator('#adventure-merchant-close').tap();
  await page.locator('#merchant-test-fixture').evaluate(frame=>frame.remove());
  assert.deepEqual(await snapshot(),beforeTest);
  // Seed only a blank map; placement/removal/replacement and saving must
  // pass through the actual World Builder, not injected actor records.
  await npc.locator('body').evaluate(async()=>{
   const {createBlankWorldBuilderDraft}=await import('./src/builder/world-builder-draft.js');
   const {openWorldDocumentReleaseAccessV1}=await import('./src/storage/world-document-release-access-v1.js');
   const access=await openWorldDocumentReleaseAccessV1({storage:localStorage,sessionStorage});
   if(!access.durable)throw Error('Durable owner required');
   const world=createBlankWorldBuilderDraft({id:'merchant-ci-world',width:36*28,height:24*21});
   // This fixture originally seeded only a draft, not an archived blank.
   // Archiving before NPC placement introduces a stale archive on resume.
   await access.saveDraft(world,await access.readDraft());
   if((await access.readDraft())?.id!==world.id)throw Error('World seed not committed');
   if((await access.list()).some(entry=>entry.id===world.id))throw Error('Merchant draft fixture must not create a stale blank archive');
  });
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  if(await page.locator('[data-editor-group="world"]').getAttribute('open')===null)await page.locator('[data-editor-group="world"] > summary').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="world"]').tap();
  const builder=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]');
  await builder.locator('#world-workspace-map').tap();
  await builder.locator('#sculpt-canvas').waitFor({state:'visible',timeout:45000});
  const nativeFrame=page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]');
  await page.waitForFunction(id=>document.querySelector('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]')
   ?.contentWindow?.__sculptActorsProbe?.()?.definitions?.includes(id),npcId,{timeout:45000});
  await builder.locator('#mode-objects').tap();
  await builder.locator('#actor-open').tap();
  const chooseNpc=async()=>{
   await builder.locator('#actor-npc-library-open').tap();
   await builder.locator('#actor-npc-gallery button').filter({hasText:'Marchand intégré témoin'}).tap();
  };
  const canvas=builder.locator('#sculpt-canvas');
  const place=async()=>{
   await canvas.scrollIntoViewIfNeeded();
   const position=await canvas.evaluate(el=>{
    const p=window.__sculptLabProbe(),rect=el.getBoundingClientRect();
    for(const [cx,cy] of [[18,12],[17,12],[18,11],[17,11]]){
     const x=rect.left+p.cameraPan.x+(cx+.5)*28*p.zoom;
     const y=rect.top+p.cameraPan.y+(cy+.5)*21*p.zoom;
     if(document.elementFromPoint(x,y)===el)return {x:x-rect.left,y:y-rect.top};
    }
    throw Error('No reachable World Builder cell near the start');
   });
   await canvas.tap({position});
  };
  const count=()=>nativeFrame.evaluate(el=>el.contentWindow.__sculptActorsProbe().count);
  await chooseNpc();
  await place();
  assert.equal(await count(),1);
  await builder.locator('#actor-action').selectOption('remove');
  await place();
  assert.equal(await count(),0);
  await chooseNpc();
  await place();
  assert.equal(await count(),1);
  // Real Tester button in the actual World Builder. Both the host and
  // Capture shop are native iframes; no synthetic merchant-open message.
  await builder.locator('#navigation-toggle').tap();
  await builder.locator('#npc-talk').waitFor({state:'visible',timeout:45000});
  const testBefore=await snapshot();
  const testShop=builder.frameLocator('#npc-merchant-test-frame');
  const openTesterShop=async()=>{
   await builder.locator('#npc-talk').tap();
   await builder.locator('#npc-dialogue-next').filter({hasText:'Commercer'}).tap();
   await builder.locator('#npc-merchant-test-dialog[open]').waitFor();
   await testShop.locator('#adventure-merchant-dialog[open]').waitFor({timeout:60000});
   assert.match(await testShop.locator('#adventure-merchant-balance').innerText(),/TEST.*fictif/);
   assert.match(await testShop.locator('#adventure-merchant-trades').innerText(),/Potion de soins.*stock 3/);
   assert.match(await testShop.locator('#adventure-merchant-trades').innerText(),/Potion de réanimation.*stock 3/);
  };
  await openTesterShop();
  await testShop.getByRole('button',{name:'Acheter',exact:true}).first().tap();
  await testShop.locator('#adventure-merchant-trades').filter({hasText:/Potion de soins.*stock 2/}).waitFor();
  assert.deepEqual(await snapshot(),testBefore);
  await testShop.locator('#adventure-merchant-close').tap();
  await builder.locator('#npc-merchant-test-dialog').waitFor({state:'hidden'});
  await builder.locator('#npc-talk').waitFor({state:'visible'});
  await openTesterShop();
  await builder.locator('#npc-merchant-test-close').tap();
  await builder.locator('#npc-merchant-test-dialog').waitFor({state:'hidden'});
  assert.deepEqual(await snapshot(),testBefore,'Tester must never write Adventure persistence');
  await builder.locator('#navigation-toggle').tap();
  await builder.locator('#world-workspace-world').tap();
  await builder.locator('#world-workspace-map').waitFor({state:'visible',timeout:45000});
  const placed=await builder.locator('body').evaluate(async()=>{
   const {openWorldDocumentReleaseAccessV1}=await import('./src/storage/world-document-release-access-v1.js');
   const access=await openWorldDocumentReleaseAccessV1({storage:localStorage,sessionStorage});
   if(!access.durable)throw Error('Durable WorldDocument owner required for merchant verification');
   const world=await access.readDraft();
   if(!world)throw Error('Merchant map not durably saved after return to World Builder');
   return world.areas.find(a=>a.id===world.initialAreaId).actors;
  });
  assert.equal(placed.length,1);
  assert.equal(placed[0].actorDefinitionId,npcId);
  assert.equal(placed[0].npc,undefined,'placed actor must not duplicate the canonical NPC definition');
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
   const [{createAdventureStoreV1},{createAdventurePortfolioStoreV1},
    {adventureMerchantPriceV1}]=await Promise.all([
     import('./adventure-contract-v1.mjs'),import('./adventure-portfolio-store-v1.mjs'),
     import('./adventure-economy-v1.mjs')
   ]);
   const options={storage:localStorage,coreStorage:window.GensStorageV1};
   const portfolio=createAdventurePortfolioStoreV1({...options,legacyStore:createAdventureStoreV1(options)});
   const session=portfolio.load();
   const shop=session.rules.economy.merchants.find(m=>m.id===ids.merchantId);
   if(!shop)throw Error('Marchand configuré après une ancienne partie absent de la nouvelle partie');
   const item=session.rules.loot.items.find(i=>i.id==='item.potion.heal');
   if(shop.itemStocks[item.id]!==3||shop.itemStocks['item.potion.revive']!==3)
    throw Error('Stocks 3/3 non transportés vers la nouvelle partie');
   // Only fixture funding; all subsequent transactions are performed by UI.
   const currency=1000+adventureMerchantPriceV1(item.saleValue,shop.sellPercent)*3;
   portfolio.save({...session,inventory:{...session.inventory,currency}});
   return {sessionId:session.sessionId,itemId:item.id,merchantId:shop.id,
    buy:adventureMerchantPriceV1(item.saleValue,shop.sellPercent),
    sell:adventureMerchantPriceV1(item.saleValue,shop.buyPercent),currency};
  },{npcId,merchantId});
  assert.notEqual(fixture.sessionId,oldSessionId,'must be a genuinely new save');
  const readSave=()=>page.evaluate(id=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+id)),fixture.sessionId);
  const play=adventure.frameLocator('#adventure-play-frame');
  await adventure.locator('#adventure-play').tap();
  await play.locator('#npc-talk').waitFor({state:'visible',timeout:45000});
  await play.locator('#npc-talk').tap();
  await play.locator('#npc-dialogue-next').filter({hasText:'Commercer'}).waitFor({state:'visible',timeout:15000});
  assert.equal(await play.locator('#npc-dialogue-trade').isVisible(),false,'one final commerce action');
  await play.locator('#npc-dialogue-next').tap();
  await adventure.locator('#adventure-merchant-dialog[open]').waitFor({timeout:15000});
  await adventure.getByRole('button',{name:'Acheter',exact:true}).first().tap();
  await page.waitForFunction(f=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+f.sessionId))?.merchantStocks?.[f.merchantId]?.[f.itemId]===2,fixture);
  let saved=await readSave();
  assert.equal(saved.inventory.currency,fixture.currency-fixture.buy);
  assert.equal(saved.inventory.items[fixture.itemId],1);
  await adventure.getByRole('button',{name:'Vendre',exact:true}).tap();
  await page.waitForFunction(f=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+f.sessionId))?.inventory.currency===f.currency-f.buy+f.sell,fixture);
  saved=await readSave();
  assert.equal(saved.inventory.items[fixture.itemId]??0,0);
  assert.equal(saved.merchantStocks[fixture.merchantId][fixture.itemId],2);
  await adventure.locator('#adventure-merchant-close').tap();
  // Wait for the scoped closed acknowledgement before changing view.
  await play.locator('#npc-talk').waitFor({state:'visible',timeout:15000});
  const beforeResume=await play.locator('body').evaluate(()=>window.__sculptPlayProbe());
  await play.locator('#play-menu-button').tap();
  await adventure.locator('#adventure-menu-return-title').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  await adventure.locator('#adventure-start-load').tap();
  await adventure.locator('#adventure-save-gallery [data-save-id="'+fixture.sessionId+'"]').tap();
  await adventure.locator('#adventure-save-load').tap();
  await adventure.locator('#adventure-play:not([disabled])').tap();
  try{
   await play.locator('#play-menu-button').waitFor({state:'visible',timeout:45000});
   await adventure.locator('#adventure-launch-loading').waitFor({state:'hidden',timeout:45000});
   await play.locator('#npc-talk').waitFor({state:'visible',timeout:45000});
  }catch(error){
   const afterResume=await play.locator('body').evaluate(()=>({
    play:window.__sculptPlayProbe?.(),navigation:window.__sculptLabProbe?.()?.navigationTesting,
    talk:document.getElementById('npc-talk')?.outerHTML,
    dialogue:document.getElementById('npc-dialogue-overlay')?.hidden,
    status:document.getElementById('play-save-status')?.textContent
   })).catch(()=>null);
   const resumeUi=await adventure.locator('body').evaluate(()=>({status:document.getElementById('adventure-status')?.textContent,worldStatus:document.getElementById('adventure-world-status')?.textContent,worldChoice:document.getElementById('adventure-world-select')?.value,frame:document.getElementById('adventure-play-frame')?.getAttribute('src')})).catch(()=>null);
   throw Error('Merchant unavailable after actual resume: '+JSON.stringify({beforeResume,afterResume,resumeUi,errors}),{cause:error});
  }
  await play.locator('#npc-talk').tap();
  await play.locator('#npc-dialogue-next').filter({hasText:'Commercer'}).waitFor({state:'visible',timeout:15000});
  assert.equal(await play.locator('#npc-dialogue-trade').isVisible(),false,'one final commerce action');
  await play.locator('#npc-dialogue-next').tap();
  await adventure.locator('#adventure-merchant-dialog[open]').waitFor({timeout:15000});
  assert.match(await adventure.locator('#adventure-merchant-trades').innerText(),/Potion de réanimation.*stock 3/);
  await adventure.getByRole('spinbutton',{name:'Quantité pour Potion de soins',exact:true}).first().fill('2');
  await adventure.getByRole('button',{name:'Acheter',exact:true}).first().tap();
  await page.waitForFunction(f=>JSON.parse(localStorage.getItem(
   'gensrpg.capture.v2.adventure.slot.v1:'+f.sessionId))?.merchantStocks?.[f.merchantId]?.[f.itemId]===0,fixture);
  saved=await readSave();
  assert.equal(saved.inventory.currency,fixture.currency-3*fixture.buy+fixture.sell);
  assert.equal(saved.inventory.items[fixture.itemId],2);
  assert.equal(await adventure.getByRole('button',{name:'Acheter',exact:true}).first().isDisabled(),true);
  assert.equal(await adventure.getByRole('button',{name:'Acheter',exact:true}).nth(1).isDisabled(),false);
  await adventure.locator('#adventure-merchant-close').tap();
  assert.deepEqual(errors.filter(e=>/SyntaxError|Uncaught|Duplicate Capture/.test(e)),[]);
 }finally{
  await browser?.close();server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
