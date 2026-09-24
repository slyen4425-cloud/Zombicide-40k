const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtimeBootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');

const SURVIVAL_ID='game_profile_zombicide_base';
const DUNGEON_ID='game_profile_dungeon_demo';
const CAPTURE_ID='gp_mt7ker7t_m2iw9';

assert.match(indexSource,/function openGensFamily\(family\)/,'real Shell family owner must exist');
assert.match(indexSource,/function openGensBuiltInGame\(profileId,family\)/,'real Shell profile owner must exist');
assert.match(indexSource,/function showGensRootHome\(\)/,'real Shell root navigation owner must exist');
assert.match(indexSource,/function backToGensFamily\(\)/,'real Shell game-to-family owner must exist');
assert.match(indexSource,/window\.gensSwitchUniverse155=function\(profileId,family\)/,'V16.155 content-family switch owner must exist');
assert.match(indexSource,/window\.gensMode151=function\(\)/,'V16.151 mode authority must exist');
assert.match(indexSource,/id="builtinMonsterCapture162"/,'built-in Capture seed must exist');
assert.doesNotMatch(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'Phase 6 production bootstrap must not load the retired Survival/Dungeon guard');

const shellOwner=indexSource.indexOf('async function startConfiguredGame(){');
const shellScriptEnd=indexSource.indexOf('</script>',shellOwner);
assert.ok(shellOwner>0&&shellScriptEnd>shellOwner,'real Shell owner block must have an exact boundary');

const onlineMarker="let z40kRoomId = localStorage.getItem('z40k_online_room_id') || null;";
const onlineOwner=indexSource.indexOf(onlineMarker,shellScriptEnd);
const onlineScriptStart=indexSource.lastIndexOf('<script',onlineOwner);
const onlineScriptEnd=indexSource.indexOf('</script>',onlineOwner);
assert.ok(onlineOwner>shellScriptEnd&&onlineScriptStart>shellScriptEnd&&onlineScriptEnd>onlineOwner,'real online Shell support block must exist');

const customMarker='function loadCustomHeroesMulti(){';
const customOwner=indexSource.indexOf(customMarker,onlineScriptEnd);
const customScriptStart=indexSource.lastIndexOf('<script',customOwner);
const customScriptEnd=indexSource.indexOf('</script>',customOwner);
assert.ok(customOwner>onlineScriptEnd&&customScriptStart>onlineScriptEnd&&customScriptEnd>customOwner,'real custom-content support block must exist');

function exactScript(id){
  const marker='<script id="'+id+'"';
  const start=indexSource.indexOf(marker);
  assert.ok(start>customScriptEnd,'production script '+id+' must exist after custom-content support');
  const openEnd=indexSource.indexOf('>',start);
  const end=indexSource.indexOf('</script>',openEnd);
  assert.ok(openEnd>start&&end>openEnd,'production script '+id+' must have an exact boundary');
  return {id,start,source:indexSource.slice(openEnd+1,end)};
}

const ownerIds=[
  'captureFix137',
  'captureFix138',
  'captureFix139',
  'gensStability151',
  'forceReload155',
  'builtinMonsterCapture162'
];
const ownerScripts=ownerIds.map(exactScript);
for(let i=1;i<ownerScripts.length;i++)assert.ok(ownerScripts[i].start>ownerScripts[i-1].start,'owner scripts must keep production order');

const realShellHtml=
  indexSource.slice(0,shellScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(onlineScriptStart,onlineScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(customScriptStart,customScriptEnd+'</script>'.length)+
  '\n</body></html>';

const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/__gens_four_module_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(realShellHtml);return;
  }
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

(async()=>{
  let stage='boot';
  const mark=name=>{stage=name;console.log('[four-module]',name)};
  const watchdog=setTimeout(()=>{console.error('[four-module] WATCHDOG stage='+stage);process.exit(1)},150000);

  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const url=`http://127.0.0.1:${port}/__gens_four_module_real.html`;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{
    try{
      if(!sessionStorage.getItem('__fourModuleBooted')){
        localStorage.clear();sessionStorage.clear();sessionStorage.setItem('__fourModuleBooted','1');
      }
    }catch(e){}
    window.supabase={createClient:()=>({})};
  });

  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push(String(error)));
  page.on('console',message=>{
    if(message.type()!=='error')return;
    const value=message.text();
    if(/Failed to load resource|ERR_FAILED/.test(value))return;
    browserErrors.push(value);
  });
  page.on('dialog',async dialog=>{await dialog.accept()});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  const installOwners=async()=>{
    for(const owner of ownerScripts){
      mark('install-'+owner.id);
      await page.addScriptTag({content:owner.source});
    }
    await page.evaluate(()=>{try{window.gensReconcile151?.('four-module-install')}catch(e){}});
  };

  const waitOwners=()=>page.waitForFunction((captureId)=>{
    const profiles=typeof loadGameProfiles==='function'?loadGameProfiles():[];
    return typeof window.openGensFamily==='function' &&
      typeof window.openGensBuiltInGame==='function' &&
      typeof window.showGensRootHome==='function' &&
      typeof window.backToGensFamily==='function' &&
      typeof window.gensMode151==='function' &&
      typeof window.gensProfileContentFamily155==='function' &&
      typeof window.ensureBuiltinMonsterCapture162==='function' &&
      profiles.some(p=>String(p.id)===captureId);
  },CAPTURE_ID);

  const snapshot=()=>page.evaluate(()=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
    contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'missing',
    mode151:typeof gensMode151==='function'?gensMode151():'missing',
    dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
    dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
    capturePregame:document.body.classList.contains('gensCapturePregame'),
    pureCapture:document.body.classList.contains('gens-pure-capture'),
    session:localStorage.getItem('z40k_session_active_v1'),
    dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
    dungeonState:localStorage.getItem('gensrpg_dungeon_state_v1'),
    root:document.getElementById('gensRootHome')?getComputedStyle(document.getElementById('gensRootHome')).display:'absent',
    familyHome:document.getElementById('gensFamilyHome')?getComputedStyle(document.getElementById('gensFamilyHome')).display:'absent',
    gameHome:document.getElementById('gensGameHome')?getComputedStyle(document.getElementById('gensGameHome')).display:'absent',
    pregame:document.getElementById('pregameSetup')?getComputedStyle(document.getElementById('pregameSetup')).display:'absent',
    menu:document.getElementById('menu')?getComputedStyle(document.getElementById('menu')).display:'absent',
    captureHub:document.getElementById('captureGameHub')?getComputedStyle(document.getElementById('captureGameHub')).display:'absent',
    dungeonPanel:document.getElementById('dungeonMenuPanel')?getComputedStyle(document.getElementById('dungeonMenuPanel')).display:'absent'
  }));

  const rootFromGame=async()=>{
    await page.locator('#gensGameHome .homeTop button.back').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    await page.locator('#gensFamilyHome .homeTop button.back').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');
  };

  const openFamily=async family=>{
    await page.locator('button.gensRootModeCard.'+family).click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  };

  const reopenAfterReload=async(family,selector,profileId)=>{
    mark('reinstall-after-v155-reload');
    await installOwners();await waitOwners();
    const post=await page.evaluate(id=>({active:activeGameProfileId(),forced:localStorage.getItem('gensrpg_forced_mode_reload_155')}),profileId);
    assert.equal(post.active,profileId,'V16.155 reload must preserve target profile');
    assert.equal(post.forced,null,'V16.155 handoff must be consumed after reload');
    await openFamily(family);
    const card=page.locator(selector);
    await card.waitFor({state:'visible'});
    await card.click();
    await page.waitForFunction(id=>activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',profileId);
  };

  const selectWithRealReload=async(family,selector,profileId,label)=>{
    await openFamily(family);
    let card=page.locator(selector);
    await card.waitFor({state:'visible'});
    const sw=await page.evaluate(id=>({
      active:activeGameProfileId(),
      from:gensProfileContentFamily155(activeGameProfileId()),
      to:gensProfileContentFamily155(id)
    }),profileId);
    if(sw.active&&sw.active!==profileId&&sw.from!==sw.to){
      mark('switch-'+label+'-through-v155-reload');
      await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}),
        card.click()
      ]);
      await reopenAfterReload(family,selector,profileId);
    }else{
      mark('select-'+label);
      await card.click();
      await page.waitForFunction(id=>activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',profileId);
    }
  };

  try{
    mark('navigate-real-shell');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await installOwners();await waitOwners();

    mark('survival-first');
    await selectWithRealReload(
      'survival',
      `#gensFamilyGames button.gensFamilyGameCard[onclick*="${SURVIVAL_ID}"]`,
      SURVIVAL_ID,
      'survival-first'
    );
    let s=await snapshot();
    assert.equal(s.active,SURVIVAL_ID);
    assert.equal(s.family,'survival');
    assert.equal(s.contentFamily,'survival');
    assert.equal(s.mode151,'other');
    assert.equal(s.dungeonMode,false);
    assert.equal(s.dungeonTheme,false);
    assert.equal(s.capturePregame,false);
    assert.equal(s.pureCapture,false);
    assert.notEqual(s.session,'1');
    assert.equal(s.dungeonRuntime,null);
    assert.equal(s.dungeonState,null);
    await rootFromGame();

    mark('survival-to-dungeon');
    await selectWithRealReload(
      'adventure',
      `#gensFamilyGames [data-rpg-profile="${DUNGEON_ID}"] .gensUniverseMainBtn`,
      DUNGEON_ID,
      'dungeon'
    );
    s=await snapshot();
    assert.equal(s.active,DUNGEON_ID);
    assert.equal(s.family,'adventure');
    assert.equal(s.contentFamily,'rpg');
    assert.equal(s.mode151,'dungeon');
    assert.equal(s.dungeonMode,true);
    assert.equal(s.dungeonTheme,true);
    assert.equal(s.capturePregame,false);
    assert.equal(s.pureCapture,false);
    assert.notEqual(s.session,'1');
    assert.equal(s.dungeonRuntime,null,'selecting Dungeon without launch must not create runtime');
    assert.equal(s.dungeonState,null,'selecting Dungeon without launch must not create exploration state');
    assert.ok(s.captureHub==='none'||s.captureHub==='absent','Capture hub must stay inactive in Dungeon');
    await rootFromGame();

    mark('dungeon-back-to-survival');
    await selectWithRealReload(
      'survival',
      `#gensFamilyGames button.gensFamilyGameCard[onclick*="${SURVIVAL_ID}"]`,
      SURVIVAL_ID,
      'survival-return'
    );
    s=await snapshot();
    assert.equal(s.active,SURVIVAL_ID);
    assert.equal(s.family,'survival');
    assert.equal(s.contentFamily,'survival');
    assert.equal(s.mode151,'other');
    assert.equal(s.dungeonMode,false);
    assert.equal(s.dungeonTheme,false,'Dungeon theme must be removed after returning to Survival');
    assert.equal(s.capturePregame,false);
    assert.equal(s.pureCapture,false);
    assert.equal(s.dungeonRuntime,null);
    assert.equal(s.dungeonState,null);
    await rootFromGame();

    mark('survival-to-capture');
    await selectWithRealReload(
      'adventure',
      `#gensFamilyGames [data-rpg-profile="${CAPTURE_ID}"] .gensUniverseMainBtn`,
      CAPTURE_ID,
      'capture'
    );
    s=await snapshot();
    assert.equal(s.active,CAPTURE_ID);
    assert.equal(s.family,'adventure');
    assert.equal(s.contentFamily,'creature');
    assert.equal(s.mode151,'capture');
    assert.equal(s.dungeonMode,true,'current Capture keeps historical dungeon-style substrate');
    assert.equal(s.dungeonTheme,true,'Capture currently lives under Adventure Shell theme');
    assert.notEqual(s.session,'1');
    assert.equal(s.dungeonRuntime,null);
    assert.equal(s.dungeonState,null);
    assert.ok(s.dungeonPanel==='none'||s.dungeonPanel==='absent','classic Dungeon panel must stay inactive in Capture');

    mark('capture-pregame-isolation');
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
    await page.waitForFunction(()=>document.body.classList.contains('gensCapturePregame'));
    const capPre=await page.evaluate(()=>({
      mode:gensMode151(),
      dungeonBtn:document.getElementById('sessionDungeonSetupBtn')?getComputedStyle(document.getElementById('sessionDungeonSetupBtn')).display:'absent',
      session:localStorage.getItem('z40k_session_active_v1'),
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2')
    }));
    assert.equal(capPre.mode,'capture');
    assert.ok(capPre.dungeonBtn==='none'||capPre.dungeonBtn==='absent','Capture pre-game must not expose active Dungeon setup');
    assert.notEqual(capPre.session,'1');
    assert.equal(capPre.dungeonRuntime,null);
    await page.locator('#pregameHeroStep .pregameBackStep').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
    await rootFromGame();

    const beforePvp=await snapshot();
    mark('capture-to-pvp-placeholder');
    await openFamily('pvp');
    const pvp=await snapshot();
    const pvpText=await page.locator('#gensFamilyGames').textContent();
    console.log('[four-module] pvp-diagnostic',JSON.stringify({beforePvp,pvp,pvpText}));
    assert.match(pvpText,/PVP — À VENIR/);
    assert.equal(pvp.session,beforePvp.session,'PvP placeholder must not create/replace a session');
    assert.equal(pvp.active,beforePvp.active,'PvP placeholder must not activate another game profile');
    assert.equal(pvp.family,'pvp','Shell family authority must identify the PvP placeholder without creating gameplay state');
    assert.equal(pvp.dungeonRuntime,beforePvp.dungeonRuntime,'PvP placeholder must not create/replace Dungeon runtime');
    assert.equal(pvp.dungeonState,beforePvp.dungeonState,'PvP placeholder must not create/replace Dungeon state');
    assert.equal(pvp.dungeonTheme,false,'Adventure/Dungeon theme must not leak into PvP');
    assert.equal(pvp.capturePregame,false,'Capture pre-game class must not leak into PvP');
    assert.equal(pvp.pureCapture,false,'Capture runtime class must not leak into PvP');
    assert.ok(pvp.captureHub==='none'||pvp.captureHub==='absent','Capture hub must stay inactive in PvP');
    assert.ok(pvp.dungeonPanel==='none'||pvp.dungeonPanel==='absent','Dungeon panel must stay inactive in PvP');
    assert.deepEqual(browserErrors,[],'four-module transition scenario must not raise browser/runtime errors');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 1 four-module non-interference',
      viewport:'412x915 @2.625 touch',
      transitions:['survival','dungeon','survival','capture','pvp-placeholder'],
      finalProfile:pvp.active,
      familyGuard:pvp.family,
      session:pvp.session
    }));
  }finally{
    clearTimeout(watchdog);
    mark('cleanup');
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
