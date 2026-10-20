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
 const page=await context.newPage(),errs=[],alerts=[],consoleErrors=[],scriptsFailed=[];
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')consoleErrors.push(m.type()+': '+m.text().slice(0,1000))});
 page.on('requestfailed',req=>scriptsFailed.push(req.url().split('/').slice(-1)[0]+' '+req.failure()?.errorText));
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
  await page.waitForTimeout(4500);
  s=await step(page,label+'/engaged-combat');
  console.log('DUNGEON_TACTICAL_BRIDGE_TRACE '+label+' '+JSON.stringify(await page.evaluate(()=>{
    const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}'),A=window.GensRpgTacticalCombatV2Adapter;
    const authority=window.GensRpgTacticalRuntimeAuthority1678113,ids=(loadActiveEnemies?.()||[]).filter(e=>!e.defeated&&Number(e.hp)>0).map(e=>String(e.id));
    const B=window.GensRpgTacticalCombatV2Bridge;
    let selection=null;
    try{selection=authority?.selectCombatants?.(window,{enemyIds:ids,reason:'manual',entry:'dc200ManualAction'})||null}catch(e){selection={error:String(e)}}
    let eligibility=null;
    try{eligibility=B?.eligible?.(window,{enemyIds:ids})||null}catch(e){eligibility={error:String(e)}}
    return {loader:window.GensTacticalV1?.status?.(),family:localStorage.getItem('gensrpg_session_family_guard_v1'),selection,eligibility,
      heroRooms:rt.heroRooms,positions:rt.positions,participants:rt.participants,room:rt.room,enemyCells:rt.enemyCells,
      adapterReady:!!A,entered:A?.enteredParticipants?.(window,rt.participants)||null,
      bridgeReady:!!B,bridgeInstalled:B?.status?.()||null,
      reason:window.__gensTacticalV2LastRoute||null,
      battleExists:!!window.GensRpgTacticalCombatV2Ui?.getBattle?.(),
      scriptNodes:[...document.querySelectorAll('script[src*="tactical"],script[src*="Tactical"]')].map(x=>x.src.split('/').slice(-1)[0])
    }
  })));
  console.log('DUNGEON_TACTICAL_BROWSER_MESSAGES '+label+' '+JSON.stringify({consoleErrors,scriptsFailed,errs}));
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
  assert.equal(s.tacticalVisible,true,label+' real combat click must open an actual Tactical overlay');
  // Real combat contract: canonical Core Stats snapshot from the installed
  // Core owner, not a Tactical fallback or a test-injected hero record.
  await page.waitForFunction(()=>{
    const B=window.GensRpgTacticalCombatV2Ui?.getBattle?.(),E=window.GensRpgTacticalCombatV2;
    return B&&E&&B.status==='active'&&B.actors.some(a=>a.side==='hero');
  },{timeout:20000});
  await page.waitForFunction(()=>{
    const b=window.GensRpgTacticalCombatV2Ui?.getBattle?.();
    const e=window.GensRpgTacticalCombatV2;
    return !!b&&e?.currentActor?.(b)?.side==='hero';
  },{timeout:25000});
  const beforeTurn=await page.evaluate(()=>{
    const B=window.GensRpgTacticalCombatV2Ui.getBattle(),E=window.GensRpgTacticalCombatV2;
    const heroes=B.actors.filter(a=>a.side==='hero'),enemies=B.actors.filter(a=>a.side==='enemy');
    return {logLength:B.log.length,round:B.round,status:B.status,current:E.currentActor(B)?.id,
      hero:heroes.map(a=>({id:a.id,hp:a.hp,statsVersion:a.meta?.rpgStats?.version,canonical:a.meta?.rpgStats?.canonical?.length||0})),
      enemy:enemies.map(a=>({id:a.id,hp:a.hp,instanceId:a.meta?.instanceId})),
      coreReady:typeof window.GensCleanRpgStats167874?.coreSnapshot==='function',
      services:['GensStatsValueEngineV1','GensStatsHeroValuesV1','GensStatsModifierProviderV1','GensStatsDerivedValuesV1','GensStatsSnapshotV1'].every(k=>!!window[k])};
  });
  console.log('DUNGEON_TACTICAL_TURN_BEFORE '+label+' '+JSON.stringify(beforeTurn));
  assert.equal(beforeTurn.coreReady,true,label+' canonical Core Stats is the active snapshot owner');
  assert.equal(beforeTurn.services,true,label+' all five canonical Core Stats services are installed');
  assert.equal(beforeTurn.hero.length,1,label+' only entered hero may join Tactical');
  assert.equal(beforeTurn.enemy.length,1,label+' combat contains generated enemy');
  assert.ok(beforeTurn.hero[0].canonical>0,label+' real hero contains canonical stat records');
  assert.ok(beforeTurn.hero[0].statsVersion,label+' hero has cached canonical Tactical snapshot');
  await page.locator('.gtv2Overlay .gtv2Actions button[data-end]').click({timeout:12000});
  await page.waitForFunction(previous=>{
    const B=window.GensRpgTacticalCombatV2Ui?.getBattle?.(),E=window.GensRpgTacticalCombatV2;
    if(!B||!E)return false;
    const events=B.log.slice(previous);
    return events.some(x=>x.type==='turn'&&String(x.actorId||'').startsWith('enemy:')) &&
      (B.status!=='active'||E.currentActor(B)?.side==='hero');
  },beforeTurn.logLength,{timeout:30000});
  const afterTurn=await page.evaluate(previous=>{
    const B=window.GensRpgTacticalCombatV2Ui.getBattle(),E=window.GensRpgTacticalCombatV2;
    const events=B.log.slice(previous);
    return {round:B.round,turnIndex:B.turnIndex,status:B.status,current:E.currentActor(B)?.id,
      events:events.map(x=>({type:x.type,actorId:x.actorId,attackerId:x.attackerId,targetId:x.targetId,damage:x.damage,hit:x.hit})),
      enemyAction:events.some(x=>['attack','move'].includes(x.type)&&String(x.actorId||x.attackerId||'').startsWith('enemy:')),
      heroHp:B.actors.filter(a=>a.side==='hero').map(a=>({id:a.id,hp:a.hp})),
      enemyHp:B.actors.filter(a=>a.side==='enemy').map(a=>({id:a.id,hp:a.hp})),
      room:loadDungeonState?.()?.room};
  },beforeTurn.logLength);
  console.log('DUNGEON_TACTICAL_FIRST_TURN '+label+' '+JSON.stringify(afterTurn));
  assert.equal(afterTurn.room,1,label+' combat turn does not move Dungeon to another room');
  assert.ok(afterTurn.events.some(x=>x.type==='turn'&&String(x.actorId||'').startsWith('enemy:')),label+' hero UI ended its turn and engine activated enemy');
  assert.equal(errs.length,0,label+' first real Tactical turn has no unhandled JavaScript errors');

  console.log('DUNGEON_REAL_RESULT '+JSON.stringify({browser:label,certifiedScope:'combat-handoff',
    combatHandoffOpened:s.tacticalVisible,room:s.room,enemyCount:s.enemyCount,errors:errs,alerts}));
 } finally {await context.close()}
}
(async()=>{
 for(const [label,engine] of [['Chromium',chromium],['Firefox',firefox]]){
  const browser=await engine.launch({headless:true,args:label==='Chromium'?['--disable-dev-shm-usage']:[]});
  try{await exercise(browser,label);console.log(label+' Dungeon room→Tactical overlay→real end-turn and enemy activation PASS')}
  finally{await browser.close()}
 }
})().catch(e=>{console.error('DUNGEON_REAL_FLOW_RED '+(e.stack||e));process.exitCode=1});
