const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
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
  let stage='boot'; const mark=n=>{stage=n;console.log('[phase9-capture-axis-c] '+n)};
  const watchdog=setTimeout(()=>{console.error('[phase9-capture-axis-c] WATCHDOG stage='+stage);process.exit(1)},210000);
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
    mark('open-real-browser-preview');
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);

    // Unlike the existing cross-module parity test, no Dungeon game or save
    // is ever built here. The real Capture UI must work in a clean browser.
    const observations=[];
    const snapshot=async label=>{
      const s=await page.evaluate(({stage,captureId})=>{
        const profile=typeof getActiveGameProfile==='function'?getActiveGameProfile():null;
        const display=id=>{
          const el=document.getElementById(id);
          return el?getComputedStyle(el).display:'absent';
        };
        return {
          stage,
          active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
          family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
          contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'missing',
          mode:typeof gensMode151==='function'?gensMode151():'missing',
          dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
          gameStyle:profile?.gameStyle||'',
          session:localStorage.getItem('z40k_session_active_v1'),
          dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
          dungeonState:localStorage.getItem('gensrpg_dungeon_state_v1'),
          dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
          captureHub:display('captureGameHub'),
          dungeonPanel:display('gensDungeonCore01'),
          dungeonMenu:display('dungeonMenuPanel'),
          captureWorldState:localStorage.getItem('gensrpg_capture_world_v1_'+captureId),
          battle:window.gensCurrentCaptureBattle?.phase||null
        };
      },{stage:label,captureId:CAPTURE_ID});
      observations.push(s);
      console.log('[phase9-capture-axis-c] snapshot '+JSON.stringify(s));
      assert.equal(s.dungeonRuntime,null,label+': private Dungeon runtime unexpectedly created');
      assert.equal(s.dungeonState,null,label+': private Dungeon state unexpectedly created');
      if(label!=='virgin-browser'){
        assert.equal(s.active,CAPTURE_ID,label+': active profile was stolen');
        assert.equal(s.mode,'capture',label+': Capture authority was lost');
        assert.equal(s.dungeonMode,false,label+': Capture borrowed Dungeon identity');
        assert.equal(s.dungeonTheme,false,label+': Capture borrowed Dungeon theme');
        assert.equal(s.gameStyle,'',label+': Capture profile must not borrow gameStyle dungeon');
        assert.equal(s.family,'adventure');
        assert.equal(s.contentFamily,'creature');
        assert.ok(s.dungeonPanel==='none'||s.dungeonPanel==='absent',label+': Dungeon gameplay UI is active');
        assert.ok(s.dungeonMenu==='none'||s.dungeonMenu==='absent',label+': Dungeon menu is active');
      }
      return s;
    };
    mark('virgin-browser-no-dungeon-fixture');
    await snapshot('virgin-browser');

    mark('real-capture-pregame-and-launch');
    await startCapture(page);
    const captureStarted=await snapshot('capture-start');
    assert.equal(captureStarted.session,'1');
    assert.notEqual(captureStarted.captureHub,'none');
    assert.notEqual(captureStarted.captureWorldState,null,'Capture must persist its own world state');

    mark('real-world-turn-without-dungeon-runtime');
    await page.locator('#captureNextTurnBtn').click();
    await page.waitForFunction(()=>/Jour 2/.test(document.getElementById('captureDayLabel')?.textContent||''));
    const day2=await snapshot('capture-day-2');
    assert.notEqual(day2.captureWorldState,null,'Capture world must persist after day 2');
    assert.equal(JSON.parse(day2.captureWorldState).day,2);

    // Combat uses the real historical Capture owner, not a mock engine.
    mark('capture-real-battle-from-virgin-browser');
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
    assert.equal(battleSetup.ok,true,'real Capture battle must be creatable without any Dungeon fixture');
    await snapshot('capture-battle-start');

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

    mark('capture-victory-no-dungeon-runtime');
    const final=await snapshot('capture-victory-return');
    assert.notEqual(final.captureHub,'none','victory must return to Capture hub');
    assert.equal(final.session,'1','the Capture session must stay active');

    // Axe B: no Dungeon save or runtime constructed; resume real Capture
    // after page recreation and keep playing using the same world state.
    mark('capture-persisted-world-before-reload');
    assert.equal(JSON.parse(final.captureWorldState||'null')?.day,2,'world day 2 must be persisted before reload');
    await page.close();
    page=await context.newPage();
    bindPage(page);
    mark('capture-fresh-page-recreation');
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);
    const afterReloadBeforeResume=await page.evaluate((captureId)=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      dungeonState:localStorage.getItem('gensrpg_dungeon_state_v1'),
      world:localStorage.getItem('gensrpg_capture_world_v1_'+captureId),
      profile:loadGameProfiles().find(p=>String(p?.id||'')===captureId)||null
    }),CAPTURE_ID);
    assert.equal(afterReloadBeforeResume.session,'1','Capture session must remain resumable after reload');
    assert.equal(afterReloadBeforeResume.dungeonRuntime,null,'reload must not create Dungeon runtime');
    assert.equal(afterReloadBeforeResume.dungeonState,null,'reload must not create Dungeon state');
    assert.ok(afterReloadBeforeResume.profile,'Capture saved profile must survive page recreation');
    assert.equal(JSON.parse(afterReloadBeforeResume.world||'null')?.day,2,'Capture world day 2 must survive reload');

    mark('capture-select-profile-for-shell-resume');
    await selectProfile(page,CAPTURE_ID);
    const resume=page.locator('#resumeBtn');
    await resume.waitFor({state:'visible'});
    assert.equal(await resume.isDisabled(),false,'Capture must be resumable without any prior Dungeon session');
    mark('capture-real-shell-resume-without-dungeon-runtime');
    await resume.click();
    await page.waitForFunction(()=>
      typeof gensMode151==='function'&&gensMode151()==='capture' &&
      localStorage.getItem('z40k_session_active_v1')==='1' &&
      getComputedStyle(document.getElementById('captureGameHub')).display!=='none'
    ,null,{timeout:15000});
    const resumed=await snapshot('capture-resume-after-reload');
    assert.equal(resumed.session,'1');
    assert.notEqual(resumed.captureHub,'none');
    assert.equal(JSON.parse(resumed.captureWorldState||'null')?.day,2,'Capture world progression must survive real Shell resume');

    mark('capture-play-after-resume');
    await page.locator('#captureNextTurnBtn').click();
    await page.waitForFunction(()=>/Jour 3/.test(document.getElementById('captureDayLabel')?.textContent||''));
    const afterResumeProgress=await snapshot('capture-day-3-after-resume');
    assert.equal(JSON.parse(afterResumeProgress.captureWorldState||'null')?.day,3,'Capture must progress after resume, not just show stale UI');
    assert.equal(afterResumeProgress.session,'1');
    assert.notEqual(afterResumeProgress.captureHub,'none');

    mark('diagnose-real-capture-visible-exit-controls');
    const actions=await page.evaluate(()=>{
      const visible=e=>{
        const s=getComputedStyle(e),r=e.getBoundingClientRect();
        return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
      };
      return Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"]'))
        .filter(visible)
        .map(e=>({
          tag:e.tagName,id:e.id||'',text:(e.innerText||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,90),
          aria:e.getAttribute('aria-label')||'',title:e.getAttribute('title')||'',
          onclick:(e.getAttribute('onclick')||'').slice(0,180),
          className:typeof e.className==='string'?e.className.slice(0,110):''
        }))
        .filter(x=>/quitter|sauvegarder|sauver|enregistrer|retour|accueil|\bmenu\b|fermer|\bclose\b|\bhome\b|\bexit\b|logout/i.test([x.text,x.aria,x.title,x.onclick,x.id].join(" ")))
        .slice(0,90);
    });
    console.log('[phase9-capture-axis-c] real-visible-exit-candidates '+JSON.stringify(actions,null,2));
    const beforeNavigation=await page.evaluate(()=>({
      active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      session:localStorage.getItem('z40k_session_active_v1'),
      mode:typeof gensMode151==='function'?gensMode151():'missing',
      hub:document.getElementById('captureGameHub')?getComputedStyle(document.getElementById('captureGameHub')).display:'absent',
      hasCaptureEntryDispose:typeof window.GensCaptureV1?.dispose==='function',
      hasCaptureSessionDispose:typeof window.GensCaptureSessionStartV1?.dispose==='function',
      hasHubDispose:typeof window.GensCaptureHubEntryV1?.dispose==='function',
      hasScreenReturnDispose:typeof window.GensCaptureScreenReturnV1?.dispose==='function',
      hasShellRootNavigation:typeof window.showGensRootHome==='function',
      hasDungeonQuit:typeof window.DungeonCore01?.quit==='function',
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2')
    }));
    console.log('[phase9-capture-axis-c] real-pre-shutdown-state '+JSON.stringify(beforeNavigation,null,2));
    assert.equal(beforeNavigation.mode,'capture');
    assert.equal(beforeNavigation.dungeonRuntime,null);
    assert.ok(beforeNavigation.session==='1');
    assert.equal(beforeNavigation.hasCaptureEntryDispose,true,'Capture now exposes dispose; Shell navigation alone remains an independent diagnostic');
    // No DOM control for Save & Quit has yet been proven. Navigation to
    // the root and terminating Capture are distinct contracts.
    const directStop=actions.filter(x=>/quitter|sauvegarder|sauver|enregistrer|logout|exit/i.test([x.text,x.aria,x.title,x.onclick].join(' ')));
    console.log('[phase9-capture-axis-c] visible-direct-stop '+JSON.stringify(directStop));
    mark('characterize-shell-root-navigation-not-shutdown');
    await page.evaluate(()=>{if(typeof showGensRootHome!=='function')throw new Error('Shell root owner missing');showGensRootHome()});
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none',null,{timeout:10000});
    const rootState=await page.evaluate(()=>({
      root:getComputedStyle(document.getElementById('gensRootHome')).display,
      session:localStorage.getItem('z40k_session_active_v1'),
      captureEntryStatus:window.GensCaptureV1?.status?.()||null,
      sessionOwnerStatus:window.GensCaptureSessionStartV1?.status?.()||null,
      hubStatus:window.GensCaptureHubEntryV1?.status?.()||null,
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      world:localStorage.getItem('gensrpg_capture_world_v1_gp_mt7ker7t_m2iw9')
    }));
    console.log('[phase9-capture-axis-c] shell-root-navigation-state '+JSON.stringify(rootState));
    assert.equal(rootState.dungeonRuntime,null,'Shell navigation must not create Dungeon runtime');
    assert.equal(JSON.parse(rootState.world||'null')?.day,3,'Shell navigation must preserve Capture world');


    assert.deepEqual(errors,[],'Capture-only browser scenario must not raise runtime errors');
    console.log(JSON.stringify({
      scenario:'Phase 9 axis C — Capture real exit UI and owner characterization after full no-Dungeon game',
      observedStages:observations.map(s=>s.stage),
      noDungeonRuntimeCreated:observations.every(s=>s.dungeonRuntime===null&&s.dungeonState===null),
      captureBattleVictory:true,
      savedAndResumed:true,
      resumedWorldDay:3,
      note:'Survival runtime internals and Capture teardown still require separate owner-level proof'
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
