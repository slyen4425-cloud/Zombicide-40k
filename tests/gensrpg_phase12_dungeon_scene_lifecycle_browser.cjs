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
 page.on('console',m=>{if(m.text().startsWith('DUNGEON_CHEST_TRACE_'))console.log('DUNGEON_CHEST_TRACE_BROWSER '+label+' '+m.text());if(m.type()==='error'||m.type()==='warning')consoleErrors.push(m.type()+': '+m.text().slice(0,1000))});
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
   saveDungeonConfig({...cfg,rooms:10,boss:'none',challenges:[],challengeDoorChance:0,challengeChestChance:0,chestTrapChance:0,roomWeights:{enemy:100,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0}});
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


  // Observe only: genuine Tactical combat completion callback.
  await page.evaluate(()=>{
    window.__dungeonRealFinishEvents=[];
    window.addEventListener('gensrpg:tactical-combat-finished',event=>{
      const d=event.detail||{};
      window.__dungeonRealFinishEvents.push({
        winner:d.winner||null,reason:d.reason||null,
        summary:d.summary?{heroes:d.summary.heroes,enemies:d.summary.enemies,
          rewards:(d.summary.rewards||[]).map(x=>({instanceId:x.instanceId,enemyId:x.enemyId,killerId:x.killerId,
            xp:x.xp,drops:x.drops}))}:null
      });
    });
  });
  const combatSnapshot=()=>page.evaluate(()=>{
    const b=window.GensRpgTacticalCombatV2Ui?.getBattle?.();
    if(!b)return null;
    const active=window.GensRpgTacticalCombatV2?.currentActor?.(b);
    const targets=b.actors.filter(a=>a.alive&&a.side==='enemy');
    const previews=active?.side==='hero'?active.attacks.flatMap(atk=>targets.map(enemy=>{
      const p=window.GensRpgTacticalCombatV2.attackPreview(b,active.id,enemy.id,atk.id);
      return {attackId:atk.id,targetId:enemy.id,ok:p?.ok,reason:p?.reason,distance:p?.distance};
    })):[];
    return {status:b.status,winner:b.winner,round:b.round,turnIndex:b.turnIndex,
      current:{id:active?.id,side:active?.side,actionsLeft:active?.actionsLeft,movementLeft:active?.movementLeft},
      actors:b.actors.map(a=>({id:a.id,side:a.side,hp:a.hp,maxHp:a.maxHp,alive:a.alive,x:a.x,y:a.y})),
      log:b.log.filter(e=>['attack','turn','move'].includes(e.type)).map(e=>({type:e.type,actorId:e.actorId,attackerId:e.attackerId,targetId:e.targetId,
        hit:e.hit,damage:e.damage,roll:e.roll,round:e.round})),previews,
      resultButton:!!document.querySelector('.gtv2Overlay [data-commit]'),
      diceModal:!!document.querySelector('.gtv2DiceBackdrop'),
      target:!!document.querySelector('.gtv2Overlay [data-target]'),
      approach:!!document.querySelector('.gtv2Overlay [data-approach]:not(:disabled)'),
      end:!!document.querySelector('.gtv2Overlay [data-end]:not(:disabled)'),
      attack:!!document.querySelector('.gtv2Overlay [data-v108-panel] [data-v108-attack-go]:not(:disabled)')
    };
  });
  const first=await combatSnapshot();
  assert.ok(first?.actors?.some(x=>x.side==='hero'),label+' real hero enters combat');
  assert.ok(first?.actors?.some(x=>x.side==='enemy'),label+' actual Dungeon enemy enters combat');
  console.log('DUNGEON_END_START '+JSON.stringify({browser:label,first}));
  let heroClicks=0,turnClicks=0,approachClicks=0,diceClicks=0,lastAction='',ended=null;
  for(let attempt=0;attempt<170;attempt++){
    let now=await combatSnapshot();
    if(now?.status==='ended'){ended=now;break;}
    if(!now){console.log('DUNGEON_END_NO_BATTLE '+label+' '+JSON.stringify({attempt,lastAction}));break;}
    const dice=page.locator('.gtv2DiceBackdrop [data-dice-continue]');
    if(await dice.count()){
      await page.waitForFunction(()=>{const e=document.querySelector('.gtv2DiceBackdrop [data-dice-continue]');return e&&!e.disabled},{timeout:12000});
      await dice.click({timeout:8000});diceClicks++;lastAction='dice';
      await page.waitForTimeout(90);continue;
    }
    if(now.current.side!=='hero'){
      await page.waitForTimeout(140);continue;
    }
    if(now.target){
      const chosen=now.previews.find(p=>p.ok)||now.previews[0];
      if(chosen)await page.locator('.gtv2Overlay [data-target]').first().click({timeout:7000});
      now=await combatSnapshot();
    }
    if(now.previews.some(p=>p.ok)&&now.current.actionsLeft>0){
      const button=page.locator('.gtv2Overlay [data-v108-panel] [data-v108-attack-go]').first();
      if(await button.isVisible()&&!await button.isDisabled()){
        await button.click({timeout:8000});heroClicks++;lastAction='hero-attack';
      }else if(now.end){await page.locator('.gtv2Overlay [data-end]').click({timeout:7000});turnClicks++;lastAction='end-turn';}
      else break;
    }else if(now.approach){
      await page.locator('.gtv2Overlay [data-approach]').click({timeout:8000});approachClicks++;lastAction='approach';
    }else if(now.end){
      await page.locator('.gtv2Overlay [data-end]').click({timeout:8000});turnClicks++;lastAction='end-turn';
    }else{console.log('DUNGEON_END_STUCK '+label+' '+JSON.stringify({attempt,lastAction,now}));break;}
    if(attempt%12===0)console.log('DUNGEON_END_PROGRESS '+JSON.stringify({browser:label,attempt,heroClicks,turnClicks,approachClicks,diceClicks,state:await combatSnapshot()}));
    await page.waitForTimeout(150);
  }
  // A lethal blow ends the engine immediately, but the last native dice
  // overlay is still awaiting the player's Continuer click. Finish that UI
  // interaction before requiring the victory/result button.
  for(let n=0;n<8;n++){
    const lastDice=page.locator('.gtv2DiceBackdrop [data-dice-continue]');
    if(!(await lastDice.count()))break;
    await page.waitForFunction(()=>{const e=document.querySelector('.gtv2DiceBackdrop [data-dice-continue]');return e&&!e.disabled},{timeout:12000});
    await lastDice.click({timeout:8000});diceClicks++;
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(()=>!!document.querySelector('.gtv2Overlay [data-commit]'),{timeout:12000});
  ended=await combatSnapshot();
  console.log('DUNGEON_END_BATTLE '+JSON.stringify({browser:label,ended,heroClicks,turnClicks,approachClicks,diceClicks,lastAction,errs,consoleErrors}));
  assert.ok(ended,label+' battle reaches a native ended state through player UI');
  assert.ok(['hero','enemy'].includes(ended.winner),label+' engine declares a legitimate winner');
  assert.ok(ended.log.some(x=>x.type==='attack'&&first.actors.some(a=>a.id===x.attackerId&&a.side==='hero')),label+' native hero attacks logged');
  assert.ok(ended.log.some(x=>x.type==='turn'&&first.actors.some(a=>a.id===x.actorId&&a.side==='enemy')),label+' native enemy AI turns logged');
  for(const attack of ended.log.filter(x=>x.type==='attack')){
    assert.ok(Number.isInteger(attack.roll)&&attack.roll>=1&&attack.roll<=100,label+' every attack uses a valid D100');
    assert.ok(Number.isFinite(attack.damage)&&attack.damage>=0,label+' engine records real damage');
  }
  for(const actor of first.actors){
    const total=ended.log.filter(x=>x.type==='attack'&&x.targetId===actor.id).reduce((n,x)=>n+x.damage,0);
    assert.equal(ended.actors.find(a=>a.id===actor.id)?.hp,Math.max(0,actor.hp-total),label+' real result HP consistent for '+actor.id);
  }
  assert.equal(ended.resultButton,true,label+' native "Appliquer le résultat et revenir au donjon" shown');
  const preCommit=await page.evaluate(()=>({
    activeEnemies:loadActiveEnemies().map(x=>({id:x.id,hp:x.hp,defeated:x.defeated})),
    storage:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}'),
    hero:loadState('dungeon_aldren'),
    scene:loadDungeonState()
  }));
  await page.locator('.gtv2Overlay [data-commit]').click({timeout:10000});
  await page.waitForTimeout(400);
  const finish=await page.evaluate(()=>({
    events:window.__dungeonRealFinishEvents,
    battleStillActive:!!window.GensRpgTacticalCombatV2Ui?.getBattle?.(),
    overlayExists:!!document.querySelector('.gtv2Overlay'),
    room:loadDungeonState()?.room,
    live:dungeonLivingEnemies().map(x=>({id:x.id,hp:x.hp})),
    enemies:loadActiveEnemies().map(x=>({id:x.id,hp:x.hp,defeated:x.defeated})),
    popup:{open:document.getElementById('dc200Modal')?.classList.contains('open'),
      title:document.getElementById('dc200ModalTitle')?.textContent,
      body:document.getElementById('dc200ModalBody')?.textContent?.slice(0,900)},
    hero:loadState('dungeon_aldren'),
    activeSession:hasActiveSession(),
    explore:document.getElementById('dc01Explore')?.textContent?.trim(),
    runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}')
  }));
  console.log('DUNGEON_END_COMMIT '+JSON.stringify({browser:label,winner:ended.winner,preCommit,finish,errs,consoleErrors}));
  assert.equal(finish.battleStillActive,false,label+' UI destroys battle after explicit commit');
  assert.equal(finish.overlayExists,false,label+' combat overlay closed by native result button');
  assert.equal(finish.room,1,label+' returns to original Dungeon room');
  assert.equal(finish.events.length,1,label+' one real Tactical→Dungeon finish event');
  assert.equal(finish.events[0].winner,ended.winner,label+' winner transferred from engine to Dungeon');
  assert.equal(finish.activeSession,true,label+' game session remains resumable');
  if(ended.winner==='hero'){
    const shares=finish.events[0].summary?.rewards?.flatMap(r=>r.xp?.shares||[])||[];
    const earned=shares.filter(row=>row.id==='dungeon_aldren').reduce((n,row)=>n+Number(row.xp||0),0);
    assert.ok(earned>0,label+' actual skeleton defeat grants native XP');
    assert.equal(Number(finish.hero.xp),Number(preCommit.hero.xp)+earned,label+' real XP matches only the native reward shares');
  }
  assert.equal(finish.live.length,ended.winner==='hero'?0:finish.live.length,label+' victory clears defeated enemy from live room');
  if(ended.winner==='hero'){
    assert.ok(Array.isArray(finish.events[0].summary?.rewards),label+' native result includes a rewards array');
    assert.ok(finish.events[0].summary.rewards.length>0,label+' defeated skeleton processed for XP/drop');
    assert.equal(finish.popup.open,true,label+' victory reward popup displayed in Dungeon');
    assert.ok(/victoire/i.test(finish.popup.title||''),label+' native victory title displayed');
    await page.locator('#dc200ModalOk').click({timeout:9000});
  }
  assert.equal(errs.length,0,label+' no unhandled page error before and after combat result');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(850);
  const resumed=await page.evaluate(()=>({
    profile:getActiveGameProfile?.()?.id,session:hasActiveSession(),room:loadDungeonState()?.room,
    enemies:loadActiveEnemies().map(e=>({id:e.id,hp:e.hp,defeated:e.defeated})),
    live:dungeonLivingEnemies().map(e=>String(e.id)),
    heroes:loadGameParticipants(),
    popup:document.getElementById('dc200Modal')?.classList.contains('open'),
    gameHomeButtons:[...document.querySelectorAll('#gensGameHomeActions button')].map(b=>({className:b.className,text:b.textContent?.trim(),visible:!!b.getClientRects().length})),
    rootHomeVisible:!!document.getElementById('gensRootHome')?.getClientRects().length,
    coreVisible:!!document.getElementById('gensDungeonCore01')?.getClientRects().length
  }));
  console.log('DUNGEON_END_RELOAD '+JSON.stringify({browser:label,resumed}));
  assert.equal(resumed.profile,'game_profile_dungeon_demo',label+' Dungeon selected profile retained across reload');
  assert.equal(resumed.session,true,label+' active Dungeon session persisted after combat');
  assert.equal(resumed.room,1,label+' Dungeon room persisted after refresh');
  if(ended.winner==='hero')assert.equal(resumed.live.length,0,label+' cleared enemy remains defeated/removed after reload');
  // Use the visible player navigation to resume; reading localStorage alone
  // is not proof that the saved Dungeon actually renders as a playable scene.
  await page.locator('#gensRootHome .gensRootModeCard.adventure').click({timeout:15000});
  await page.locator('#gensFamilyHome').waitFor({state:'visible',timeout:15000});
  await page.locator('#gensFamilyGames .gensUniverseCard[data-rpg-profile="game_profile_dungeon_demo"] button.gensUniverseMainBtn').click({timeout:15000});
  await page.locator('#gensGameHome').waitFor({state:'visible',timeout:15000});
  const resumeButton=page.locator('#gensGameHomeActions button.resumeBtn');
  assert.equal(await resumeButton.isVisible(),true,label+' native REPRENDRE LA PARTIE is offered after reload');
  await resumeButton.click({timeout:15000});
  await page.locator('#gensDungeonCore01').waitFor({state:'visible',timeout:15000});
  const visibleResume=await page.evaluate(()=>({
    coreActive:!!window.DungeonCore01?.active,
    coreVisible:!!document.getElementById('gensDungeonCore01')?.getClientRects().length,
    room:loadDungeonState()?.room,
    live:dungeonLivingEnemies()?.length,
    xp:Number(loadState('dungeon_aldren')?.xp)||0,
    wounds:Number(loadState('dungeon_aldren')?.wounds)||0,
    participantIds:loadGameParticipants(),
    explore:document.getElementById('dc01Explore')?.textContent?.trim(),
    overlay:!!document.querySelector('.gtv2Overlay'),
    enemies:loadActiveEnemies().map(e=>({id:e.id,hp:e.hp,defeated:e.defeated}))
  }));
  console.log('DUNGEON_END_UI_RESUME '+JSON.stringify({browser:label,visibleResume}));
  assert.equal(visibleResume.coreActive,true,label+' official resume reactivates Dungeon Core');
  assert.equal(visibleResume.coreVisible,true,label+' official resume shows playable Dungeon');
  assert.equal(visibleResume.room,1,label+' official resume returns to cleared room 1');
  assert.equal(visibleResume.live,0,label+' defeated enemy is still absent after UI resume');
  assert.equal(visibleResume.xp,Number(finish.hero.xp)||0,label+' XP not paid a second time on UI resume');
  assert.equal(visibleResume.wounds,Number(finish.hero.wounds)||0,label+' real combat wounds retained on UI resume');
  assert.equal(visibleResume.overlay,false,label+' no stale Tactical overlay intercepting Dungeon after resume');
  assert.ok(/EXPLORER|SORTIE|REJOINDRE|COFFRE|FOUILLER|DÉVERROUILLER|PASSAGE/.test(visibleResume.explore||''),label+' existing Dungeon world exposes its actual scene action after resume (chest takes precedence over exit)');

  // The test resumes in actual Dungeon UI, not merely from localStorage.
  // A map chest can legitimately take priority over the exit; use the real
  // chest interaction first. Only configuration weights/challenge chance
  // were changed via Dungeon's public editor before room generation.
  const sceneState=()=>page.evaluate(()=>{
    const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}'),
      hero=x.participants?.[x.index]||'',map=x.last?.map||{},
      ex=Number.isInteger(Number(map.exitIdx))?Number(map.exitIdx):map.cells?.indexOf('exit');
    return {room:x.room,hero,heroRoom:x.heroRooms?.[hero],heroPos:x.positions?.[hero],
      remaining:x.remaining?.[hero],exit:ex,lastKind:x.last?.kind,branch:x.branch?.active||false,
      roomStateKeys:Object.keys(x.roomStates||{}),room1Cells:x.roomStates?.['1']?.last?.map?.cells?.slice()||[],
      sceneMap:map.cells?.slice()||[],lastTitle:x.last?.title||'',
      action:document.getElementById('dc01Explore')?.textContent?.trim()||'',
      actionDisabled:!!document.getElementById('dc01Explore')?.disabled,
      modalOpen:!!document.getElementById('dc200Modal')?.classList.contains('open'),
      popTitle:document.getElementById('dc200ModalTitle')?.textContent,
      tactical:typeof window.dc305PositionalGameplay==='function'?window.dc305PositionalGameplay():null,
      activeEnemies:(loadActiveEnemies?.()||[]).filter(e=>Number(e.hp)>0&&!e.defeated).map(e=>({id:e.id,room:e.dungeonRoom,hp:e.hp})),
      chests:(loadDungeonSceneElements?.()||[]).filter(e=>e.kind==='chest'&&Number(e.room)===Number(x.room)).map(e=>({id:e.id,challenge:!!e.challenge,done:!!e.challengeDone,idx:e.cellIndex})),
      fullScene:(loadDungeonSceneElements?.()||[]).filter(e=>Number(e.room)===Number(x.room)).map(e=>({kind:e.kind,id:e.id,idx:e.cellIndex,room:e.room,branch:e.branch200})),
      sceneVersion:(loadDungeonSceneElements?.()||[]).length,
      modalButton:document.getElementById('dc200ModalOk')?.onclick?.toString()?.slice(0,120),
      boardCells:document.querySelectorAll('#dc047RoomBoard .dc047Grid >.dc047Cell').length
    }
  });
  // Deterministic chest authored through REAL in-game GM controls, not by
  // writing localStorage or invoking any scene creation function from test.
  // It exercises the public add > loot > removal lifecycle and catches the
  // silent repeatable 'Ouvrir le coffre' regression regardless of room RNG.
  const roleChoice=page.locator('#dc01Role');
  await roleChoice.selectOption('gm',{timeout:9000});
  const gmButton=page.locator('#dc01Gm');
  assert.equal(await gmButton.isVisible(),true,label+' native Dungeon GM tools become available when player selects GM role');
  await gmButton.click({timeout:9000});
  const addChest=page.locator('#dc200ModalBody button').filter({hasText:/Coffre commun/i}).first();
  await addChest.waitFor({state:'visible',timeout:9000});
  await addChest.click({timeout:9000});
  console.log('DUNGEON_SCENE_GM_CHEST_ADDED '+JSON.stringify({browser:label,state:await sceneState()}));
  // Adding a chest opens the game's native confirmation modal.
  if(await page.locator('#dc200Modal.open').isVisible())await page.locator('#dc200ModalOk').click({timeout:9000});
  assert.ok((await sceneState()).chests.length>0,label+' GM-authored chest stored by native Dungeon API');
  const prior=await sceneState();
  console.log('DUNGEON_ROOM2_BEFORE '+JSON.stringify({browser:label,prior}));
  assert.equal(prior.room,1,label+' actual resume is in the cleared room');
  assert.ok(prior.room1Cells.length>0,label+' original room 1 has a stored real generated map');
  assert.equal(prior.activeEnemies.filter(e=>e.room===1).length,0,label+' old enemy stays defeated before exiting');
  let chestClicks=0,steps=0;
  for(;steps<15;steps++){
    let scene=await sceneState();
    console.log('DUNGEON_ROOM2_PRE_ACTION '+JSON.stringify({browser:label,step:steps,scene}));
    if(scene.room===2)break;
    if(scene.modalOpen){
      console.log('DUNGEON_SCENE_MODAL_BEFORE '+JSON.stringify({browser:label,step:steps,title:scene.popTitle,scene}));
      // Core213 is the active chest owner. Its "CONTINUER" dismisses
      // the information dialog; the actual loot/removal action is a second
      // public button inside the dialog ("OUVRIR / FOUILLER").
      const core213ChestOpen=page.locator('#dc213ChestActions button').first();
      if(await core213ChestOpen.isVisible()){
        await core213ChestOpen.click({timeout:8500});
      }else{
        await page.locator('#dc200ModalOk').click({timeout:8500});
      }
      console.log('DUNGEON_SCENE_MODAL_AFTER '+JSON.stringify({browser:label,step:steps,scene:await sceneState()}));
      continue;
    }
    if(/COFFRE/i.test(scene.action)){
      // Clicks follow the native open -> confirm -> loot callback chain.
      const chestBefore=scene.chests.length;
      assert.ok(chestBefore>0,label+' real chest exists for chest-priority action');
      await page.locator('#dc01Explore').click({timeout:8500});chestClicks++;
      console.log('DUNGEON_SCENE_CHEST_ACTION '+JSON.stringify({browser:label,step:steps,after:await sceneState()}));
      continue;
    }
    if(/REJOINDRE LA SORTIE/.test(scene.action)){
      // Positional mode: always use clickable reachable map cells; no writes
      // to game state. Only allow native UI actions.
      const path=await page.evaluate(()=>{
        const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}'),
          m=x.last?.map||{},cs=m.cells||[],w=Number(m.size)||Math.sqrt(cs.length),start=Number(x.positions?.[x.participants?.[x.index]]),
          end=Number(m.exitIdx),q=[start],seen=new Map([[start,null]]);
        for(let i=0;i<q.length;i++){
          const v=q[i],c=v%w,row=Math.floor(v/w),near=[v-w,v+w,...(c>0?[v-1]:[]),...(c<w-1?[v+1]:[])];
          for(const n of near){if(n<0||n>=cs.length||seen.has(n)||['void','wall'].includes(cs[n]))continue;seen.set(n,v);q.push(n);}
        }
        if(!seen.has(end))return {available:[],noPath:true,start,end};
        const out=[];for(let n=end;n!==start;n=seen.get(n))out.unshift(n);
        const available=[...document.querySelectorAll('#dc047RoomBoard .dc047Grid >.dc047Cell.dc200Reach')].map(e=>Number(e.dataset.dcMapIndex));
        return {route:out,available,start,end};
      });
      console.log('DUNGEON_ROOM2_EXIT_WALK '+JSON.stringify({browser:label,path}));
      assert.ok(path.route?.length,label+' exit has native traversable route');
      // Native movement only; leave turn rotation to a dedicated multi-hero
      // scenario if the current hero has exhausted movement.
      const next=path.route.filter(x=>path.available.includes(x)).at(-1);
      assert.ok(Number.isInteger(next),label+' hero can take a reachable step toward the exit using official map');
      await page.locator('#dc047RoomBoard .dc047Grid >.dc047Cell').nth(next).click({timeout:8500});
      continue;
    }
    assert.match(scene.action,/EXPLORER LA SALLE SUIVANTE/,label+' main UI offers real next-room transition');
    assert.equal(scene.actionDisabled,false,label+' transition remains enabled');
    await page.locator('#dc01Explore').click({timeout:9000});
  }
  const next=await sceneState();
  console.log('DUNGEON_ROOM2_AFTER '+JSON.stringify({browser:label,prior,next,chestClicks,steps,errs,consoleErrors}));
  assert.equal(next.room,2,label+' actual Dungeon core enters new room 2 via public UI');
  assert.equal(next.heroRoom,2,label+' currently active hero owns generated room 2');
  assert.equal(next.branch,false,label+' main dungeon progression does not enter secret branch');
  assert.ok(next.sceneMap.length>0,label+' next room generated a real map');
  assert.ok(next.roomStateKeys.includes('1')&&next.roomStateKeys.includes('2'),label+' per-room states retain both rooms');
  assert.deepEqual(next.room1Cells,prior.room1Cells,label+' previous room map remains unchanged after entering room 2');
  assert.ok(next.activeEnemies.every(e=>e.room===2),label+' active enemies must not leak from defeated room 1');
  assert.equal(next.modalOpen,true,label+' native room 2 narration modal appears');
  assert.match(next.popTitle||'',/SALLE 2/,label+' actual room 2 is announced');
  await page.locator('#dc200ModalOk').click({timeout:9000});
  // Dungeon can legitimately chain the room-intro narrative into secondary
  // objective, encounter or chest notifications. A real user dismisses all
  // visible modal stages before leaving the room or reloading the page.
  // Closing each stage invokes Core200.render() and chest/scene authority.
  for(let notice=0;notice<9;notice++){
    await page.waitForTimeout(260);
    if(await page.locator('#dc200Modal.open').isVisible()){
      console.log('DUNGEON_ROOM2_EXTRA_MODAL '+JSON.stringify({browser:label,notice,title:await page.locator('#dc200ModalTitle').textContent()}));
      await page.locator('#dc200ModalOk').click({timeout:8500});
      continue;
    }
    await page.waitForTimeout(340);
    if(!(await page.locator('#dc200Modal.open').isVisible()))break;
  }
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#dc200Modal.open').isVisible(),false,label+' all genuine room 2 narrative and objective dialogs are dismissed');
  const settled=await sceneState();
  const beforeReloadXp=await page.evaluate(()=>({xp:Number(loadState('dungeon_aldren')?.xp)||0,wounds:Number(loadState('dungeon_aldren')?.wounds)||0}));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(800);
  await page.locator('#gensRootHome .gensRootModeCard.adventure').click({timeout:15000});
  await page.locator('#gensFamilyHome').waitFor({state:'visible',timeout:15000});
  await page.locator('#gensFamilyGames .gensUniverseCard[data-rpg-profile="game_profile_dungeon_demo"] button.gensUniverseMainBtn').click({timeout:15000});
  await page.locator('#gensGameHome').waitFor({state:'visible',timeout:15000});
  const resumeAgain=page.locator('#gensGameHomeActions button.resumeBtn');
  assert.equal(await resumeAgain.isVisible(),true,label+' Dungeon session saved after advancing to room 2');
  await resumeAgain.click({timeout:15000});
  await page.locator('#gensDungeonCore01').waitFor({state:'visible',timeout:15000});
  const afterReloadRoom2=await sceneState();
  const afterReloadXp=await page.evaluate(()=>({xp:Number(loadState('dungeon_aldren')?.xp)||0,wounds:Number(loadState('dungeon_aldren')?.wounds)||0}));
  console.log('DUNGEON_ROOM2_UI_RESTART '+JSON.stringify({browser:label,settled,afterReloadRoom2,beforeReloadXp,afterReloadXp,errs}));
  assert.equal(afterReloadRoom2.room,2,label+' second native resume keeps room 2');
  assert.equal(afterReloadRoom2.heroRoom,2,label+' hero position remains assigned to room 2 after reload');
  assert.equal(afterReloadRoom2.heroPos,settled.heroPos,label+' no avatar teleport after room-2 reload');
  assert.deepEqual(afterReloadRoom2.sceneMap,settled.sceneMap,label+' room 2 map is not regenerated at resume');
  assert.deepEqual(afterReloadRoom2.room1Cells,settled.room1Cells,label+' room 1 stays immutable across room-2 reload');
  assert.deepEqual(afterReloadRoom2.activeEnemies,settled.activeEnemies,label+' no duplicated monsters or cross-room enemies after room-2 reload');
  assert.deepEqual(afterReloadXp,beforeReloadXp,label+' original XP and wounds never change merely from resuming');
  assert.equal(errs.length,0,label+' no uncaught page exceptions in room transition');
  console.log('DUNGEON_ROOM2_SUCCESS '+JSON.stringify({browser:label,hero:next.hero,room:next.room,kind:next.lastKind,monsterCount:next.activeEnemies.length,previousRoomSaved:true,chestClicks}));

  console.log('DUNGEON_RESULT_SCOPE_PASS '+JSON.stringify({browser:label,scope:'combat-result-and-reload-storage',winner:ended.winner,heroClicks,turnClicks,diceClicks}));
 } finally {await context.close()}
}
(async()=>{
 for(const [label,engine] of [['Chromium',chromium],['Firefox',firefox]]){
  const browser=await engine.launch({headless:true,args:label==='Chromium'?['--disable-dev-shm-usage']:[]});
  try{await exercise(browser,label);console.log(label+' real Dungeon Tactical first turn PASS')}
  finally{await browser.close()}
 }
})().catch(e=>{console.error('DUNGEON_REAL_FLOW_RED '+(e.stack||e));process.exitCode=1});
