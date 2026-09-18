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
const DUNGEON_KEY='gensrpg_dungeon_runtime_v2';
const CAPTURE_KEY='gensrpg_capture_world_v1_'+CAPTURE_ID;
const DUNGEON_MARKER=JSON.stringify({sentinel:'dungeon-inactive',room:77,participants:['sentinel']});
const CAPTURE_MARKER=JSON.stringify({locationId:'sentinel',locationName:'Sentinel Capture',last:null,playMode:'free',day:7,turnIndex:2});

assert.match(indexSource,/class="gensRootModeCard survival" onclick="openGensFamily\('survival'\)"/,'real Shell must expose Survival root');
assert.match(indexSource,/class="gensRootModeCard adventure" onclick="openGensFamily\('adventure'\)"/,'real Shell must expose Adventure root');
assert.match(indexSource,/class="gensRootModeCard pvp" onclick="openGensFamily\('pvp'\)"/,'real Shell must expose PvP root');
assert.match(indexSource,/const GAME_PROFILE_BASE_ID="game_profile_zombicide_base"/,'real Shell must keep Survival base profile');
assert.match(indexSource,/const GAME_PROFILE_DUNGEON_ID="game_profile_dungeon_demo"/,'real Shell must keep Dungeon demo profile');
assert.match(indexSource,/const MC162_ID="gp_mt7ker7t_m2iw9"/,'real Shell must keep Monster Capture profile');
assert.match(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'production composition must keep family isolation guard');

const shellOwner=indexSource.indexOf('async function startConfiguredGame(){');
const shellScriptEnd=indexSource.indexOf('</script>',shellOwner);
assert.ok(shellOwner>0&&shellScriptEnd>shellOwner,'real Shell owner block must have an exact boundary');

const onlineMarker="let z40kRoomId = localStorage.getItem('z40k_online_room_id') || null;";
const onlineOwner=indexSource.indexOf(onlineMarker,shellScriptEnd);
const onlineScriptStart=indexSource.lastIndexOf('<script',onlineOwner);
const onlineScriptEnd=indexSource.indexOf('</script>',onlineOwner);
assert.ok(onlineOwner>shellScriptEnd&&onlineScriptStart>shellScriptEnd&&onlineScriptEnd>onlineOwner,'real online support block must exist');

const customMarker='function loadCustomHeroesMulti(){';
const customOwner=indexSource.indexOf(customMarker,onlineScriptEnd);
const customScriptStart=indexSource.lastIndexOf('<script',customOwner);
const customScriptEnd=indexSource.indexOf('</script>',customOwner);
assert.ok(customOwner>onlineScriptEnd&&customScriptStart>onlineScriptEnd&&customScriptEnd>customOwner,'real custom-content support block must exist');

function exactScript(id){
  const start=indexSource.indexOf('<script id="'+id+'"');
  assert.ok(start>customScriptEnd,'production script '+id+' must exist after Shell support blocks');
  const openEnd=indexSource.indexOf('>',start);
  const end=indexSource.indexOf('</script>',openEnd);
  assert.ok(openEnd>start&&end>openEnd,'production script '+id+' must have an exact boundary');
  return {id,start,source:indexSource.slice(openEnd+1,end)};
}

const captureOwners=[
  'captureFix137',
  'captureFix138',
  'captureFix139',
  'gensStability151',
  'forceReload155',
  'builtinMonsterCapture162'
].map(exactScript);
for(let i=1;i<captureOwners.length;i++)assert.ok(captureOwners[i].start>captureOwners[i-1].start,'owner order must match production');

const realShellHtml=
  indexSource.slice(0,shellScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(onlineScriptStart,onlineScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(customScriptStart,customScriptEnd+'</script>'.length)+
  '\n</body></html>';

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
  if(pathname==='/__gens_four_module_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(realShellHtml);
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
  const mark=name=>{stage=name;console.log('[four-module-boundary]',name)};
  const watchdog=setTimeout(()=>{console.error('[four-module-boundary] WATCHDOG stage='+stage);process.exit(1)},150000);

  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const url=`http://127.0.0.1:${port}/__gens_four_module_real.html`;
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
    try{
      if(!sessionStorage.getItem('__fourModuleBooted')){
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('__fourModuleBooted','1');
      }
    }catch(e){}
    window.supabase={createClient:()=>({})};
  });

  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const browserErrors=[];
  page.on('pageerror',e=>browserErrors.push(String(e)));
  page.on('console',m=>{
    if(m.type()!=='error')return;
    const value=m.text();
    if(/Failed to load resource|ERR_FAILED/.test(value))return;
    browserErrors.push(value);
  });
  page.on('dialog',async dialog=>{await dialog.accept()});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  const installOwners=async()=>{
    for(const owner of captureOwners){
      mark('install-'+owner.id);
      await page.addScriptTag({content:owner.source});
    }
    mark('install-family-guard');
    await page.addScriptTag({url:`http://127.0.0.1:${port}/assets/gensrpg/gens-survival-mode-isolation-1678104.js`});
    await page.evaluate(()=>{try{window.gensReconcile151?.('four-module-install')}catch(e){}});
  };

  const waitOwners=()=>page.waitForFunction((ids)=>{
    const profiles=typeof loadGameProfiles==='function'?loadGameProfiles():[];
    const found=new Set(profiles.map(p=>String(p.id)));
    return typeof window.openGensFamily==='function' &&
      typeof window.openGensBuiltInGame==='function' &&
      typeof window.showGensRootHome==='function' &&
      typeof window.gensMode151==='function' &&
      typeof window.gensProfileContentFamily155==='function' &&
      window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0' &&
      ids.every(id=>found.has(id));
  },[SURVIVAL_ID,DUNGEON_ID,CAPTURE_ID]);

  const visible=id=>page.locator('#'+id).isVisible();

  const goRoot=async()=>{
    if(await visible('gensGameHome')){
      await page.locator('#gensGameHome .back').first().click();
      await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    }
    if(await visible('gensFamilyHome')){
      await page.locator('#gensFamilyHome .back').first().click();
    }
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');
  };

  const familyCard=async(family,profileId)=>{
    await goRoot();
    await page.locator('button.gensRootModeCard.'+family).click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    if(family==='survival'){
      const card=page.locator(`#gensFamilyGames button.gensFamilyGameCard[onclick*="${profileId}"]`);
      await card.waitFor({state:'visible'});
      return card;
    }
    const card=page.locator(`#gensFamilyGames [data-rpg-profile="${profileId}"] .gensUniverseMainBtn`);
    await card.waitFor({state:'visible'});
    return card;
  };

  const openProfile=async(family,profileId)=>{
    let card=await familyCard(family,profileId);
    const sw=await page.evaluate((id)=>({
      active:activeGameProfileId(),
      from:gensProfileContentFamily155(activeGameProfileId()),
      to:gensProfileContentFamily155(id)
    }),profileId);
    if(sw.active && sw.active!==profileId && sw.from!==sw.to){
      mark('reload-'+sw.from+'-to-'+sw.to);
      await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}),
        card.click()
      ]);
      await installOwners();
      await waitOwners();
      const afterReload=await page.evaluate((id)=>({
        active:activeGameProfileId(),
        forced:localStorage.getItem('gensrpg_forced_mode_reload_155')
      }),profileId);
      assert.equal(afterReload.active,profileId,'V16.155 reload must preserve the selected target profile');
      assert.equal(afterReload.forced,null,'V16.155 forced handoff must be consumed after reload');
      card=await familyCard(family,profileId);
    }
    await card.click();
    await page.waitForFunction((id)=>activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',profileId);
    await page.waitForTimeout(40);
  };

  const snapshot=()=>page.evaluate((keys)=>({
    active:activeGameProfileId(),
    familyGuard:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
    contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'',
    mode151:typeof gensMode151==='function'?gensMode151():'',
    session:localStorage.getItem('z40k_session_active_v1'),
    dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
    capturePregame:document.body.classList.contains('gensCapturePregame'),
    pureCapture:document.body.classList.contains('gens-pure-capture'),
    root:getComputedStyle(document.getElementById('gensRootHome')).display,
    familyHome:getComputedStyle(document.getElementById('gensFamilyHome')).display,
    gameHome:getComputedStyle(document.getElementById('gensGameHome')).display,
    menu:getComputedStyle(document.getElementById('menu')).display,
    captureVisible:!!document.getElementById('captureGameHub') && document.getElementById('captureGameHub').offsetParent!==null,
    dungeonPanelVisible:!!document.getElementById('dungeonMenuPanel') && document.getElementById('dungeonMenuPanel').offsetParent!==null,
    pvpText:document.getElementById('gensFamilyGames')?.textContent||'',
    dungeonStored:localStorage.getItem(keys.dungeon),
    captureStored:localStorage.getItem(keys.capture)
  }),{dungeon:DUNGEON_KEY,capture:CAPTURE_KEY});

  try{
    mark('navigate-real-shell');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await installOwners();
    await waitOwners();

    mark('seed-inactive-persistence-markers');
    await page.evaluate(({dKey,cKey,dVal,cVal})=>{
      localStorage.setItem(dKey,dVal);
      localStorage.setItem(cKey,cVal);
      localStorage.removeItem('z40k_session_active_v1');
    },{dKey:DUNGEON_KEY,cKey:CAPTURE_KEY,dVal:DUNGEON_MARKER,cVal:CAPTURE_MARKER});

    mark('boundary-survival');
    await openProfile('survival',SURVIVAL_ID);
    let s=await snapshot();
    assert.equal(s.active,SURVIVAL_ID);
    assert.equal(s.familyGuard,'survival');
    assert.equal(s.contentFamily,'survival');
    assert.equal(s.mode151,'other');
    assert.equal(s.session,null);
    assert.equal(s.dungeonTheme,false);
    assert.equal(s.capturePregame,false);
    assert.equal(s.pureCapture,false);
    assert.equal(s.captureVisible,false);
    assert.equal(s.dungeonPanelVisible,false);
    assert.equal(s.dungeonStored,DUNGEON_MARKER);
    assert.equal(s.captureStored,CAPTURE_MARKER);

    mark('boundary-dungeon');
    await openProfile('adventure',DUNGEON_ID);
    s=await snapshot();
    assert.equal(s.active,DUNGEON_ID);
    assert.equal(s.familyGuard,'adventure');
    assert.equal(s.contentFamily,'rpg');
    assert.equal(s.mode151,'dungeon');
    assert.equal(s.session,null);
    assert.equal(s.dungeonTheme,true);
    assert.equal(s.captureVisible,false,'Capture hub must stay inactive on Dungeon game home');
    assert.equal(s.dungeonStored,DUNGEON_MARKER,'opening Dungeon home must not rewrite inactive Dungeon persistence');
    assert.equal(s.captureStored,CAPTURE_MARKER,'Dungeon selection must not rewrite Capture persistence');

    mark('boundary-capture');
    await openProfile('adventure',CAPTURE_ID);
    s=await snapshot();
    assert.equal(s.active,CAPTURE_ID);
    assert.equal(s.familyGuard,'adventure');
    assert.equal(s.contentFamily,'creature');
    assert.equal(s.mode151,'capture');
    assert.equal(s.session,null);
    assert.equal(s.gameHome==='none',false);
    assert.equal(s.menu,'none','Capture profile home must not launch a session by itself');
    assert.equal(s.dungeonPanelVisible,false,'classic Dungeon panel must not become active on Capture game home');
    assert.equal(s.dungeonStored,DUNGEON_MARKER,'Capture selection must not rewrite Dungeon persistence');
    assert.equal(s.captureStored,CAPTURE_MARKER,'opening Capture home must preserve its existing world state');

    mark('boundary-pvp');
    await goRoot();
    await page.locator('button.gensRootModeCard.pvp').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    s=await snapshot();
    assert.match(s.pvpText,/PVP — À VENIR/);
    assert.equal(s.active,CAPTURE_ID,'PvP placeholder must not replace the previously selected game profile');
    assert.equal(s.familyGuard,'adventure','PvP placeholder must not overwrite the Survival/Adventure family guard');
    assert.equal(s.session,null,'PvP placeholder must not create a session');
    assert.equal(s.gameHome,'none');
    assert.equal(s.menu,'none');
    assert.equal(s.captureVisible,false,'Capture UI must not remain visible over PvP placeholder');
    assert.equal(s.dungeonPanelVisible,false,'Dungeon UI must not remain visible over PvP placeholder');
    assert.equal(s.dungeonStored,DUNGEON_MARKER);
    assert.equal(s.captureStored,CAPTURE_MARKER);

    mark('boundary-return-survival');
    await openProfile('survival',SURVIVAL_ID);
    s=await snapshot();
    assert.equal(s.active,SURVIVAL_ID);
    assert.equal(s.familyGuard,'survival');
    assert.equal(s.contentFamily,'survival');
    assert.equal(s.mode151,'other');
    assert.equal(s.session,null);
    assert.equal(s.dungeonTheme,false,'return to Survival must clear Adventure/Dungeon theme');
    assert.equal(s.capturePregame,false);
    assert.equal(s.pureCapture,false);
    assert.equal(s.captureVisible,false,'Capture hub must remain inactive after return to Survival');
    assert.equal(s.dungeonPanelVisible,false,'Dungeon panel must remain inactive after return to Survival');
    assert.equal(s.dungeonStored,DUNGEON_MARKER,'round trip must preserve inactive Dungeon persistence');
    assert.equal(s.captureStored,CAPTURE_MARKER,'round trip must preserve inactive Capture persistence');
    assert.deepEqual(browserErrors,[],'four-module boundary scenario must not raise browser/runtime errors');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 1 four-module Shell non-interference',
      viewport:'412x915 @2.625 touch',
      route:['survival','dungeon','capture','pvp','survival'],
      finalProfile:s.active,
      finalFamily:s.familyGuard,
      dungeonPersistence:'preserved',
      capturePersistence:'preserved'
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
