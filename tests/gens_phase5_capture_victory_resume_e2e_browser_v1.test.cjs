const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const CAPTURE_ID='gp_mt7ker7t_m2iw9';
const CAPTURE_TRAINER='custom_mt7lk6jv_ioga';
const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

async function waitPreview(page){
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.openGensBuiltInGame==='function' &&
    typeof window.startConfiguredGame==='function' &&
    typeof window.resumeGame==='function' &&
    typeof window.gensProfileContentFamily155==='function' &&
    typeof window.captureStartBattleAutomatic==='function' &&
    typeof window.captureBattleUseAbility==='function' &&
    typeof window.captureBattleFinishAndClose==='function'
  ,null,{timeout:60000});
}

async function openAdventure(page){
  const b=page.locator('button.gensRootModeCard.adventure');
  await b.waitFor({state:'visible'});
  await b.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}

async function selectProfile(page,profileId){
  await openAdventure(page);
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+profileId+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});

  const sw=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),profileId);

  if(sw.active&&sw.active!==profileId&&sw.from!==sw.to){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),
      card.click()
    ]);
    await waitPreview(page);
    await openAdventure(page);
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+profileId+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }

  await card.click();
  await page.waitForFunction(id=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,profileId,{timeout:30000});
}

async function startDungeonAndLeaveSavedRuntime(page){
  await selectProfile(page,DUNGEON_ID);
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});
  if(!(await first.isChecked()))await first.check();

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();

  await page.waitForFunction(()=>{
    let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
    return localStorage.getItem('z40k_session_active_v1')==='1' &&
      Array.isArray(rt?.participants)&&rt.participants.length>0 &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none';
  },null,{timeout:15000});

  const beforeQuit=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'));
  assert.ok(Array.isArray(beforeQuit?.participants)&&beforeQuit.participants.length>0,'control Dungeon runtime must persist participants');

  await page.evaluate(()=>window.DungeonCore01.quit());
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none',null,{timeout:10000});

  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'));
  assert.ok(Array.isArray(persisted?.participants)&&persisted.participants.length>0,'Save & Quit must leave a real persisted Dungeon runtime for the cross-module resume test');
}

async function startCapture(page){
  await selectProfile(page,CAPTURE_ID);

  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.waitForFunction(()=>document.body.classList.contains('gensCapturePregame'));

  await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

  let trainer=page.locator('#participantList input[type="checkbox"][value="'+CAPTURE_TRAINER+'"]');
  if(!(await trainer.count()))trainer=page.locator('#participantList input[type="checkbox"]').first();
  await trainer.waitFor({state:'visible'});
  if(!(await trainer.isChecked()))await trainer.check();

  const starter=page.locator('#participantList .captureStarterChoice').first();
  await starter.waitFor({state:'visible'});
  if(!(await page.locator('#participantList .captureStarterChoice.selected').count()))await starter.click();
  await page.waitForFunction(()=>typeof gensCaptureParticipantsReady==='function'&&gensCaptureParticipantsReady()===true);

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>{
    const btn=document.querySelector('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]');
    return !!btn&&!btn.disabled;
  });

  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>(
    localStorage.getItem('z40k_session_active_v1')==='1' &&
    typeof gensMode151==='function'&&gensMode151()==='capture' &&
    getComputedStyle(document.getElementById('captureGameHub')).display!=='none'
  ),null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[phase5-capture-victory-resume-e2e] WATCHDOG');process.exit(1)},210000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  let page=context.pages()[0]||await context.newPage();
  const errors=[];
  const bindPage=p=>{
    p.setDefaultTimeout(25000);p.setDefaultNavigationTimeout(30000);
    p.on('pageerror',e=>errors.push('pageerror:'+String(e)));
    p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
    p.on('dialog',async d=>{try{await d.accept()}catch(e){}});
    p.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  };
  bindPage(page);

  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);

    // Build a real stale Dungeon save first. Capture resume must not be stolen by it.
    await startDungeonAndLeaveSavedRuntime(page);
    await startCapture(page);

    const captureStarted=await page.evaluate(()=>({
      active:activeGameProfileId(),
      mode:gensMode151(),
      session:localStorage.getItem('z40k_session_active_v1'),
      dungeonRuntime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),
      hub:getComputedStyle(document.getElementById('captureGameHub')).display,
      dungeon:getComputedStyle(document.getElementById('gensDungeonCore01')).display
    }));
    assert.equal(captureStarted.active,CAPTURE_ID);
    assert.equal(captureStarted.mode,'capture');
    assert.equal(captureStarted.session,'1');
    assert.ok(Array.isArray(captureStarted.dungeonRuntime?.participants)&&captureStarted.dungeonRuntime.participants.length>0,
      'cross-module fixture must retain the prior Dungeon runtime');
    assert.notEqual(captureStarted.hub,'none');
    assert.equal(captureStarted.dungeon,'none');

    // Real Capture battle engine -> real victory -> real TERMINER route.
    const battleSetup=await page.evaluate(()=>{
      const playerRoster=captureTeamEntityRoster();
      if(!playerRoster.length)return {ok:false,reason:'no-player-roster'};
      const player={...playerRoster[0],stats:{...(playerRoster[0].stats||{}),speed:99,agility:99,agilite:99}};
      const pool=loadSharedEntities().filter(x=>x?.category==='creature'&&String(x.id)!==String(player.id));
      if(!pool.length)return {ok:false,reason:'no-enemy-pool'};
      const base=pool[0];
      const enemy={...base,hp:1,maxHp:1,level:1,stats:{...(base.stats||{}),speed:1,agility:1,agilite:1,defense:0}};
      const b=captureStartBattleAutomatic(
        {name:'Dresseur test',roster:[player],controller:'human'},
        {name:'Adversaire test',roster:[enemy],controller:'mj'},
        {type:'trainer',captureAllowed:false,activeSlots:1,teamSize:1,minBattleTeam:1,maxBattleTeam:1,
         recallCost:'turn',controller:'mj',saveBattle:false,itemsAllowed:false,defendAllowed:true}
      );
      if(!b)return {ok:false,reason:'battle-create-failed'};
      b.awaitingStart=false;
      const a=b.sides.A.active[0],e=b.sides.B.active[0];
      const ec=b.sides.B.creatures.find(x=>x.instanceId===e);
      ec.hp=1;ec.maxHp=1;ec.ko=false;ec.defended=false;
      b.turnOrder=[
        {sideKey:'A',instanceId:a,initiative:999,speed:999},
        {sideKey:'B',instanceId:e,initiative:1,speed:1}
      ];
      b.turnIndex=0;
      captureRenderBattleLive(b);
      return {ok:true,a,e,phase:b.phase};
    });
    assert.equal(battleSetup.ok,true,'real Capture battle must be creatable from the active Capture session');

    await page.evaluate(()=>{
      const old=Math.random;Math.random=()=>0.99;
      try{captureBattleUseAbility('capture_basic_attack')}finally{Math.random=old}
    });

    await page.waitForFunction(()=>{
      const b=window.gensCurrentCaptureBattle;
      return b?.phase==='ended'&&b?.victory?.winner==='A'&&
        !!document.querySelector('#captureBattleLiveBody button[onclick="captureBattleFinishAndClose()"]');
    },null,{timeout:10000});

    await page.locator('#captureBattleLiveBody button[onclick="captureBattleFinishAndClose()"]').click();
    await page.waitForFunction(()=>
      !window.gensCurrentCaptureBattle &&
      getComputedStyle(document.getElementById('captureGameHub')).display!=='none'
    ,null,{timeout:10000});

    const afterVictory=await page.evaluate(()=>({
      active:activeGameProfileId(),
      mode:gensMode151(),
      session:localStorage.getItem('z40k_session_active_v1'),
      hub:getComputedStyle(document.getElementById('captureGameHub')).display,
      dungeon:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      root:getComputedStyle(document.getElementById('gensRootHome')).display,
      menu:getComputedStyle(document.getElementById('menu')).display
    }));
    assert.equal(afterVictory.active,CAPTURE_ID,'Capture victory must keep Capture as active profile');
    assert.equal(afterVictory.mode,'capture','Capture victory must keep Capture mode authority');
    assert.equal(afterVictory.session,'1','Capture victory must keep the session active');
    assert.notEqual(afterVictory.hub,'none','TERMINER after Capture victory must return to Capture hub');
    assert.equal(afterVictory.dungeon,'none','Capture victory must not enter Dungeon');
    assert.equal(afterVictory.root,'none','Capture victory must not return to the application root menu');
    assert.notEqual(afterVictory.menu,'none','Capture world menu must remain active after victory');

    // Recreate the page with the stale Dungeon save still present, then use the real Shell Resume.
    await page.close();
    page=await context.newPage();bindPage(page);
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);

    await selectProfile(page,CAPTURE_ID);
    const resume=page.locator('#resumeBtn');
    await resume.waitFor({state:'visible'});
    assert.equal(await resume.isDisabled(),false,'Capture session must expose the real Shell Resume button');
    await resume.click();

    await page.waitForTimeout(1200);
    const resumed=await page.evaluate(()=>({
      active:activeGameProfileId(),
      mode:typeof gensMode151==='function'?gensMode151():'',
      session:localStorage.getItem('z40k_session_active_v1'),
      hub:document.getElementById('captureGameHub')?getComputedStyle(document.getElementById('captureGameHub')).display:'absent',
      dungeon:document.getElementById('gensDungeonCore01')?getComputedStyle(document.getElementById('gensDungeonCore01')).display:'absent',
      dungeonRuntime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));

    assert.equal(resumed.active,CAPTURE_ID,'Resume must keep the active Capture profile even when an old Dungeon save exists');
    assert.equal(resumed.mode,'capture','Resume must restore Capture mode');
    assert.equal(resumed.session,'1');
    assert.notEqual(resumed.hub,'none','Resume must return to Capture hub');
    assert.equal(resumed.dungeon,'none','Resume must not let stale Dungeon runtime steal Capture');
    assert.ok(Array.isArray(resumed.dungeonRuntime?.participants)&&resumed.dungeonRuntime.participants.length>0,
      'sentinel must prove routing is correct without deleting the independent Dungeon save');
    assert.deepEqual(errors,[],'Capture victory/resume boundary must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 5 Capture victory + resume with stale Dungeon save',
      afterVictory,resumed
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
