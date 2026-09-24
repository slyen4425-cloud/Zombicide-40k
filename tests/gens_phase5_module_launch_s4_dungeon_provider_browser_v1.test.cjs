const assert=require('node:assert/strict');\n// S4: same real Dungeon Save & Quit/resume path, launched through the public module-launch provider.
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtimeBootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
const mobilePerformance=fs.readFileSync(path.join(root,'assets','gensrpg','gens-mobile-combat-performance-16781022.js'),'utf8');

assert.match(indexSource,/id="dungeonCore310PersistenceAndTokens"/,'real index.html must contain the final Core 3.10 persistence layer');
assert.match(indexSource,/DungeonCore01\.quit=function\(\)\{[\s\S]*Sauvegarder et quitter le Dungeon/,'Core 3.10 must own Save & Quit');
assert.match(indexSource,/const previousResume310=window\.resumeGame;[\s\S]*window\.resumeGame=function\(\)/,'Core 3.10 must own the final inline Dungeon resume wrapper');
assert.match(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'production RuntimeBootstrap must keep the family/session guard');
assert.match(mobilePerformance,/runtime-bootstrap-v1\.js/,'production mobile bootstrap must still load RuntimeBootstrap');
assert.match(indexSource,/let z40kRoomId = localStorage\.getItem\('z40k_online_room_id'\) \|\| null;/,'production online block must define optional room id from localStorage');
assert.match(indexSource,/let z40kRoomCode = localStorage\.getItem\('z40k_online_room_code'\) \|\| '';/,'production online block must define optional room code from localStorage');
assert.match(indexSource,/let z40kApplyingRemote = false;/,'production online block must default remote-application guard to false');

const core310Pos=indexSource.indexOf('id="dungeonCore310PersistenceAndTokens"');
const core310End=indexSource.indexOf('</script>',core310Pos);
assert.ok(core310Pos>0&&core310End>core310Pos,'Core 3.10 script boundary must exist');
const afterCore310=indexSource.slice(core310End+'</script>'.length);
assert.doesNotMatch(afterCore310,/DungeonCore01\.quit\s*=\s*function/,'no later inline layer may replace the Core 3.10 Save & Quit authority');
assert.doesNotMatch(afterCore310,/window\.resumeGame\s*=\s*function/,'no later inline layer may replace the Core 3.10 resume authority');

const mobileTag='<script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script>';
const mobileTagPos=indexSource.indexOf(mobileTag);
assert.ok(mobileTagPos>core310End,'production mobile bootstrap tag must remain after the final inline Dungeon owner');

const shellOwnerMarker='async function startConfiguredGame(){';
const shellOwner=indexSource.indexOf(shellOwnerMarker);
const shellScriptEnd=indexSource.indexOf('</script>',shellOwner);
assert.ok(shellOwner>0&&shellScriptEnd>shellOwner,'real Shell owning script must have an exact boundary');

const onlineRoomMarker="let z40kRoomId = localStorage.getItem('z40k_online_room_id') || null;";
const onlineRoomOwner=indexSource.indexOf(onlineRoomMarker);
const onlineScriptStart=indexSource.lastIndexOf('<script',onlineRoomOwner);
const onlineScriptEnd=indexSource.indexOf('</script>',onlineRoomOwner);
assert.ok(onlineRoomOwner>shellScriptEnd&&onlineScriptStart>shellScriptEnd&&onlineScriptEnd>onlineRoomOwner,'exact optional online/session support block must exist');

const customHeroesMarker='function loadCustomHeroesMulti(){';
const customHeroesOwner=indexSource.indexOf(customHeroesMarker);
const customHeroesScriptStart=indexSource.lastIndexOf('<script',customHeroesOwner);
const customHeroesScriptEnd=indexSource.indexOf('</script>',customHeroesOwner);
assert.ok(customHeroesOwner>onlineScriptEnd&&customHeroesScriptStart>onlineScriptEnd&&customHeroesScriptEnd>customHeroesOwner,'exact custom-content dependency block must exist');

function exactScript(id){
  const marker='id="'+id+'"';
  const owner=indexSource.indexOf(marker);
  const start=indexSource.lastIndexOf('<script',owner);
  const end=indexSource.indexOf('</script>',owner);
  assert.ok(owner>0&&start>=0&&end>owner,'exact production script '+id+' must have a boundary');
  return indexSource.slice(start,end+'</script>'.length);
}

const dungeonUiStart=indexSource.indexOf('<style id="gensDungeonCore01Css">');
const dungeonLegacyScriptStart=indexSource.indexOf('<script id="gensDungeonCore01Js">',dungeonUiStart);
assert.ok(dungeonUiStart>customHeroesScriptEnd&&dungeonLegacyScriptStart>dungeonUiStart,'exact native Dungeon Core01 markup must exist');

const spatial313Script=exactScript('dungeonCore313SpatialModel');
const core200Script=exactScript('dungeonCore200Rebuild');
const core304Script=exactScript('dungeonCore304DefeatExit');
const core307Script=exactScript('dungeonCore307CriticalResumeFix');
const core308Script=exactScript('dungeonCore308NewRunReset');
const core310Script=exactScript('dungeonCore310PersistenceAndTokens');
assert.match(core200Script,/localStorage\.setItem\(RT_KEY,JSON\.stringify\(x\|\|\{\}\)\)/,'Core 2.00 must remain the creator/persister of the Dungeon runtime');
assert.match(core200Script,/window\.startConfiguredGame=async function\(\)\{if\(isDungeonMode\?\.\(\)&&!\(typeof isCaptureContext138==="function"&&isCaptureContext138\(\)\)\)return start\(\)/,'Core 2.00 must own true Dungeon launches while preserving Capture routing');
assert.doesNotMatch(core200Script,/window\.startConfiguredGame=async function\(\)\{if\(isDungeonMode\?\.\(\)\)return start\(\)/,'Core 2.00 must not steal Capture launches from the dedicated Capture owner');

// Browser harness built only from exact production source blocks:
// Shell + offline session support + custom-content + native Dungeon markup,
// then the current runtime/persistence owner chain needed for this round-trip.
// Historical visual/combat layers are intentionally not reimplemented.
const roundTripHtml=
  indexSource.slice(0,shellScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(onlineScriptStart,onlineScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(customHeroesScriptStart,customHeroesScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(dungeonUiStart,dungeonLegacyScriptStart)+
  '\n'+spatial313Script+
  '\n'+core200Script+
  '\n'+core304Script+
  '\n'+core307Script+
  '\n'+core308Script+
  '\n'+core310Script+
  '\n<script src="/assets/gensrpg/gens-survival-mode-isolation-1678104.js"></script>\n</body></html>';

const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json',
  '.webmanifest':'application/manifest+json',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.mp3':'audio/mpeg'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/__gens_savequit_resume_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(roundTripHtml);
    return;
  }
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

(async()=>{
  let stage='boot';
  const mark=name=>{stage=name;console.log('[dungeon-provider-s4]',name)};
  const watchdog=setTimeout(()=>{console.error('[dungeon-provider-s4] WATCHDOG stage='+stage);process.exit(1)},150000);

  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const url=`http://127.0.0.1:${port}/__gens_savequit_resume_real.html`;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR',
    serviceWorkers:'block'
  });
  // The production online-support block is loaded exactly, but this sentinel is
  // intentionally offline. Stub only its external Supabase transport factory.
  await context.addInitScript(()=>{
    window.supabase={createClient:()=>({})};
  });

  const browserErrors=[];
  const dialogs=[];
  const preparePage=async page=>{
    page.setDefaultTimeout(20000);
    page.on('pageerror',error=>browserErrors.push(String(error)));
    page.on('console',message=>{
      if(message.type()!=='error')return;
      const value=message.text();
      if(/Failed to load resource|ERR_FAILED/.test(value))return;
      browserErrors.push(value);
    });
    page.on('dialog',async dialog=>{
      dialogs.push({type:dialog.type(),message:dialog.message()});
      await dialog.accept();
    });
    await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  };

  let page=await context.newPage();
  await preparePage(page);

  try{
    mark('navigate-fresh');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});

    mark('wait-real-owners');
    await page.waitForFunction(()=>
      typeof window.openGensFamily==='function' &&
      typeof window.openGensBuiltInGame==='function' &&
      typeof window.startConfiguredGame==='function' &&
      typeof window.resumeGame==='function' &&
      typeof window.DungeonCore01?.quit==='function' &&
      window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0'
    );

    mark('open-adventure-family');
    await page.locator('button.gensRootModeCard.adventure').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

    const dungeonCard=page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseMainBtn');
    await dungeonCard.waitFor({state:'visible'});
    mark('select-dungeon-profile');
    await dungeonCard.click();

    await page.waitForFunction(()=>
      localStorage.getItem('gensrpg_game_profile_active_v1')==='game_profile_dungeon_demo' &&
      getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
    );
    let shell=await page.evaluate(()=>({
      activeId:window.activeGameProfileId?.()||'',
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      dungeonMode:!!window.isDungeonMode?.(),
      session:localStorage.getItem('z40k_session_active_v1')
    }));
    assert.equal(shell.activeId,'game_profile_dungeon_demo');
    assert.equal(shell.family,'adventure');
    assert.equal(shell.dungeonMode,true);
    assert.notEqual(shell.session,'1','fresh browser must not begin with an active game session');

    mark('open-real-pregame');
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

    mark('open-real-hero-selection');
    await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

    const firstParticipant=page.locator('#participantList input[type="checkbox"]').first();
    await firstParticipant.waitFor({state:'visible'});
    if(!(await firstParticipant.isChecked()))await firstParticipant.check();

    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

    mark('start-public-dungeon-provider');
    const publicLaunch=await page.evaluate(async()=>{
      const active=window.GensShellModuleLaunchV1?.activeModule?.()||'';
      const handled=await window.GensShellModuleLaunchV1?.startModuleSession?.('dungeon');
      return {active,handled};
    });
    assert.equal(publicLaunch.active,'dungeon','S4 public registry must resolve the active module as Dungeon');
    assert.equal(publicLaunch.handled,true,'S4 Dungeon provider must report handled=true');
    try{
      await page.waitForFunction(()=>{
        let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
        const core=document.getElementById('gensDungeonCore01');
        return localStorage.getItem('z40k_session_active_v1')==='1' &&
          Array.isArray(rt?.participants) && rt.participants.length>0 &&
          core && getComputedStyle(core).display!=='none';
      },{timeout:5000});
    }catch(error){
      const startDiag=await page.evaluate(()=>({
        activeProfile:typeof activeGameProfileId==='function'?activeGameProfileId():'',
        family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
        dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
        contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'missing',
        eligible:typeof window.DungeonCore01?.eligible==='function'?window.DungeonCore01.eligible():null,
        participants:typeof loadGameParticipants==='function'?loadGameParticipants():[],
        session:localStorage.getItem('z40k_session_active_v1'),
        runtime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
        coreDisplay:document.getElementById('gensDungeonCore01')?getComputedStyle(document.getElementById('gensDungeonCore01')).display:'absent',
        pregameDisplay:document.getElementById('pregameSetup')?getComputedStyle(document.getElementById('pregameSetup')).display:'absent',
        startWrapped:!!window.startConfiguredGame,
        coreActive:window.DungeonCore01?.active??null
      })).catch(e=>({diagnosticError:String(e)}));
      console.error('[dungeon-provider-s4] start-diagnostic',JSON.stringify({startDiag,browserErrors}));
      throw error;
    }

    const savedBeforeQuit=await page.evaluate(()=>{
      const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return {
        room:Number(rt?.room)||0,
        participants:(rt?.participants||[]).map(String),
        index:Number(rt?.index)||0,
        round:Number(rt?.round)||0,
        positions:{...(rt?.positions||{})},
        remaining:{...(rt?.remaining||{})},
        heroRooms:{...(rt?.heroRooms||{})},
        lastKind:rt?.last?.kind||'',
        lastRoom:Number(rt?.last?.room)||0,
        session:localStorage.getItem('z40k_session_active_v1'),
        profile:localStorage.getItem('gensrpg_game_profile_active_v1'),
        family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||''
      };
    });
    assert.equal(savedBeforeQuit.room,0,'fresh real Dungeon runtime must remain at the entrance before Save & Quit');
    assert.ok(savedBeforeQuit.participants.length>=1);
    assert.equal(savedBeforeQuit.session,'1');
    assert.equal(savedBeforeQuit.profile,'game_profile_dungeon_demo');
    assert.equal(savedBeforeQuit.family,'adventure');

    mark('save-and-quit-real-control');
    await page.locator('#gensDungeonCore01 .dc01Top button[onclick="DungeonCore01.quit()"]').click();
    await page.waitForFunction(()=>{
      const root=document.getElementById('gensRootHome');
      const core=document.getElementById('gensDungeonCore01');
      return root && getComputedStyle(root).display!=='none' &&
        core && getComputedStyle(core).display==='none';
    });

    const afterQuit=await page.evaluate(()=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),
      root:getComputedStyle(document.getElementById('gensRootHome')).display,
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display
    }));
    assert.equal(afterQuit.session,'1','Save & Quit must keep the session resumable');
    assert.equal(Number(afterQuit.runtime?.room),savedBeforeQuit.room,'Save & Quit must retain the current Dungeon room');
    assert.notEqual(afterQuit.root,'none');
    assert.equal(afterQuit.core,'none');
    assert.ok(dialogs.some(d=>/Sauvegarder et quitter le Dungeon/.test(d.message)),'the true Core 3.10 Save & Quit confirmation must be traversed');

    mark('recreate-page-with-real-browser-storage');
    await page.close();
    page=await context.newPage();
    await preparePage(page);
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});

    await page.waitForFunction(()=>
      typeof window.openGensFamily==='function' &&
      typeof window.resumeGame==='function' &&
      typeof window.DungeonCore01?.show==='function' &&
      window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0'
    );

    const persistedAfterRecreation=await page.evaluate(()=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(persistedAfterRecreation.session,'1','active-session marker must survive page recreation');
    assert.equal(Number(persistedAfterRecreation.runtime?.room),savedBeforeQuit.room,'Dungeon runtime must survive page recreation');

    mark('return-to-dungeon-home');
    await page.locator('button.gensRootModeCard.adventure').click();
    await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseMainBtn').waitFor({state:'visible'});
    await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseMainBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');

    const resumeBtn=page.locator('#resumeBtn');
    assert.equal(await resumeBtn.isDisabled(),false,'Shell Resume button must be enabled for the persisted session');

    mark('click-real-resume');
    await resumeBtn.click();
    await page.waitForFunction(()=>{
      const core=document.getElementById('gensDungeonCore01');
      let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
      return core && getComputedStyle(core).display!=='none' && Number(rt?.room)===0;
    });

    const resumed=await page.evaluate(()=>({
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),
      session:localStorage.getItem('z40k_session_active_v1'),
      profile:localStorage.getItem('gensrpg_game_profile_active_v1'),
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      dungeonMode:!!window.isDungeonMode?.(),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      menu:getComputedStyle(document.getElementById('menu')).display,
      root:getComputedStyle(document.getElementById('gensRootHome')).display
    }));

    assert.equal(resumed.session,'1');
    assert.equal(resumed.profile,'game_profile_dungeon_demo');
    assert.equal(resumed.family,'adventure');
    assert.equal(resumed.dungeonMode,true);
    assert.equal(resumed.dungeonTheme,true);
    assert.notEqual(resumed.core,'none','Resume must return authority to the Dungeon runtime');
    assert.equal(Number(resumed.runtime?.room),savedBeforeQuit.room);
    assert.deepEqual((resumed.runtime?.participants||[]).map(String),savedBeforeQuit.participants);
    assert.equal(Number(resumed.runtime?.index)||0,savedBeforeQuit.index);
    assert.equal(Number(resumed.runtime?.round)||0,savedBeforeQuit.round);
    assert.deepEqual(resumed.runtime?.positions||{},savedBeforeQuit.positions);
    assert.deepEqual(resumed.runtime?.remaining||{},savedBeforeQuit.remaining);
    assert.deepEqual(resumed.runtime?.heroRooms||{},savedBeforeQuit.heroRooms);
    assert.equal(resumed.runtime?.last?.kind||'',savedBeforeQuit.lastKind);
    assert.equal(Number(resumed.runtime?.last?.room)||0,savedBeforeQuit.lastRoom);
    assert.deepEqual(browserErrors,[],'browser page/runtime errors during Save & Quit round-trip');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 1 real Shell Save & Quit + Dungeon resume round-trip',
      viewport:'412x915 @2.625 touch',
      room:savedBeforeQuit.room,
      participants:savedBeforeQuit.participants,
      family:resumed.family,
      profile:resumed.profile,
      resumed:true
    }));
  }finally{
    clearTimeout(watchdog);
    mark('cleanup');
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    server.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
