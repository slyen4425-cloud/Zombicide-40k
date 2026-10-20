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
   modalOpen:document.getElementById('dc200Modal')?.classList.contains('open'),
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
 const page=await context.newPage(),errs=[],alerts=[];
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
  // The encounter uses production spawn/reserve, without injecting actors or combat outcomes.
  const reserveBefore=await page.evaluate(()=>typeof loadZombieReserve==='function'?loadZombieReserve():{});
  await page.locator('#dc01Explore').click({timeout:15000});
  await page.waitForTimeout(250);
  s=await step(page,label+'/explored');
  const evidence=await page.evaluate(()=>{
    const all=loadActiveEnemies(),room=loadDungeonState()?.room,live=dungeonLivingEnemies();
    const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}');
    return {room,active:all.map(e=>({id:e.id,enemyId:e.enemyId,hp:e.hp,dungeonRoom:e.dungeonRoom,defeated:e.defeated})),living:live.map(e=>String(e.id)),
      cells:x.enemyCells,body:document.getElementById('dc01Enemies')?.textContent?.trim(),
      modal:document.getElementById('dc200Modal')?.classList.contains('open'),
      button:document.getElementById('dc01Explore')?.textContent?.trim(),
      roomCount:Object.keys(x.roomStates||{}).length};
  });
  console.log('DUNGEON_SPAWN_EVIDENCE '+JSON.stringify({browser:label,reserveBefore:reserveBefore?.dng_skeleton,...evidence}));
  assert.ok(evidence.active.length>0,label+' original dungeonEncounter spawned a real enemy');
  assert.ok(evidence.active.every(e=>e.dungeonRoom===1),label+' all generated enemies must be stamped with target room');
  assert.ok(evidence.living.length>0,label+' Dungeon room-live filter sees generated enemy');
  assert.ok(evidence.active.some(e=>Number(e.hp)>0&&!e.defeated),label+' original enemy HP retained');
  assert.ok(evidence.body?.includes('ennemi'),label+' visible Dungeon enemy panel updated by existing renderer');
  assert.equal(evidence.room,1,label+' published Dungeon room must be 1');
  assert.equal(evidence.modal,true,label+' Core200 real room narration appears');
  assert.equal(s.room,1,label+' user clicked first real room');
  assert.ok(s.enemyCount>0,label+' actual encounter generated real Dungeon enemies');
  assert.equal(s.lastKind,'enemy',label+' encounter selection is real enemy case');
  assert.equal(s.modalOpen,true,label+' room narration modal opens');
  await page.locator('#dc200ModalOk').click({timeout:15000});
  await page.waitForTimeout(300);
  s=await step(page,label+'/room-modal-closed');
  const btn=page.locator('#dc01Explore');
  assert.ok(/COMBAT|ATTAQUER|PORTEUR/i.test(await btn.textContent()),label+' real main action exposes enemy or fight');
  assert.equal(await btn.isDisabled(),false,label+' combat entry button enabled');
  // An actual effect popup may appear after closing the room narration.
  // A player dismisses it with OK; do not bypass the overlay or force a click.
  let clicked=false;
  for(let attempt=0;attempt<4&&!clicked;attempt++){
    const popup=page.locator('#effectModal.open');
    if(await popup.isVisible()) await popup.locator('button.effectClose').click({timeout:5000});
    try{await btn.click({timeout:3500});clicked=true}
    catch(error){
      if(!(await popup.isVisible()))throw error;
      await popup.locator('button.effectClose').click({timeout:5000});
    }
  }
  assert.equal(clicked,true,label+' real fight button clicked after dismissing user-visible effect popups');
  await page.waitForTimeout(3000);
  s=await step(page,label+'/engaged-combat');
  console.log('DUNGEON_REAL_COMBAT_DOM '+label+' '+JSON.stringify(await page.evaluate(()=>{
    const ids=['dungeonCombatModal','gtv2Root','gtv2Overlay','gensDungeonCore01','dc01Modal'];
    return {nodes:ids.map(id=>{const e=document.getElementById(id);return {id,exists:!!e,display:e?.style.display,classes:e?.className,visible:!!e&&e.getClientRects().length>0}}),
      buttons:[...document.querySelectorAll('button')].filter(x=>x.getClientRects().length&&/attaqu|termin|action|tour|fin du tour|d[ée]plac|comp[ée]tence/i.test(x.textContent||'')).slice(0,25).map(x=>({id:x.id,cls:x.className,text:x.textContent.trim().slice(0,75),disabled:x.disabled})),
      combatActive:typeof dungeonCombatActive==='undefined'?null:dungeonCombatActive,
      tacticalOwner:typeof window.GensRpgTacticalCombatV2Ui?.getBattle==='function'?!!window.GensRpgTacticalCombatV2Ui.getBattle():null
    }
  })));
  console.log('DUNGEON_COMBAT_ERRORS '+label+' '+JSON.stringify(errs));
  console.log('DUNGEON_COMBAT_MODALS '+label+' '+JSON.stringify(await page.evaluate(()=>({
    effectOpen:document.getElementById('effectModal')?.classList.contains('open'),
    effectTitle:document.getElementById('effectTitle')?.textContent,
    core200Open:document.getElementById('dc200Modal')?.classList.contains('open'),
    core200Title:document.getElementById('dc200ModalTitle')?.textContent,
    core200Body:document.getElementById('dc200ModalBody')?.textContent?.slice(0,500),
    battleActive:!!window.GensRpgTacticalCombatV2Ui?.getBattle?.(),
    bridgeType:typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat,
    banner:document.getElementById('dungeonCombatSetupView')?.textContent?.slice(0,400)
  }))));
  // The specific Core200 room/spawn repair is validated above. Whether the
  // asynchronous Tactical bridge actually opens a battle is a distinct contract:
  // record its result without marking an unverified fight as a success.
  console.log('DUNGEON_COMBAT_HANDOFF_DIAG '+JSON.stringify({browser:label,
    clickedRealCombatButton:true,overlayVisible:s.tacticalVisible,
    activeEnemyCount:s.enemyCount,oldAiNoop:s.aiOldNoop,errors:errs}));
  assert.equal(s.room,1,label+' combat handoff must not silently change the active room');
  assert.ok(s.enemyCount>0,label+' handoff must retain real living enemies');
  assert.equal(errs.length,0,label+' spawn and combat handoff must not throw unhandled page exceptions');
  console.log('DUNGEON_REAL_RESULT '+JSON.stringify({browser:label,certifiedScope:'room-and-spawn-only',
    combatHandoffOpened:s.tacticalVisible,room:s.room,enemyCount:s.enemyCount,errors:errs,alerts}));
 } finally {await context.close()}
}
(async()=>{
 for(const [label,engine] of [['Chromium',chromium],['Firefox',firefox]]){
  const browser=await engine.launch({headless:true,args:label==='Chromium'?['--disable-dev-shm-usage']:[]});
  try{await exercise(browser,label);console.log(label+' Dungeon profile→room→actual enemy spawn PASS; Tactical overlay remains unvalidated')}
  finally{await browser.close()}
 }
})().catch(e=>{console.error('DUNGEON_REAL_FLOW_RED '+(e.stack||e));process.exitCode=1});
