const assert=require('node:assert/strict');
// Same real-Shell Survival setup as the legacy launch sentinel, but the
// launch action goes through the new public module-launch provider.
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const shellOwnerMarker='async function startConfiguredGame(){';
const shellOwner=indexSource.indexOf(shellOwnerMarker);
assert.ok(shellOwner>0,'real index.html must expose startConfiguredGame()');
const shellScriptEnd=indexSource.indexOf('</script>',shellOwner);
assert.ok(shellScriptEnd>shellOwner,'real index.html must close the script block that owns startConfiguredGame()');
const onlineMarker="let z40kRoomId = localStorage.getItem('z40k_online_room_id') || null;";
const onlineOwner=indexSource.indexOf(onlineMarker,shellScriptEnd);
assert.ok(onlineOwner>shellScriptEnd,'real index.html must expose the online Shell support block');
const onlineScriptStart=indexSource.lastIndexOf('<script',onlineOwner);
const onlineScriptEnd=indexSource.indexOf('</script>',onlineOwner);
assert.ok(onlineScriptStart>shellScriptEnd && onlineScriptEnd>onlineOwner,'real index.html must close the online Shell support block');
const realOnlineShellSupport=indexSource.slice(onlineScriptStart,onlineScriptEnd+'</script>'.length);

const customHeroMarker='function loadCustomHeroesMulti(){';
const customHeroOwner=indexSource.indexOf(customHeroMarker,onlineScriptEnd);
assert.ok(customHeroOwner>onlineScriptEnd,'real index.html must expose the custom-content Shell support block');
const customHeroScriptStart=indexSource.lastIndexOf('<script',customHeroOwner);
const customHeroScriptEnd=indexSource.indexOf('</script>',customHeroOwner);
assert.ok(customHeroScriptStart>onlineScriptEnd && customHeroScriptEnd>customHeroOwner,'real index.html must close the custom-content Shell support block');
const realCustomHeroShellSupport=indexSource.slice(customHeroScriptStart,customHeroScriptEnd+'</script>'.length);

const realSurvivalShellHtml=
  indexSource.slice(0,shellScriptEnd+'</script>'.length)+
  '\n'+realOnlineShellSupport+
  '\n'+realCustomHeroShellSupport+
  '\n</body></html>';
const runtimeBootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
assert.match(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'runtime bootstrap must keep the real Survival isolation guard in production composition');
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
  if(pathname==='/__gens_survival_shell_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(realSurvivalShellHtml);
    return;
  }
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){
    res.writeHead(403);res.end('forbidden');return;
  }
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return;}
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

(async()=>{
  let stage='boot';
  const mark=name=>{stage=name;console.log('[survival-provider]',name)};
  const watchdog=setTimeout(()=>{console.error('[survival-provider] WATCHDOG stage='+stage);process.exit(1)},120000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR',
    serviceWorkers:'block'
  });
  await context.addInitScript(()=>{
    try{localStorage.clear();sessionStorage.clear();}catch(e){}
    // External online client is outside this sentinel's scope. Keep the real online
    // Shell block executable without making Phase 1 depend on CDN/network availability.
    window.supabase={createClient:()=>({})};
  });
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const browserErrors=[];
  const dialogs=[];
  page.on('pageerror',error=>browserErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')browserErrors.push(message.text())});
  page.on('dialog',async dialog=>{dialogs.push({type:dialog.type(),message:dialog.message()});await dialog.dismiss()});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    mark('navigate-real-shell-prefix');
    await page.goto(`http://127.0.0.1:${port}/__gens_survival_shell_real.html`,{waitUntil:'domcontentloaded',timeout:45000});

    mark('wait-shell-owners');
    await page.waitForFunction(()=>(
      typeof window.openGensFamily==='function' &&
      typeof window.openGensBuiltInGame==='function' &&
      typeof window.startConfiguredGame==='function' &&
      typeof window.isDungeonMode==='function'
    ));

    mark('ensure-survival-guard');
    const guardReady=await page.evaluate(()=>window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0');
    if(!guardReady){
      await page.addScriptTag({url:`http://127.0.0.1:${port}/assets/gensrpg/gens-survival-mode-isolation-1678104.js`});
    }
    await page.waitForFunction(()=>window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0');

    mark('open-survival-family');
    const rootSurvival=page.locator('button.gensRootModeCard.survival');
    assert.equal(await rootSurvival.count(),1,'the real root shell must expose exactly one Survival card');
    await rootSurvival.click();

    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    let shell=await page.evaluate(()=>({
      title:document.getElementById('gensFamilyTitle')?.textContent||'',
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      dungeonTheme:document.body.classList.contains('gensDungeonTheme')
    }));
    assert.match(shell.title,/Mode Survie/,'root -> family must open the real Survival family');
    assert.equal(shell.family,'survival','Survival isolation guard must record the shell family');
    assert.equal(shell.dungeonTheme,false,'Survival family must not activate Dungeon theme');

    const survivalGames=page.locator('#gensFamilyGames button.gensFamilyGameCard:not(.disabled)');
    try{
      await survivalGames.first().waitFor({state:'visible',timeout:5000});
    }catch(error){
      const familyDiag=await page.evaluate(()=>({
        host:document.getElementById('gensFamilyGames')?.innerHTML||'',
        profiles:typeof survivalProfiles==='function'?survivalProfiles().map(p=>({id:p.id,name:p.name,style:p.gameStyle})):[],
        selected:typeof gensSelectedFamily==='undefined'?'undefined':gensSelectedFamily
      })).catch(e=>({diagnosticError:String(e)}));
      console.error('[survival-provider] family-render-diagnostic',JSON.stringify({familyDiag,browserErrors}));
      throw error;
    }
    assert.ok(await survivalGames.count()>=1,'the real Survival family must expose at least one playable universe');
    mark('select-survival-profile');
    await survivalGames.first().click();

    mark('wait-game-home');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
    shell=await page.evaluate(()=>({
      activeId:window.activeGameProfileId?.()||'',
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      dungeonMode:!!window.isDungeonMode?.(),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      style:window.getActiveGameProfile?.()?.gameStyle||''
    }));
    assert.ok(shell.activeId,'selecting a Survival universe must establish an active profile');
    assert.notEqual(shell.activeId,'game_profile_dungeon_demo','Survival selection must not activate the Dungeon demo profile');
    assert.equal(shell.family,'survival','profile selection must preserve the Survival family guard');
    assert.equal(shell.dungeonMode,false,'the selected Survival profile must not resolve as Dungeon');
    assert.equal(shell.dungeonTheme,false,'game home must remain outside Dungeon theme');
    assert.notEqual(shell.style,'dungeon','active profile style must remain non-Dungeon');

    mark('open-pregame');
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

    mark('wait-pregame-settings');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');

    mark('open-hero-session-setup');
    await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

    const firstParticipant=page.locator('#participantList input[type="checkbox"]').first();
    await firstParticipant.waitFor({state:'visible'});
    if(!(await firstParticipant.isChecked()))await firstParticipant.check();

    mark('validate-hero-session-setup');
    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');

    const dungeonBefore=await page.evaluate(()=>({
      runtime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      state:localStorage.getItem('gensrpg_dungeon_state_v1')
    }));

    mark('start-survival-provider');
    const providerState=await page.evaluate(async()=>({
      exists:!!window.GensShellModuleLaunchV1,
      active:window.GensShellModuleLaunchV1?.activeModule?.()||'',
      handled:await window.GensShellModuleLaunchV1?.startModuleSession?.('survival')
    }));
    assert.equal(providerState.exists,true,'S2 public launch registry must exist');
    assert.equal(providerState.active,'survival','S2 provider must resolve the active module as Survival');
    assert.equal(providerState.handled,true,'S2 Survival provider must report handled=true');

    mark('wait-session-active');
    try{
      await page.waitForFunction(()=>localStorage.getItem('z40k_session_active_v1')==='1',null,{timeout:5000});
    }catch(error){
      const launchDiag=await page.evaluate(()=>({
        session:localStorage.getItem('z40k_session_active_v1'),
        participantsRaw:localStorage.getItem('gensrpg_game_participants_v1'),
        participants:typeof loadGameParticipants==='function'?loadGameParticipants():[],
        normalized:typeof normalizeGameParticipants==='function'?normalizeGameParticipants():[],
        activeProfileId:typeof activeGameProfileId==='function'?activeGameProfileId():'',
        activeProfile:typeof getActiveGameProfile==='function'?(()=>{const p=getActiveGameProfile();return p?{id:p.id,name:p.name,style:p.gameStyle,heroPool:p.heroPool}:null})():null,
        family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
        dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
        pregame:document.getElementById('pregameSetup')?getComputedStyle(document.getElementById('pregameSetup')).display:'absent',
        menu:document.getElementById('menu')?getComputedStyle(document.getElementById('menu')).display:'absent'
      })).catch(e=>({diagnosticError:String(e)}));
      console.error('[survival-provider] launch-diagnostic',JSON.stringify({launchDiag,dialogs,browserErrors}));
      throw error;
    }
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('menu')).display!=='none');

    const launched=await page.evaluate(()=>({
      active:localStorage.getItem('z40k_session_active_v1'),
      activeId:window.activeGameProfileId?.()||'',
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      dungeonMode:!!window.isDungeonMode?.(),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      menu:getComputedStyle(document.getElementById('menu')).display,
      pregame:getComputedStyle(document.getElementById('pregameSetup')).display,
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      dungeonState:localStorage.getItem('gensrpg_dungeon_state_v1'),
      dungeonOverlay:document.getElementById('dc01Overlay')?getComputedStyle(document.getElementById('dc01Overlay')).display:'absent',
      dungeonCombat:document.getElementById('dungeonCombatModal')?getComputedStyle(document.getElementById('dungeonCombatModal')).display:'absent'
    }));

    assert.equal(launched.active,'1','real Survival start must activate the common session');
    assert.equal(launched.family,'survival','real Survival start must keep the Survival family guard');
    assert.equal(launched.dungeonMode,false,'real Survival start must never switch to Dungeon mode');
    assert.equal(launched.dungeonTheme,false,'real Survival start must not leak Dungeon body theme');
    assert.notEqual(launched.menu,'none','real Survival start must open the game menu');
    assert.equal(launched.pregame,'none','real Survival start must close pregame');
    assert.equal(launched.dungeonRuntime,dungeonBefore.runtime,'Survival launch must not create/replace Dungeon runtime state');
    assert.equal(launched.dungeonState,dungeonBefore.state,'Survival launch must not create/replace Dungeon exploration state');
    assert.ok(launched.dungeonOverlay==='none'||launched.dungeonOverlay==='absent','Dungeon overlay must stay inactive in Survival');
    assert.ok(launched.dungeonCombat==='none'||launched.dungeonCombat==='absent','legacy Dungeon combat host must stay inactive in Survival');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 5 S2 Survival public provider launch',
      viewport:'412x915 @2.625 touch',
      family:launched.family,
      activeProfile:launched.activeId,
      dungeonMode:launched.dungeonMode,
      sessionActive:launched.active
    }));
  }finally{
    clearTimeout(watchdog);
    mark('cleanup');
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    server.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
