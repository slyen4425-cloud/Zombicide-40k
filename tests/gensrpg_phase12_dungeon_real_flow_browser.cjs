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
 const page=await context.newPage(),errs=[],alerts=[];
 page.on('pageerror',e=>errs.push(e.message));
 page.on('dialog',async d=>{alerts.push(d.type()+': '+d.message().slice(0,160));await d.accept()});
 try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.DungeonCore01?.start==='function'&&typeof window.switchGameModeFromHome==='function',{timeout:20000});
  await step(page,label+'/load');
  // The live interface is hierarchical: mode family -> game -> new session.
  // The old profile-switcher exists in HTML but is deliberately hidden.
  await page.locator('#gensRootHome .gensRootModeCard.adventure').click({timeout:15000});
  await page.locator('#gensFamilyHome').waitFor({state:'visible',timeout:15000});
  const games=page.locator('#gensFamilyGames .gensFamilyGameCard');
  await games.first().waitFor({state:'visible',timeout:15000});
  console.log('DUNGEON_REAL_PROFILE_OPTIONS '+label+' '+JSON.stringify(await games.allTextContents()));
  const dungeonGame=games.filter({hasText:/dungeon/i}).first();
  assert.ok(await dungeonGame.count(),label+' built-in Dungeon available in adventure family');
  console.log('DUNGEON_REAL_CARD_HTML '+label+' '+(await dungeonGame.evaluate(n=>n.outerHTML)).slice(0,5500));
  await dungeonGame.locator('button.gensUniverseMainBtn').click({timeout:15000});
  await page.waitForTimeout(250);
  console.log('DUNGEON_REAL_AFTER_CARD '+label+' '+JSON.stringify(await page.evaluate(()=>({family:document.getElementById('gensFamilyHome')?.style.display,game:document.getElementById('gensGameHome')?.style.display,root:document.getElementById('gensRootHome')?.style.display,active:getActiveGameProfile?.()?.id,visiblePanels:[...document.querySelectorAll('#gensFamilyGames button')].filter(n=>n.getClientRects().length>0).map(n=>({text:n.textContent.trim().slice(0,90),onclick:n.getAttribute('onclick')})).slice(0,12)}))));
  await page.locator('#gensGameHome').waitFor({state:'visible',timeout:5000});
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
  s=await step(page,label+'/explored');
  assert.equal(s.room,1,label+' user clicked first real room');
  assert.ok(s.enemyCount>0,label+' actual encounter generated real Dungeon enemies');
  assert.equal(s.lastKind,'enemy',label+' encounter selection is real enemy case');
  assert.equal(s.modalOpen,true,label+' room narration modal opens');
  await page.locator('#dc01Modal button[onclick*="closeModal"]').first().click({timeout:15000});
  await page.waitForTimeout(300);
  s=await step(page,label+'/room-modal-closed');
  const btn=page.locator('#dc01Explore');
  assert.ok(/COMBAT|ENNEMI/i.test(await btn.textContent()),label+' real main action changes to combat');
  assert.equal(await btn.isDisabled(),false,label+' combat entry button enabled');
  await btn.click({timeout:15000});
  await page.waitForTimeout(800);
  s=await step(page,label+'/engaged-combat');
  console.log('DUNGEON_REAL_COMBAT_DOM '+label+' '+JSON.stringify(await page.evaluate(()=>{
    const ids=['dungeonCombatModal','gtv2Root','gtv2Overlay','gensDungeonCore01','dc01Modal'];
    return {nodes:ids.map(id=>{const e=document.getElementById(id);return {id,exists:!!e,display:e?.style.display,classes:e?.className,visible:!!e&&e.getClientRects().length>0}}),
      buttons:[...document.querySelectorAll('button')].filter(x=>x.getClientRects().length&&/attaqu|termin|action|tour|fin du tour|d[ée]plac|comp[ée]tence/i.test(x.textContent||'')).slice(0,25).map(x=>({id:x.id,cls:x.className,text:x.textContent.trim().slice(0,75),disabled:x.disabled})),
      combatActive:typeof dungeonCombatActive==='undefined'?null:dungeonCombatActive,
      tacticalOwner:typeof window.GensRpgTacticalCombatV2Ui?.getBattle==='function'?!!window.GensRpgTacticalCombatV2Ui.getBattle():null
    }
  })));
  assert.ok(s.tacticalVisible,label+' actual Tactical combat overlay opened');
  assert.equal(s.renderSource,true,label+' Core3.03 remains effective combat owner');
  assert.equal(s.aiOldNoop,true,label+' old AI remains retired by owner');
  console.log('DUNGEON_REAL_RESULT '+JSON.stringify({browser:label,reached:'combat-overlay',room:s.room,enemyCount:s.enemyCount,errors:errs,alerts}));
 } finally {await context.close()}
}
(async()=>{
 for(const [label,engine] of [['Chromium',chromium],['Firefox',firefox]]){
  const browser=await engine.launch({headless:true,args:label==='Chromium'?['--disable-dev-shm-usage']:[]});
  try{await exercise(browser,label);console.log(label+' real Dungeon profile→room→encounter→combat flow PASS')}
  finally{await browser.close()}
 }
})().catch(e=>{console.error('DUNGEON_REAL_FLOW_RED '+(e.stack||e));process.exitCode=1});
