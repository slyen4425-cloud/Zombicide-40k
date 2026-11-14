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
 '.mjs':'text/javascript;charset=utf-8',
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

// Read the real currently selected Adventure through its production Core +
// portfolio owner. New games are independent slots; the legacy single-save
// key deliberately stays untouched for pre-existing user sessions.
const readSelectedAdventureSave=async element=>element.evaluate(async()=>{
 const [{createAdventureStoreV1},{createAdventurePortfolioStoreV1}]=await Promise.all([
  import('./adventure-contract-v1.mjs'),import('./adventure-portfolio-store-v1.mjs')
 ]);
 const storage=localStorage,coreStorage=window.GensStorageV1;
 if(!coreStorage)throw new Error('Official Core Storage missing in real Adventure');
 const legacyStore=createAdventureStoreV1({storage,coreStorage});
 const portfolio=createAdventurePortfolioStoreV1({storage,coreStorage,legacyStore});
 const selected=portfolio.load();
 if(!selected||selected.sessionId!==portfolio.activeId())
  throw new Error('Selected Adventure save missing after real user action');
 return selected;
});

// The new startup explicitly separates NEW from LOAD: after external world
// authoring, resume the real Core save through the published card interface.
async function loadSavedAdventureThroughGallery(adventure){
 await adventure.locator('#adventure-start-load').tap();
 const card=adventure.locator('#adventure-save-gallery .adventure-save-card').first();
 await card.waitFor({state:'visible',timeout:45000});
 assert.match(await card.innerText(),/_Héros/,
  'a world_hero title must be used instead of technical slot IDs');
 await card.tap();
 await adventure.locator('#adventure-save-load').tap();
 await adventure.locator('#adventure-play:not([disabled])').waitFor({state:'visible',timeout:45000});
}

// Use the published Bestiary gallery, never the intentionally hidden native select.
// The single canonical select still owns AdventureSession creation and remains asserted.
async function chooseStarterThroughBestiary(adventure,{id,name}){
 const activeCard=adventure.locator('#adventure-starter-cards .adventure-starter-card').first();
 await activeCard.waitFor({state:'visible',timeout:45000});
 await activeCard.tap();
 const dialog=adventure.locator('#adventure-starter-picker');
 await dialog.waitFor({state:'visible'});
 await dialog.locator('#adventure-starter-search').fill(name);
 await dialog.locator('.adventure-gallery-card:not([disabled])').filter({hasText:name}).first().tap();
 await dialog.waitFor({state:'hidden'});
 const canonical=adventure.locator('#adventure-starter');
 assert.equal(await canonical.inputValue(),id,
  'the illustrated Bestiary choice must update the sole canonical starter selector');
 return canonical;
}

test('Adventure applies the saved World Builder arena and commits a native encounter at the exact map point',
 {timeout:180000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})};});
  const page=await context.newPage();
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const base='http://127.0.0.1:'+server.address().port;
  const missing=[];
  page.on('response',response=>{
   if(response.status()>=400&&response.url().startsWith(base+scope))
    missing.push(response.status()+' '+response.url());
  });
  const start=async()=>{
   await page.goto(base+scope+'index.html',{waitUntil:'domcontentloaded'});
   await page.locator('button.gensRootModeCard.capture').tap();
   await page.locator('[data-capture-v2-view="adventure"]').tap();
  };
  await start();
  const adventure=page.frameLocator('#gensCaptureV2Root iframe');
  // Choose the actual new-game tab before the native Bestiary becomes visible.
  await adventure.locator('#adventure-start-new').tap();
  const starter=await chooseStarterThroughBestiary(adventure,{id:'crea_lumilo',name:'Lumilo'});
  await adventure.locator('#adventure-create').tap();
  const creation=await adventure.locator('body').evaluate(()=>{
   const el=id=>document.getElementById(id);
   return {view:document.body.dataset.adventureStartView,
    status:el('adventure-status')?.textContent,
    summary:el('adventure-save-summary')?.textContent,
    sessionPanelHidden:el('adventure-session-panel')?.hidden,
    playDisabled:el('adventure-play')?.disabled,
    portfolioIndex:localStorage.getItem('gensrpg.capture.v2.adventure.portfolio.v1')};
  });
  assert.equal(creation.sessionPanelHidden,false,
   'Created session must be visible before entering Exploration: '+JSON.stringify(creation));
  assert.equal(creation.playDisabled,false,
   'Created session must enable native play without errors: '+JSON.stringify(creation));
  // Use the real world authoring APIs for a plain, walkable area with a
  // guaranteed Shadow encounter. The battle journal is written by Combat.
  await starter.evaluate(async(_,vendor)=>{
   const [{createBlankWorldBuilderDraft,updateTerrainFamilyEncounterProfile,
    setTerrainFamilyExclusiveEncounterElement,setAreaEncounterRandomEnabled},{saveWorldAssemblerDraft}]=await Promise.all([
    import(vendor+'src/builder/world-builder-draft.js'),
    import(vendor+'src/builder/world-assembler-handoff.js')
   ]);
   let world=createBlankWorldBuilderDraft({id:'adventure-pages-test',width:36*28,height:24*21});
   const area=world.areas.find(item=>item.id===world.initialAreaId);
   const family=area.surface.baseTerrainFamilyId;
   world=updateTerrainFamilyEncounterProfile(world,family,{encounterChancePercent:100});
   world=setTerrainFamilyExclusiveEncounterElement(world,family,'shadow');
   world=setAreaEncounterRandomEnabled(world,area.id,true);
   saveWorldAssemblerDraft(localStorage,world);
  },scope+'vendor/exploration-lab/');
  const editor=await context.newPage();
  await editor.goto(base+scope+'vendor/exploration-lab/world-assembler.html');
  async function openCombatArenaSettings(){
   await editor.locator('#open-selected-area').tap();
   await editor.locator('#area-combat-arenas > summary').tap();
  }
  await openCombatArenaSettings();
  await editor.locator('#world-combat-arena').selectOption({label:'Neige'});
  await editor.locator('#area-combat-arena').selectOption({label:'Ville'});
  await editor.reload();
  await openCombatArenaSettings();
  await editor.locator('#area-combat-arena:not([disabled])').waitFor();
  assert.equal(await editor.locator('#area-combat-arena').inputValue(),'city');
  assert.equal(await editor.locator('#world-combat-arena').inputValue(),'snow');
  await editor.close();
  await page.bringToFront();
  await loadSavedAdventureThroughGallery(adventure);
  await adventure.locator('#adventure-play').tap();
  const map=adventure.frameLocator('#adventure-play-frame');
  const canvas=map.locator('#sculpt-canvas');
  await map.locator('#play-menu-button:visible').waitFor();
  await canvas.evaluate(()=>window.focus());
  await page.keyboard.down('ArrowRight');
  try{
   await map.locator('#sculpt-encounter-preview:visible').waitFor({timeout:18000});
  }catch(error){
   const diagnostic=await canvas.evaluate(()=>({
    play:window.__sculptPlayProbe?.(),encounter:window.__sculptEncounterProbe?.(),
    map:window.__sculptWorldProbe?.(),movement:document.getElementById('navigation-status')?.textContent,
    error:document.getElementById('play-start-error-message')?.textContent,
    playErrorVisible:document.body.classList.contains('sculpt-play-unavailable'),
    sessionGrants:Object.fromEntries(Object.keys(sessionStorage).filter(k=>k.startsWith('gensrpg.capture.v2.')).map(k=>[k,sessionStorage.getItem(k)?.slice(0,1500)])),
    worldEncounters:(()=>{const raw=localStorage.getItem('gensrpg.world-assembler.document.v1');if(!raw)return null;const w=JSON.parse(raw);return {areas:w.areas.map(a=>({id:a.id,encounters:a.encounters})),plain:w.encounterConfig?.families?.find(a=>a.terrainFamilyId==='plain')}})()
   })).catch(e=>({exception:e.message}));
   throw new Error('Official native Adventure encounter failed: '+JSON.stringify(diagnostic),{cause:error});
  }finally{await page.keyboard.up('ArrowRight');}
  const point=await canvas.evaluate(()=>window.__sculptPlayProbe().actor);
  assert.equal(await canvas.evaluate(()=>window.__sculptEncounterProbe().creatureId),'crea_ombre_2');
  await map.locator('#sculpt-encounter-combat').tap();
  const battle=map.locator('.combat-overlay__frame');
  await battle.waitFor({state:'attached'});
  const fight=map.frameLocator('.combat-overlay__frame');
  try{
   await fight.locator('[data-bridge-status][data-ready="true"]').waitFor({state:'attached'});
  }catch(error){
   throw new Error('Native duel did not start: '+JSON.stringify({
    src:await battle.getAttribute('src'),
    status:await fight.locator('[data-bridge-status]').textContent({timeout:1000}).catch(()=>null),
    missing
   }),{cause:error});
  }
  const arena=fight.locator('[data-combat-arena][data-arena-theme="city"]');
  await arena.waitFor();
  const arenaImage=await arena.evaluate(async element=>{
   const background=getComputedStyle(element).getPropertyValue('--arena-background-image').trim();
   const image=new Image();
   image.src=background.slice(5,-2);
   await image.decode();
   return {url:image.src,width:image.naturalWidth};
  });
  assert.match(arenaImage.url,/arena_city_01[.]webp/);
  assert.ok(arenaImage.width>0,'the official backdrop must decode in the native arena');
  assert.equal(await fight.locator('[data-combat-skill]').count(),1,'only the true level-one skill is available');
  await fight.locator('[data-encounter-flee]').tap();
  await battle.waitFor({state:'detached'});
  // Real CombatResult is committed in GenSRPG Core before this UI receipt.
  const resultDialog=adventure.locator('#adventure-result-dialog:visible');
  await resultDialog.waitFor({timeout:15000});
  assert.equal(await adventure.locator('#adventure-result-title').textContent(),'Fuite');
  const receipt=await adventure.locator('#adventure-result-rows').textContent();
  assert.match(receipt,/XP de l’équipe/,'new Showcase games split XP across the saved team');
  assert.match(receipt,/Créature 1 · Lumilo/,'the official native fighter must be identified individually');
  assert.match(receipt,/\+0 XP/);
  assert.match(receipt,/XP du héros/);
  assert.match(receipt,/Objets/);
  await adventure.locator('#adventure-result-close').tap();
  await resultDialog.waitFor({state:'hidden'});
  const save=await readSelectedAdventureSave(adventure.locator('#adventure-play'));
  assert.equal(save.party.active.level,1);
  assert.equal(save.party.active.xp,0);
  assert.equal(save.lastAward.outcome,'fled');
  assert.equal(save.processedEncounterKeys.length,1);
  assert.deepEqual(await canvas.evaluate(()=>window.__sculptPlayProbe().actor),point);
  await start();
  await adventure.locator('#adventure-play').tap();
  await map.locator('#play-menu-button:visible').waitFor();
  assert.deepEqual(await canvas.evaluate(()=>window.__sculptPlayProbe().actor),point);
  const reopened=await readSelectedAdventureSave(adventure.locator('#adventure-play'));
  assert.equal(reopened.sessionId,save.sessionId,'resume the same selected independent save');
  assert.deepEqual(reopened.processedEncounterKeys,save.processedEncounterKeys);
  assert.equal(reopened.lastAward.outcome,'fled');
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
});
test('Adventure offers a duel, remembers the victory and starts aggressive trainer battles on approach',
 {timeout:180000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})};});
  const page=await context.newPage();
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const base='http://127.0.0.1:'+server.address().port;
  const missing=[];
  page.on('response',response=>{
   if(response.status()>=400&&response.url().startsWith(base+scope))
    missing.push(response.status()+' '+response.url());
  });
  const start=async()=>{
   await page.goto(base+scope+'index.html',{waitUntil:'domcontentloaded'});
   await page.locator('button.gensRootModeCard.capture').tap();
   await page.locator('[data-capture-v2-view="adventure"]').tap();
  };
  await start();
  const adventure=page.frameLocator('#gensCaptureV2Root iframe');
  // Choose the actual new-game tab before the native Bestiary becomes visible.
  await adventure.locator('#adventure-start-new').tap();
  const starter=await chooseStarterThroughBestiary(adventure,{id:'crea_lumilo',name:'Lumilo'});
  await adventure.locator('#adventure-create').tap();
  const creation=await adventure.locator('body').evaluate(()=>{
   const el=id=>document.getElementById(id);
   return {view:document.body.dataset.adventureStartView,
    status:el('adventure-status')?.textContent,
    summary:el('adventure-save-summary')?.textContent,
    sessionPanelHidden:el('adventure-session-panel')?.hidden,
    playDisabled:el('adventure-play')?.disabled,
    portfolioIndex:localStorage.getItem('gensrpg.capture.v2.adventure.portfolio.v1')};
  });
  assert.equal(creation.sessionPanelHidden,false,
   'Created session must be visible before entering Exploration: '+JSON.stringify(creation));
  assert.equal(creation.playDisabled,false,
   'Created session must enable native play without errors: '+JSON.stringify(creation));
  await starter.evaluate(async()=>{
   const [{createAdventureStoreV1},{createAdventurePortfolioStoreV1}]=await Promise.all([
    import('./adventure-contract-v1.mjs'),import('./adventure-portfolio-store-v1.mjs')
   ]);
   const storage=localStorage,coreStorage=window.GensStorageV1;
   const legacyStore=createAdventureStoreV1({storage,coreStorage});
   const store=createAdventurePortfolioStoreV1({storage,coreStorage,legacyStore});
   const session=store.load();
   store.save({...session,party:{...session.party,active:{
    ...session.party.active,level:20,xp:38000,statAllocations:{health:200,light:160}
   }}});
  });
  // Place the trainer on a blank world with wild encounters disabled.
  await starter.evaluate(async(_,vendor)=>{
   const [{createBlankWorldBuilderDraft,setWorldCombatArena},{saveWorldAssemblerDraft}]=await Promise.all([
    import(vendor+'src/builder/world-builder-draft.js'),
    import(vendor+'src/builder/world-assembler-handoff.js')
   ]);
   let world=createBlankWorldBuilderDraft({id:'adventure-trainer-pages-test',width:36*28,height:24*21});
   const area=world.areas.find(item=>item.id===world.initialAreaId);
   const spawn=area.spawns.find(item=>item.id===world.initialSpawnId);
   world.areas[0].actors.push({id:'local-trainer',actorDefinitionId:'exploration:npc:generic-v1',
    x:spawn.x+30,y:spawn.y,npc:{kind:'trainer',name:'Lina',dialogue:'Salut !\nOn se bat ?',
     trainerRoster:[{creatureId:'crea_ombre_2',level:2},{creatureId:'crea_ombre_2',level:5}]}});
   area.actors.push({id:'aggressive-trainer',actorDefinitionId:'exploration:npc:generic-v1',
    x:spawn.x+112,y:spawn.y,npc:{kind:'trainer',name:'Rami',dialogue:'Je garde le passage.',
     trainerEngagement:'aggressive',trainerRoster:[{creatureId:'crea_ombre_2',level:7}]}});
   world=setWorldCombatArena(world,{areaId:area.id,arenaId:'city'});
   saveWorldAssemblerDraft(localStorage,world);
  },scope+'vendor/exploration-lab/');
  await loadSavedAdventureThroughGallery(adventure);
  await adventure.locator('#adventure-play').tap();
  const map=adventure.frameLocator('#adventure-play-frame');
  const canvas=map.locator('#sculpt-canvas');
  await map.locator('#play-menu-button:visible').waitFor();
  const point=await canvas.evaluate(()=>window.__sculptPlayProbe().actor);
  await map.locator('#npc-talk:visible').tap();
  assert.equal(await map.locator('#npc-dialogue-text').textContent(),'Salut !');
  await map.locator('#npc-dialogue-next').tap();
  const battle=map.locator('.combat-overlay__frame');
  const acceptDuel=map.getByRole('button',{name:'Accepter le duel'});
  await map.locator('#npc-dialogue-duel-offer:visible').waitFor();
  await map.getByRole('button',{name:'Refuser',exact:true}).tap();
  await map.locator('#npc-dialogue-overlay').waitFor({state:'hidden'});
  assert.equal(await battle.count(),0,'refusing the duel must leave the player on the map');
  await map.locator('#npc-talk:visible').tap();
  await map.locator('#npc-dialogue-next').tap();
  await acceptDuel.tap();
  await battle.waitFor({state:'attached'});
  const fight=map.frameLocator('.combat-overlay__frame');
  try{
   await fight.locator('[data-bridge-status][data-ready="true"]').waitFor({state:'attached'});
  }catch(error){
   throw new Error('Native duel did not start: '+JSON.stringify({
    src:await battle.getAttribute('src'),
    status:await fight.locator('[data-bridge-status]').textContent({timeout:1000}).catch(()=>null),
    missing
   }),{cause:error});
  }
  const arena=fight.locator('[data-combat-arena][data-arena-theme="city"]');
  await arena.waitFor();
  const arenaImage=await arena.evaluate(async element=>{
   const background=getComputedStyle(element).getPropertyValue('--arena-background-image').trim();
   const image=new Image();
   image.src=background.slice(5,-2);
   await image.decode();
   return {url:image.src,width:image.naturalWidth};
  });
  assert.match(arenaImage.url,/arena_city_01[.]webp/);
  assert.ok(arenaImage.width>0,'the official backdrop must decode in the native arena');
  assert.equal(await fight.locator('[data-combat-skill]').count(),5,'the real level-20 starter uses its unlocked skills');
  const bench=fight.locator('[data-enemy-reserve-member-id]:not([hidden])');
  assert.equal(await bench.count(),1,'the trainer has a real second combatant');
  const deadline=Date.now()+45000;
  while(Date.now()<deadline&&await battle.count()){
   const ability=fight.locator('[data-combat-skill]:not([disabled])').first();
   if(await ability.count())await ability.tap({timeout:400}).catch(()=>{});
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  await battle.waitFor({state:'detached'});
  // Real CombatResult is committed in GenSRPG Core before this UI receipt.
  const resultDialog=adventure.locator('#adventure-result-dialog:visible');
  await resultDialog.waitFor({timeout:15000});
  assert.equal(await adventure.locator('#adventure-result-title').textContent(),'Victoire');
  const receipt=await adventure.locator('#adventure-result-rows').textContent();
  assert.match(receipt,/Créature 1 · Lumilo/);
  await adventure.locator('#adventure-result-close').tap();
  await resultDialog.waitFor({state:'hidden'});
  const save=await readSelectedAdventureSave(adventure.locator('#adventure-play'));
  assert.equal(save.party.active.level,20);
  assert.equal(save.lastAward.outcome,'victory');
  assert.equal(save.trainerVictories?.[0]?.actorId,'local-trainer');
  assert.equal(save.trainerVictories?.length,1);
  assert.equal(save.processedEncounterKeys.length,1);
  assert.deepEqual(await canvas.evaluate(()=>window.__sculptPlayProbe().actor),point);
  await start();
  await adventure.locator('#adventure-play').tap();
  await map.locator('#play-menu-button:visible').waitFor();
  assert.deepEqual(await canvas.evaluate(()=>window.__sculptPlayProbe().actor),point);
  const reopened=await readSelectedAdventureSave(adventure.locator('#adventure-play'));
  assert.equal(reopened.sessionId,save.sessionId,'resume the same selected independent save');
  assert.deepEqual(reopened.processedEncounterKeys,save.processedEncounterKeys);
  assert.equal(reopened.lastAward.outcome,'victory');
  assert.deepEqual(reopened.trainerVictories,save.trainerVictories);
  await map.locator('#npc-talk:visible').tap();
  await map.locator('#npc-dialogue-next').tap();
  assert.equal(await map.locator('#npc-dialogue-next').textContent(),'Terminer');
  await map.locator('#npc-dialogue-next').tap();
  assert.equal(await battle.count(),0,'the aggressive trainer is still outside interaction range');

  // Real touch input moves the hero into range without activating NPC speech.
  const stick=await map.locator('#navigation-stick').boundingBox();
  const center={x:stick.x+stick.width/2,y:stick.y+stick.height/2};
  const touch=await context.newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
  try{
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:center.x+40,y:center.y}]});
   await fight.locator('[data-bridge-status][data-ready="true"]').waitFor({state:'attached',timeout:30000});
  }finally{
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await touch.detach();
  }
  assert.equal(await map.locator('#npc-dialogue-overlay').isVisible(),false);
  assert.match(await map.locator('#sculpt-encounter-summary').textContent(),/Rami/);
  await fight.locator('[data-encounter-flee]').tap();
  await battle.waitFor({state:'detached'});
  await resultDialog.waitFor();
  assert.equal(await adventure.locator('#adventure-result-title').textContent(),'Fuite');
  await adventure.locator('#adventure-result-close').tap();
  const escaped=await readSelectedAdventureSave(adventure.locator('#adventure-play'));
  assert.deepEqual(escaped.trainerVictories,save.trainerVictories);
  assert.equal(escaped.processedEncounterKeys.length,2);
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
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
  assert.equal(await page.locator('#gensCaptureV2Root > nav.gensCaptureV2MainMenu button:visible').count(),2,
   'the live preview must offer only Jouer and Éditeurs on the home screen');
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  assert.equal(await page.locator('#gensCaptureV2Root [data-editor-group="world"] button:visible').count(),2,
   'World Assembler and 2.5D Sculpt belong to the same editor group');
  assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-view="explore"]').count(),0,
   'duplicated 2.5D Tester is removed, not hidden');
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
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
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

// Full real Encounter handoff browser regression: the previous test opened
// Combat editor and the Map tester separately and missed a native iframe 404.
test('map encounter opens the packaged official Combat handoff page and a real battle', {
 timeout:180000
},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 const failed=[],errors=[];
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   locale:'fr-FR',serviceWorkers:'block'});
  const base='http://127.0.0.1:'+server.address().port;
  const sub=scope+'vendor/exploration-lab/';
  const battle=sub+'combat-preview/examples/dom-demo/exploration-encounter.html';
  const snapshot={
   schema:'capture-encounter-snapshot-v1',version:1,
   encounterId:'http-regression-native-1',source:'terrain-random',
   player:{partyRef:'capture-party-player-v1'},
   opponents:[{creatureId:'crea_nat_1'}],
   rules:{rulesetId:'capture.standard.1v1'},
   context:{areaId:'forest-exterior',terrainFamilyId:'forest',elementId:'nature'},
   returnToken:'http-regression-return-1'
  };
  await context.addInitScript(({snapshot,sub})=>{
   if(location.pathname.endsWith('/combat-preview/examples/dom-demo/exploration-encounter.html')){
    const envelope={version:1,snapshot,returnState:{
     areaId:'forest-exterior',x:62,y:18,
     returnUrl:location.origin+sub+'sculpt-lab.html?combatReturn=1'
    },result:null};
    sessionStorage.setItem('gensrpg.capture.combat-handoff.v1',JSON.stringify(envelope));
   }
  },{snapshot,sub});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('response',response=>{
   if(response.url().startsWith(base+sub)&&response.status()>=400)
    failed.push({status:response.status(),url:response.url()});
  });
  // Same URL computed by the original Exploration main's encounter
  // navigation, not a made-up GenSrpg entry or separate demo.
  const expected=new URL('./combat-preview/examples/dom-demo/exploration-encounter.html',
   base+sub+'sculpt-lab.html');
  assert.equal(expected.href,base+battle);
  const res=await page.goto(expected.href,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(res.status(),200,'the actual Android Encounter page cannot return HTTP 404');
  // Official Explorer bridge intentionally hides the status banner after
  // it marks itself ready. Waiting for visible data-ready=true can NEVER
  // succeed (the native CSS uses display:none on that precise state).
  try{
   await page.waitForFunction(()=>document.querySelector('[data-bridge-status]')?.dataset.ready==='true',
    null,{timeout:60000});
  }catch(error){
   const status=await page.locator('[data-bridge-status]').evaluate(node=>({
    text:node.textContent,ready:node.dataset.ready,error:node.dataset.error
   })).catch(()=>({text:'bridge DOM absent'}));
   throw Error('Official Combat bridge failed to become ready: '+JSON.stringify({
    status,failed,errors,cause:String(error)
   }));
  }
  await page.locator('[data-combat-arena]:visible').waitFor({timeout:10000});
  await page.locator('[data-combat-skill]:not([disabled])').first()
   .waitFor({timeout:20000});
  assert.deepEqual(failed,[],'all own native Encounter module/media URLs must load');
  assert.deepEqual(errors,[],'real official Combat bridge must mount without JS exceptions');
  console.log('GENSRPG_REAL_MAP_TO_COMBAT_HTTP_PROOF',JSON.stringify({
   url:expected.pathname,battle:'real Combat main',http:res.status(),
   skills:await page.locator('[data-combat-skill]').count(),source:'official Exploration + Combat'
  }));
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
});

// Android's reported regression: start the ACTUAL 2.5D Tester, walk until
// Exploration creates a real EncounterSnapshot, tap its native Battle action
// and verify the embedded Combat main session starts. No mock encounter or
// separately launched demo is permitted in this end-to-end test.
test('real Exploration 2.5D Tester encounter tap opens native Combat instead of HTTP 404',
 {timeout:180000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 const broken=[];
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   locale:'fr-FR',serviceWorkers:'block'});
  const page=await context.newPage();
  const base='http://127.0.0.1:'+server.address().port;
  page.on('pageerror',e=>broken.push('JS '+String(e)));
  page.on('response',r=>{
   if(r.url().startsWith(base+scope+'vendor/exploration-lab/')&&r.status()>=400)
    broken.push('HTTP '+r.status()+' '+r.url());
  });
  await page.goto(base+scope+'vendor/exploration-lab/sculpt-lab.html?encounterTest=1',
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.__sculptEncounterProbe==='function',
   null,{timeout:45000});
  await page.locator('#navigation-toggle').tap();
  await page.waitForFunction(()=>window.__sculptEncounterProbe?.().testing,
   null,{timeout:12000});
  // These are REAL keyboard inputs consumed by Navigation World and its
  // collision/terrain encounter controller, never direct state mutations.
  for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']){
   if(await page.evaluate(()=>window.__sculptEncounterProbe?.().pending))break;
   await page.keyboard.down(key);
   try{await page.waitForFunction(()=>window.__sculptEncounterProbe?.().pending,
    null,{timeout:9000});}catch{/* Continue walking; collision may block a direction. */}
   await page.keyboard.up(key);
  }
  const probe=await page.evaluate(()=>window.__sculptEncounterProbe?.());
  assert.ok(probe?.pending,'real 2.5D walking must trigger a canonical Encounter: '+JSON.stringify(probe));
  assert.equal(probe.overlayVisible,true);
  await page.locator('#sculpt-encounter-combat').tap();
  const frame=page.frameLocator('.combat-overlay__frame');
  await frame.locator('[data-combat-arena]:visible').waitFor({timeout:60000});
  await frame.locator('[data-combat-skill]:not([disabled])').first().waitFor({timeout:30000});
  const ready=await frame.locator('[data-bridge-status]').getAttribute('data-ready');
  assert.equal(ready,'true','the actual combat session must complete native boot');
  assert.deepEqual(broken,[],'real map → Combat must not request 404 resources');
  console.log('GENSRPG_EXPLORATION_TO_NATIVE_COMBAT_HANDOFF_GREEN',JSON.stringify({
   source:'real Exploration navigation encounter',creatureId:probe.creatureId,
   bridge:'/combat-preview/examples/dom-demo/exploration-encounter.html',
   skills:await frame.locator('[data-combat-skill]').count()
  }));
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
});


test('real HTTPS Jouer on mobile landscape saves creator cap 250, 33 stat points, optional hero 350 and MJ choice', 
 {timeout:150000},async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,context;
  const bad=[];
  try{
   browser=await chromium.launch({headless:true});
   context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'});
   const page=await context.newPage();
   const base='http://127.0.0.1:'+server.address().port;
   page.on('pageerror',e=>bad.push('JS '+String(e)));
   page.on('response',r=>{
    if(r.url().startsWith(base+scope)&&r.status()>=400)
     bad.push('HTTP '+r.status()+' '+r.url());
   });
   const response=await page.goto(base+scope+'assets/gensrpg/capture-v2/adventure.html',
    {waitUntil:'domcontentloaded',timeout:60000});
   assert.equal(response.status(),200);
   assert.equal(await page.locator('#adventure-start-new').isVisible(),true);
   assert.equal(await page.locator('#adventure-start-load').isVisible(),true);
   await page.locator('#adventure-start-new').tap();
   await page.locator('#adventure-create:not([disabled])').waitFor({timeout:45000});
   await page.locator('#adventure-advanced-panel > summary').tap();
   await page.locator('#adventure-rules-panel > summary').tap();
   await page.locator('#adventure-level-max').fill('250');
   await page.locator('#adventure-level-max').press('Tab');
   assert.equal(await page.locator('[data-xp-band-to]').last().inputValue(),'250',
    'last creator-defined XP band should expand visibly, not silently cap at 100');
   await page.locator('#adventure-stat-points-per-level').fill('33');
   assert.equal(await page.locator('#adventure-combat-hp-percent').inputValue(),'25',
    'new game must start with creator-editable 25 percent HP, not Tester HP');
   await page.locator('#adventure-combat-hp-percent').fill('40');
   await page.locator('#adventure-hero-xp-enabled').check();
   await page.locator('#adventure-hero-max-level').fill('350');
   await page.locator('#adventure-create').tap();
   await page.locator('#adventure-creator-panel > summary').tap();
   await page.locator('#adventure-gm-enabled').check();
   await page.locator('#adventure-join-enabled').check();
   await page.locator('#adventure-save-control').tap();
   const saved=await readSelectedAdventureSave(page.locator('#adventure-save-control'));
   assert.equal(saved.rules.progression.maxLevel,250);
   assert.equal(saved.rules.progression.statPointsPerLevel,33);
   assert.equal(saved.rules.combat.hpMultiplier,0.4,'creator controls HP through the game rule');
   assert.equal(saved.rules.progression.xpBands.at(-1).throughLevel,250);
   assert.equal(saved.rules.heroProgression.maxLevel,350);
   assert.equal(saved.rules.heroProgression.enabled,true);
   assert.equal(saved.sessionControl.hostIsGameMaster,true);
   assert.equal(saved.sessionControl.joinEnabled,true);
   assert.equal(saved.party.active.level,1,'a new real party starts at level one, not the configured maximum');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#adventure-start-load').tap();
   const savedCard=page.locator('#adventure-save-gallery .adventure-save-card').first();
   await savedCard.waitFor({state:'visible',timeout:45000});
   assert.match(await savedCard.innerText(),/Monde local_Héros/,
    'world and hero appear instead of UUID in the real saved-game card');
   await savedCard.tap();
   await page.locator('#adventure-save-load').tap();
   await page.locator('#adventure-start-new').tap();
   assert.equal(await page.locator('#adventure-level-max').inputValue(),'250');
   assert.equal(await page.locator('#adventure-stat-points-per-level').inputValue(),'33');
   assert.equal(await page.locator('#adventure-combat-hp-percent').inputValue(),'40',
    'resume displays saved creator HP policy without resetting to 25');
   assert.equal(await page.locator('#adventure-hero-max-level').inputValue(),'350');
   assert.equal(await page.locator('#adventure-gm-enabled').isChecked(),true);
   assert.equal(await page.locator('#adventure-join-enabled').isChecked(),true);
   assert.deepEqual(bad,[],'the actual published Jouer and official assets must have zero JS and HTTP errors');
   console.log('GENSRPG_REAL_SHOWCASE_FREE_LEVEL_CAP',JSON.stringify({
    creatorCap:250,heroCap:350,statPointsPerLevel:33,hostGM:true,
    source:'same-origin packaged Adventure Core'
   }));
  }finally{
   await context?.close();await browser?.close();
   server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
});
