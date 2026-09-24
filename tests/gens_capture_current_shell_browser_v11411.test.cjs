const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtimeBootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');

const CAPTURE_ID='gp_mt7ker7t_m2iw9';
const CAPTURE_TRAINER='custom_mt7lk6jv_ioga';

assert.match(indexSource,/id="builtinMonsterCapture162"/,'production HTML must keep the built-in Monster Capture seed');
assert.match(indexSource,/const MC162_ID="gp_mt7ker7t_m2iw9"/,'production seed must keep the current Monster Capture profile id');
assert.match(indexSource,/name":"Monster Capture"/,'production seed must keep the current Monster Capture profile');
assert.match(indexSource,/ensureBuiltinMonsterCapture162\(\);/,'production seed must install Monster Capture at boot');
assert.match(indexSource,/if\(mods\.capture && mods\.controllableCreatures\)return "creature"/,'content-family owner must classify Capture as creature');
assert.match(indexSource,/if\(p\?\.gameStyle==="dungeon" && fam==="creature"\)return "capture"/,'V16.151 must keep Capture distinct from classic Dungeon');
assert.match(indexSource,/if\(gensMode151\(\)!=="capture"\)[\s\S]*captureGameHub/,'V16.151 must guard the Capture hub');
assert.match(indexSource,/window\.openGensBuiltInGame=function\(profileId,family\)[\s\S]*gensSwitchUniverse155/,'V16.155 must remain the real universe-switch owner');
assert.doesNotMatch(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'Phase 6 production composition must not load the retired Survival/Dungeon guard');

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
assert.ok(customOwner>onlineScriptEnd&&customScriptStart>onlineScriptEnd&&customScriptEnd>customOwner,'real custom-content block must exist');

function exactScript(id){
  const marker='<script id="'+id+'"';
  const start=indexSource.indexOf(marker);
  assert.ok(start>customScriptEnd,'production script '+id+' must exist after custom-content support');
  const openEnd=indexSource.indexOf('>',start);
  const end=indexSource.indexOf('</script>',openEnd);
  assert.ok(openEnd>start&&end>openEnd,'production script '+id+' must have an exact boundary');
  return {
    id,
    start,
    source:indexSource.slice(openEnd+1,end)
  };
}

const captureScriptIds=[
  // Current production dependencies for this Phase 1 scenario only:
  // V137/V138 own the Capture pre-game Dungeon cleanup/context,
  // V139 owns Capture launch, V151 owns Capture/Dungeon UI reconciliation,
  // V155 owns universe reload, V162 owns the built-in Monster Capture seed.
  'captureFix137',
  'captureFix138',
  'captureFix139',
  'gensStability151',
  'forceReload155',
  'builtinMonsterCapture162'
];

const captureOwnerScripts=captureScriptIds.map(exactScript);
for(let i=1;i<captureOwnerScripts.length;i++){
  assert.ok(captureOwnerScripts[i].start>captureOwnerScripts[i-1].start,'Capture owner scripts must keep production order');
}

const realCaptureHtml=
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
  if(pathname==='/__gens_capture_current_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(realCaptureHtml);
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
  const mark=name=>{stage=name;console.log('[capture-current]',name)};
  const watchdog=setTimeout(()=>{console.error('[capture-current] WATCHDOG stage='+stage);process.exit(1)},120000);

  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const url=`http://127.0.0.1:${port}/__gens_capture_current_real.html`;
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
    try{if(!sessionStorage.getItem('__captureSentinelBooted')){localStorage.clear();sessionStorage.clear();sessionStorage.setItem('__captureSentinelBooted','1')}}catch(e){}
    window.supabase={createClient:()=>({})};
  });

  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const browserErrors=[];
  const dialogs=[];
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

  const installCaptureOwners=async()=>{
    for(const owner of captureOwnerScripts){
      mark('install-'+owner.id);
      await page.addScriptTag({content:owner.source});
    }
    await page.evaluate(()=>{try{window.gensReconcile151?.('sentinel-install')}catch(e){}});
  };

  const waitOwners=()=>page.waitForFunction((captureId)=>{
    const p=typeof loadGameProfiles==='function'?loadGameProfiles().find(x=>String(x.id)===captureId):null;
    return typeof window.openGensFamily==='function' &&
      typeof window.openGensBuiltInGame==='function' &&
      typeof window.startConfiguredGame==='function' &&
      typeof window.gensMode151==='function' &&
      typeof window.ensureBuiltinMonsterCapture162==='function' &&
      !!p;
  },CAPTURE_ID);

  try{
    mark('navigate-real-capture-shell');
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});

    mark('install-current-capture-owners');
    await installCaptureOwners();

    mark('wait-current-capture-owners');
    await waitOwners();

    const seed=await page.evaluate((captureId)=>{
      const p=loadGameProfiles().find(x=>String(x.id)===captureId);
      return {
        id:p?.id||'',
        name:p?.name||'',
        style:p?.gameStyle||'',
        contentFamily:gensContentFamilyForProfile(p),
        profile:p?.rpgUniverse?.gameplay?.profile||'',
        capture:!!p?.rpgUniverse?.gameplay?.modules?.capture,
        controllable:!!p?.rpgUniverse?.gameplay?.modules?.controllableCreatures,
        trainer:p?.heroPool||[]
      };
    },CAPTURE_ID);
    assert.equal(seed.name,'Monster Capture');
    assert.equal(seed.style,'dungeon','current Capture intentionally reuses the dungeon-style RPG substrate');
    assert.equal(seed.contentFamily,'creature');
    assert.equal(seed.profile,'creature');
    assert.equal(seed.capture,true);
    assert.equal(seed.controllable,true);
    assert.ok(seed.trainer.map(String).includes(CAPTURE_TRAINER),'built-in Capture profile must keep its current trainer');

    mark('open-real-adventure-family');
    await page.locator('button.gensRootModeCard.adventure').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

    let captureCard=page.locator(`#gensFamilyGames [data-rpg-profile="${CAPTURE_ID}"] .gensUniverseMainBtn`);
    await captureCard.waitFor({state:'visible'});
    assert.match(await captureCard.textContent(),/Monster Capture/);

    const switchInfo=await page.evaluate((captureId)=>({
      active:activeGameProfileId(),
      from:gensProfileContentFamily155(activeGameProfileId()),
      to:gensProfileContentFamily155(captureId)
    }),CAPTURE_ID);

    if(switchInfo.active && switchInfo.active!==CAPTURE_ID && switchInfo.from!==switchInfo.to){
      mark('select-capture-through-real-v155-reload');
      await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded',timeout:15000}),
        captureCard.click()
      ]);
      mark('reinstall-current-capture-owners-after-v155-reload');
      await installCaptureOwners();
      await waitOwners();
      const reloaded=await page.evaluate((captureId)=>({
        active:activeGameProfileId(),
        forced:localStorage.getItem('gensrpg_forced_mode_reload_155')
      }),CAPTURE_ID);
      assert.equal(reloaded.active,CAPTURE_ID,'V16.155 reload must preserve the selected Capture profile');
      assert.equal(reloaded.forced,null,'forced-mode handoff must be consumed after reload');

      mark('reopen-adventure-after-real-reload');
      await page.locator('button.gensRootModeCard.adventure').click();
      await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
      captureCard=page.locator(`#gensFamilyGames [data-rpg-profile="${CAPTURE_ID}"] .gensUniverseMainBtn`);
      await captureCard.waitFor({state:'visible'});
    }

    mark('open-current-capture-profile');
    await captureCard.click();
    await page.waitForFunction((captureId)=>
      activeGameProfileId()===captureId &&
      getComputedStyle(document.getElementById('gensGameHome')).display!=='none',
      CAPTURE_ID
    );

    let state=await page.evaluate(()=>({
      active:activeGameProfileId(),
      family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
      contentFamily:gensCurrentContentFamily(),
      mode151:gensMode151(),
      dungeonMode:!!isDungeonMode(),
      style:getActiveGameProfile()?.gameStyle||'',
      session:localStorage.getItem('z40k_session_active_v1')
    }));
    assert.equal(state.active,CAPTURE_ID);
    assert.equal(state.family,'adventure','current Shell family guard classifies Capture under Adventure');
    assert.equal(state.contentFamily,'creature');
    assert.equal(state.mode151,'capture','V16.151 must separate Capture from classic Dungeon');
    assert.equal(state.dungeonMode,true,'current Capture still uses the historical dungeon-style RPG substrate');
    assert.equal(state.style,'dungeon');
    assert.notEqual(state.session,'1');

    mark('open-current-capture-pregame');
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
    await page.waitForFunction(()=>document.body.classList.contains('gensCapturePregame'));

    const pregame=await page.evaluate(()=>({
      captureClass:document.body.classList.contains('gensCapturePregame'),
      dungeonSetup:document.getElementById('sessionDungeonSetupBtn')?getComputedStyle(document.getElementById('sessionDungeonSetupBtn')).display:'absent',
      mode151:gensMode151()
    }));
    assert.equal(pregame.captureClass,true);
    assert.ok(
      pregame.dungeonSetup==='none'||pregame.dungeonSetup==='absent',
      'Capture pre-game must not expose an active classic Dungeon setup entry'
    );
    assert.equal(pregame.mode151,'capture');

    mark('select-real-capture-trainer');
    await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

    let trainer=page.locator(`#participantList input[type="checkbox"][value="${CAPTURE_TRAINER}"]`);
    if(!(await trainer.count()))trainer=page.locator('#participantList input[type="checkbox"]').first();
    await trainer.waitFor({state:'visible'});
    if(!(await trainer.isChecked()))await trainer.check();

    mark('select-real-capture-starter');
    const starterChoices=page.locator('#participantList .captureStarterChoice');
    await starterChoices.first().waitFor({state:'visible'});
    assert.ok(await starterChoices.count()>=1,'current Capture pre-game must expose at least one real starter creature');
    await starterChoices.first().click();
    await page.waitForFunction(()=>typeof gensCaptureParticipantsReady==='function'&&gensCaptureParticipantsReady()===true);

    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');
    await page.waitForFunction(()=>{
      const btn=document.querySelector('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]');
      return !!btn && btn.disabled===false;
    });

    mark('start-current-capture-session');
    await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();

    try{
      await page.waitForFunction(()=>(
        localStorage.getItem('z40k_session_active_v1')==='1' &&
        document.body.classList.contains('gens-pure-capture') &&
        getComputedStyle(document.getElementById('captureGameHub')).display!=='none'
      ),null,{timeout:7000});
    }catch(error){
      const diag=await page.evaluate(()=>({
        active:activeGameProfileId(),
        family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
        contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'missing',
        mode151:typeof gensMode151==='function'?gensMode151():'missing',
        session:localStorage.getItem('z40k_session_active_v1'),
        participants:typeof loadGameParticipants==='function'?loadGameParticipants():[],
        pure:document.body.classList.contains('gens-pure-capture'),
        captureHub:document.getElementById('captureGameHub')?getComputedStyle(document.getElementById('captureGameHub')).display:'absent',
        dungeonPanel:document.getElementById('dungeonMenuPanel')?getComputedStyle(document.getElementById('dungeonMenuPanel')).display:'absent',
        menu:document.getElementById('menu')?getComputedStyle(document.getElementById('menu')).display:'absent'
      })).catch(e=>({diagnosticError:String(e)}));
      console.error('[capture-current] launch-diagnostic',JSON.stringify({diag,dialogs,browserErrors}));
      throw error;
    }

    state=await page.evaluate(()=>({
      active:activeGameProfileId(),
      family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
      contentFamily:gensCurrentContentFamily(),
      mode151:gensMode151(),
      session:localStorage.getItem('z40k_session_active_v1'),
      pure:document.body.classList.contains('gens-pure-capture'),
      captureHub:getComputedStyle(document.getElementById('captureGameHub')).display,
      dungeonPanel:getComputedStyle(document.getElementById('dungeonMenuPanel')).display,
      menu:getComputedStyle(document.getElementById('menu')).display,
      title:document.getElementById('captureWorldTitle')?.textContent||'',
      day:document.getElementById('captureDayLabel')?.textContent||'',
      location:document.getElementById('captureWorldLocationLabel')?.textContent||''
    }));
    assert.equal(state.active,CAPTURE_ID);
    assert.equal(state.family,'adventure');
    assert.equal(state.contentFamily,'creature');
    assert.equal(state.mode151,'capture');
    assert.equal(state.session,'1');
    assert.equal(state.pure,true);
    assert.notEqual(state.captureHub,'none','Capture launch must show the current Capture hub');
    assert.equal(state.dungeonPanel,'none','classic Dungeon menu must stay hidden in current Capture');
    assert.notEqual(state.menu,'none');
    assert.equal(state.title,'Explorer le monde');
    assert.match(state.day,/Jour 1/);
    assert.equal(state.location,'Camp de départ');

    mark('exercise-current-capture-gameplay');
    await page.locator('#captureNextTurnBtn').click();
    await page.waitForFunction(()=>/Jour 2/.test(document.getElementById('captureDayLabel')?.textContent||''));

    const played=await page.evaluate((captureId)=>{
      const key='gensrpg_capture_world_v1_'+captureId;
      let world=null;try{world=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
      return {
        day:world?.day,
        playMode:world?.playMode,
        mode151:gensMode151(),
        contentFamily:gensCurrentContentFamily(),
        captureHub:getComputedStyle(document.getElementById('captureGameHub')).display,
        dungeonPanel:getComputedStyle(document.getElementById('dungeonMenuPanel')).display
      };
    },CAPTURE_ID);
    assert.equal(played.day,2,'current Capture day progression must persist through its real world-state owner');
    assert.equal(played.playMode,'free');
    assert.equal(played.mode151,'capture');
    assert.equal(played.contentFamily,'creature');
    assert.notEqual(played.captureHub,'none');
    assert.equal(played.dungeonPanel,'none');
    assert.deepEqual(browserErrors,[],'current Capture launch/gameplay scenario must not raise browser/runtime errors');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 1 current Monster Capture through real Shell',
      viewport:'412x915 @2.625 touch',
      profile:CAPTURE_ID,
      family:state.family,
      contentFamily:state.contentFamily,
      mode151:state.mode151,
      day:played.day
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
