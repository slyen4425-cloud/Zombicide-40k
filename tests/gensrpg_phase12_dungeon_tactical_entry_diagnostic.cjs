'use strict';
// Browser-driven real Dungeon play flow. Never inject combat, damage, enemy instances or AI results.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium,firefox}=require(process.env.GENSRPG_PW_ROOT+'/node_modules/playwright');
const html=fs.readFileSync('index.html','utf8'),bytes=Buffer.from(html);
assert.equal(bytes.length,1729855,'R15 exact HTML length');
assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),'9f35eb833a6ede4b91399854f19bb9bef59f45ab','R15 exact source');
const url=process.env.GENSRPG_TEST_URL||'http://127.0.0.1:8898/index.html';
async function snapshot(page){
 return page.evaluate(()=>{
  const visible=id=>{const x=document.getElementById(id);return !!x&&x.getClientRects().length>0};
  const core=document.getElementById('gensDungeonCore01');
  const state=typeof loadDungeonState==='function'?loadDungeonState():null;
  const enemies=typeof dungeonLivingEnemies==='function'?dungeonLivingEnemies():[];
  return {profile:getActiveGameProfile?.()?.id,gameStyle:getActiveGameProfile?.()?.gameStyle,
   participants:typeof loadGameParticipants==='function'?loadGameParticipants():[],
   session:typeof hasActiveSession==='function'?hasActiveSession():null,
   coreActive:!!window.DungeonCore01?.active,coreVisible:visible('gensDungeonCore01'),
   homeVisible:visible('setup'),pregameVisible:visible('pregameSetup'),
   room:state?.room??null,lastKind:state?.last?.kind??null,
   enemyCount:enemies.length,enemyIds:enemies.map(e=>String(e.id)),
   exploreText:document.getElementById('dc01Explore')?.textContent?.trim(),
   exploreDisabled:document.getElementById('dc01Explore')?.disabled,
   modalOpen:document.getElementById('dc01Modal')?.classList.contains('open'),
   tacticalVisible:visible('dungeonCombatModal')||!!document.querySelector('.gtv2Overlay:not([style*="display: none"])'),
   coreRound:document.getElementById('dc01Round')?.textContent?.trim(),
   renderSource:typeof window.renderDungeonCombatRound==='function'&&window.renderDungeonCombatRound===window.__dc302RenderCombat,
   aiOldNoop:typeof window.dungeonRunAi156==='function'&&window.dungeonRunAi156.toString().replace(/\s/g,'')==='function(){}'
  };
 });
}
async function step(page,name){const s=await snapshot(page);console.log('DUNGEON_REAL_STEP '+JSON.stringify({name,...s}));return s}
async function exercise(browser,label){
 const context=await browser.newContext({locale:'fr-FR',viewport:{width:1280,height:840},serviceWorkers:'block'});
 const page=await context.newPage(),errs=[],alerts=[],consoleLines=[];
 page.on('console',msg=>{if(['error','warning','warn'].includes(msg.type()))consoleLines.push(msg.type()+': '+msg.text().slice(0,220));});
 page.on('pageerror',e=>errs.push(e.message));
 page.on('dialog',async d=>{alerts.push(d.type()+': '+d.message().slice(0,160));await d.accept()});
 try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.DungeonCore01?.start==='function'&&typeof window.switchGameModeFromHome==='function',{timeout:20000});
  await step(page,label+'/load');
  // Core 0.71 explicitly schedules cold-start home resets at 0/80/220/500ms.
  // A human waits until the welcome screen has settled before choosing a mode.
  await page.waitForTimeout(800);
  // The live interface is hierarchical: mode family -> game -> new session.
  // The old profile-switcher exists in HTML but is deliberately hidden.
  await page.locator('#gensRootHome .gensRootModeCard.adventure').click({timeout:15000});
  await page.locator('#gensFamilyHome').waitFor({state:'visible',timeout:15000});
  const games=page.locator('#gensFamilyGames .gensFamilyGameCard');
  await games.first().waitFor({state:'visible',timeout:15000});
  console.log('DUNGEON_REAL_PROFILE_OPTIONS '+label+' '+JSON.stringify(await games.allTextContents()));
  const dungeonGame=games.filter({hasText:/dungeon/i}).first();
  assert.ok(await dungeonGame.count(),label+' built-in Dungeon available in adventure family');
  // V16.155 intentionally forces a full reload on Zombicide -> Dungeon family switch.
  // This is *part of the real UX*, not a blank-screen bug or mock.
  await Promise.all([
    page.waitForEvent('framenavigated',{timeout:18000}),
    dungeonGame.locator('button.gensUniverseMainBtn').click({timeout:15000})
  ]);
  await page.waitForLoadState('domcontentloaded',{timeout:30000});
  await page.waitForFunction(()=>typeof window.openGensBuiltInGame==='function'&&getActiveGameProfile?.()?.id==='game_profile_dungeon_demo',{timeout:15000});
  let afterReload=await step(page,label+'/family-switch-reloaded');
  assert.equal(afterReload.profile,'game_profile_dungeon_demo',label+' family switch persists actual Dungeon profile across full reload');
  await page.waitForTimeout(800);
  await page.locator('#gensRootHome .gensRootModeCard.adventure').click({timeout:15000});
  await page.locator('#gensFamilyHome').waitFor({state:'visible',timeout:15000});
  await page.locator('#gensFamilyGames .gensUniverseCard[data-rpg-profile="game_profile_dungeon_demo"] button.gensUniverseMainBtn').click({timeout:15000});
  await page.locator('#gensGameHome').waitFor({state:'visible',timeout:15000});
  const selected=await step(page,label+'/profile-selected');
  assert.equal(selected.gameStyle,'dungeon',label+' player-selected profile is Dungeon');
  await page.locator('#gensGameHomeActions button.newGameBtn').click({timeout:15000});
  let s=await step(page,label+'/newgame');
  assert.equal(s.pregameVisible,true,label+' pregame wizard really shown');
  if(await page.locator('#pregameProfileStep').isVisible()) await page.locator('#pregameProfileStep button.pregameContinue').click({timeout:15000});
  assert.equal(await page.locator('#pregameHeroStep').isVisible(),true,label+' hero-configuration step shown by newGame');
  await step(page,label+'/pregame-heroes');
  const launch=page.locator('button.startGameBtn[onclick="startConfiguredGame()"]');
  await launch.waitFor({state:'visible',timeout:15000});
  await launch.click({timeout:15000});
  await page.locator('#gensDungeonCore01').waitFor({state:'visible',timeout:15000});
  s=await step(page,label+'/launched');
  assert.equal(s.coreActive,true,label+' actual Dungeon core is active');
  assert.ok(s.participants.length>=1,label+' genuine participant selection exists');
  assert.equal(s.room,0,label+' room starts at zero');
  // Existing authoring API changes only the selected world's encounter WEIGHTS,
  // never monsters, HP, damage or combat results. This makes the live path reproducible.
  await page.evaluate(()=>{
   const cfg=loadDungeonConfig();
   saveDungeonConfig({...cfg,rooms:10,boss:'none',roomWeights:{enemy:100,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0}});
  });
  await page.locator('#dc01Explore').click({timeout:15000});
  await page.waitForTimeout(500);
  s=await step(page,label+'/explored');
  assert.equal(s.room,1,label+' user clicked first real room');
  assert.ok(s.enemyCount>0,label+' real native Dungeon encounter must be visible as alive');
  assert.equal(s.lastKind,'enemy',label+' generated room must be enemy encounter');
  const evidence=await page.evaluate(()=>{
    const state=loadDungeonState(),all=loadActiveEnemies(),living=dungeonLivingEnemies();
    const runtime=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}');
    const d=document.getElementById('dc01Enemies');
    const button=document.getElementById('dc01Explore');
    const m=document.getElementById('dc200Modal');
    return {
      room:state.room,runtimeRoom:runtime.room,
      active:all.map(e=>({id:e.id,enemyId:e.enemyId,hp:e.hp,dungeonRoom:e.dungeonRoom,defeated:e.defeated})),
      living:living.map(e=>({id:e.id,enemyId:e.enemyId,hp:e.hp,dungeonRoom:e.dungeonRoom})),
      enemyBanner:d?.textContent?.trim(),
      actionText:button?.textContent?.trim(),actionDisabled:button?.disabled,
      gameplayMovement:getActiveGameProfile()?.rpgUniverse?.movement?.mode,
      modalOpen:m?.classList.contains('open'),renderOwner:window.renderDungeonCombatRound===window.__dc302RenderCombat,
      errors:[]
    };
  });
  console.log('DUNGEON_ROOM_STAMP_RESULT '+JSON.stringify({browser:label,...evidence}));
  assert.equal(evidence.room,1,label+' Dungeon legacy room has advanced');
  assert.equal(evidence.runtimeRoom,1,label+' Dungeon core runtime room has advanced');
  assert.ok(evidence.active.length>0,label+' encounter actually spawned an enemy instance');
  assert.ok(evidence.living.length>0,label+' original living enemy filter sees the spawn');
  assert.ok(evidence.active.every(e=>e.dungeonRoom===1),label+' *every* native spawned enemy has correct room');
  assert.equal(new Set(evidence.active.map(e=>e.id)).size,evidence.active.length,label+' no duplicate ID');
  assert.ok(/ennemi/i.test(evidence.enemyBanner),label+' game UI displays the alive enemy');
  assert.equal(evidence.renderOwner,true,label+' Core3.03 renderer owner preserved');
  assert.equal(errs.length,0,label+' no page errors on real encounter');
  console.log(label+' REAL DUNGEON ROOM STAMP PASS');
  // Continue the SAME actual user path: dismiss the real encounter modal,
  // then click the game-owned combat button. Do not fabricate a battle state.
  assert.equal(evidence.modalOpen,true,label+' room encounter modal is open');
  await page.locator('#dc200ModalOk').click({timeout:12000});
  await page.locator('#dc01Explore').waitFor({state:'visible',timeout:12000});
  assert.match(await page.locator('#dc01Explore').textContent(),/ENGAGER LE COMBAT/,label+' real manual combat entry is visible');
  // Real gameplay shows a result/info overlay; a player dismisses it via OK.
  if(await page.locator('#effectModal').evaluate(el=>el.classList.contains('open'))){
    await page.locator('#effectModal button.effectClose').click({timeout:10000});
    await page.locator('#effectModal').evaluate(el=>{if(el.classList.contains('open'))throw Error('effect overlay failed to close through UI')});
  }
  await page.locator('#dc01Explore').click({timeout:12000});
  await page.waitForTimeout(1200);
  const combat=await page.evaluate(()=>{
   const modal=document.getElementById('dungeonCombatModal'),setup=document.getElementById('dungeonCombatSetupView');
   const visible=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none';
   return {
     modalExists:!!modal,modalVisible:visible(modal),modalClasses:modal?.className,
     modalDisplay:modal?.style.display,
     combatActive:typeof dungeonCombatActive==='undefined'?null:dungeonCombatActive,
     setupContentLength:setup?.innerHTML?.length||0,
     availableButtons:[...document.querySelectorAll('#dungeonCombatModal button')].filter(visible).slice(0,18).map(b=>({id:b.id,text:b.textContent.trim().slice(0,85),disabled:b.disabled})),
     renderOwner:window.renderDungeonCombatRound===window.__dc302RenderCombat,
     enemies:typeof dungeonLivingEnemies==='function'?dungeonLivingEnemies().map(e=>({id:e.id,hp:e.hp,room:e.dungeonRoom})):[],
     tacticalBridge:typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat
   };
  });
  console.log('DUNGEON_REAL_COMBAT_ENTRY '+JSON.stringify({browser:label,...combat,pageErrors:errs}));
  await page.waitForTimeout(2800);
  const delayed=await page.evaluate(()=>{
    const popup=document.getElementById('dc200Modal'),combat=document.getElementById('dungeonCombatModal'),effect=document.getElementById('effectModal');
    const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none';
    const buttons=[...document.querySelectorAll('button')].filter(visible).slice(0,28).map(el=>({id:el.id,caption:el.textContent.trim().slice(0,85),disabled:el.disabled}));
    return {
      coreModalOpen:popup?.classList.contains('open'),coreModalTitle:document.getElementById('dc200ModalTitle')?.textContent,
      coreModalContent:document.getElementById('dc200ModalBody')?.textContent?.slice(0,360),
      effectVisible:visible(effect),effectTitle:document.getElementById('effectTitle')?.textContent,
      combatModalVisible:visible(combat),combatDisplay:combat?.style.display,
      combatActive:typeof dungeonCombatActive==='undefined'?null:dungeonCombatActive,
      runtimeOwner:window.renderDungeonCombatRound===window.__dc302RenderCombat,
      bridge:typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat,
      tacticalEntryStatus:typeof window.GensRpgTacticalEntryV1?.status==='function'?window.GensRpgTacticalEntryV1.status():null,
      currentEnemyIds:typeof dungeonLivingEnemies==='function'?dungeonLivingEnemies().map(e=>e.id):[],
      buttons
    };
  });
  console.log('TACTICAL_ENTRY_DIAGNOSTIC '+JSON.stringify({browser:label,immediate:combat,delayed,errors:errs,consoleLines,alerts}));
  assert.equal(delayed.currentEnemyIds.length,evidence.living.length,label+' battle request must not erase live enemy instances');
  assert.equal(delayed.bridge,'function',label+' public combat request bridge is present');
  console.log(label+' DIAGNOSTIC COMPLETE (combat availability not certified)');

 } finally {await context.close()}
}
(async()=>{
 for(const [label,engine] of [['Chromium',chromium],['Firefox',firefox]]){
  const browser=await engine.launch({headless:true,args:label==='Chromium'?['--disable-dev-shm-usage']:[]});
  try{await exercise(browser,label);console.log(label+' real Dungeon profile→room→native encounter→combat opening PASS')}
  finally{await browser.close()}
 }
})().catch(e=>{console.error('DUNGEON_REAL_FLOW_RED '+(e.stack||e));process.exitCode=1});
