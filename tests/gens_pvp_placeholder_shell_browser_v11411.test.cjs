const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtimeBootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');

assert.match(indexSource,/class="gensRootModeCard pvp" onclick="openGensFamily\('pvp'\)"/,'real Shell must expose the PvP root card');
assert.match(indexSource,/if\(family==="survival"\)[\s\S]*else if\(family==="adventure"\)[\s\S]*PVP — À VENIR/,'real Shell must keep PvP as the current placeholder branch');
assert.match(indexSource,/Le moteur PvP n’est pas encore construit\./,'real Shell must keep the current PvP not-built message');
assert.doesNotMatch(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'Phase 6 production composition must not load the retired Survival/Dungeon guard');

const shellOwnerMarker='async function startConfiguredGame(){';
const shellOwner=indexSource.indexOf(shellOwnerMarker);
const shellScriptEnd=indexSource.indexOf('</script>',shellOwner);
assert.ok(shellOwner>0&&shellScriptEnd>shellOwner,'real Shell owner block must have an exact boundary');

const customHeroesMarker='function loadCustomHeroesMulti(){';
const customHeroesOwner=indexSource.indexOf(customHeroesMarker);
const customHeroesScriptStart=indexSource.lastIndexOf('<script',customHeroesOwner);
const customHeroesScriptEnd=indexSource.indexOf('</script>',customHeroesOwner);
assert.ok(customHeroesOwner>shellScriptEnd&&customHeroesScriptStart>shellScriptEnd&&customHeroesScriptEnd>customHeroesOwner,'exact custom-content dependency block must exist');

const realPvpShellHtml=
  indexSource.slice(0,shellScriptEnd+'</script>'.length)+
  '\n'+indexSource.slice(customHeroesScriptStart,customHeroesScriptEnd+'</script>'.length)+
  '\n</body></html>';

const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/__gens_pvp_placeholder_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(realPvpShellHtml);
    return;
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
  const mark=name=>{stage=name;console.log('[pvp-placeholder]',name)};
  const watchdog=setTimeout(()=>{console.error('[pvp-placeholder] WATCHDOG stage='+stage);process.exit(1)},60000);

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
  await context.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear()}catch(e){}});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push(String(error)));
  page.on('console',message=>{
    if(message.type()!=='error')return;
    const value=message.text();
    if(/Failed to load resource|ERR_FAILED/.test(value))return;
    browserErrors.push(value);
  });
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    mark('navigate-real-shell');
    await page.goto(`http://127.0.0.1:${port}/__gens_pvp_placeholder_real.html`,{waitUntil:'domcontentloaded',timeout:45000});

    mark('wait-shell-owner');
    await page.waitForFunction(()=>typeof window.openGensFamily==='function');

    const before=await page.evaluate(()=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      profile:localStorage.getItem('gensrpg_game_profile_active_v1'),
      familyGuard:localStorage.getItem('gensrpg_session_family_guard_v1'),
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      dungeonState:localStorage.getItem('gensrpg_dungeon_state_v1')
    }));

    mark('click-real-pvp-card');
    const pvp=page.locator('button.gensRootModeCard.pvp');
    assert.equal(await pvp.count(),1,'real root Shell must expose exactly one PvP card');
    await pvp.click();

    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

    const state=await page.evaluate(()=>({
      title:document.getElementById('gensFamilyTitle')?.textContent||'',
      heading:document.getElementById('gensFamilyHeading')?.textContent||'',
      hint:document.getElementById('gensFamilyHint')?.textContent||'',
      gameHostText:document.getElementById('gensFamilyGames')?.textContent||'',
      disabledCards:document.querySelectorAll('#gensFamilyGames .gensFamilyGameCard.disabled').length,
      familyHome:getComputedStyle(document.getElementById('gensFamilyHome')).display,
      gameHome:getComputedStyle(document.getElementById('gensGameHome')).display,
      pregame:getComputedStyle(document.getElementById('pregameSetup')).display,
      menu:getComputedStyle(document.getElementById('menu')).display,
      session:localStorage.getItem('z40k_session_active_v1'),
      profile:localStorage.getItem('gensrpg_game_profile_active_v1'),
      familyGuard:localStorage.getItem('gensrpg_session_family_guard_v1'),
      shellFamily:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
      dungeonMode:!!window.isDungeonMode?.(),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      dungeonState:localStorage.getItem('gensrpg_dungeon_state_v1')
    }));

    assert.match(state.title,/Mode Duel \/ PvP/);
    assert.equal(state.heading,'Duel / affrontement');
    assert.equal(state.hint,'Le moteur PvP n’est pas encore construit.');
    assert.match(state.gameHostText,/PVP — À VENIR/);
    assert.match(state.gameHostText,/Cette section est réservée au futur mode d’affrontement entre joueurs\./);
    assert.equal(state.disabledCards,1,'PvP placeholder must remain a single disabled card');
    assert.notEqual(state.familyHome,'none');
    assert.equal(state.gameHome,'none','PvP placeholder must not open a game home');
    assert.equal(state.pregame,'none','PvP placeholder must not open pre-game');
    assert.equal(state.menu,'none','PvP placeholder must not open a game runtime');
    assert.equal(state.session,before.session,'PvP placeholder must not create an active session');
    assert.equal(state.profile,before.profile,'PvP placeholder must not activate a game profile');
    assert.equal(state.familyGuard,before.familyGuard,'PvP placeholder must not overwrite the Survival/Adventure family guard');
    assert.equal(state.shellFamily,'pvp','Shell family authority must identify the not-built PvP module without creating a gameplay session');
    assert.equal(state.dungeonTheme,false,'PvP placeholder must not activate Dungeon theme');
    assert.equal(state.dungeonRuntime,before.dungeonRuntime,'PvP placeholder must not create Dungeon runtime');
    assert.equal(state.dungeonState,before.dungeonState,'PvP placeholder must not create Dungeon exploration state');
    assert.deepEqual(browserErrors,[],'PvP placeholder scenario must not raise browser/runtime errors');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 1 real Shell PvP placeholder',
      viewport:'412x915 @2.625 touch',
      title:state.title,
      placeholder:'PVP — À VENIR',
      sessionActive:state.session,
      profile:state.profile
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
