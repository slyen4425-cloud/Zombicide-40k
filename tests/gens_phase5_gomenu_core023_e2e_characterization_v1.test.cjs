const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const SURVIVAL_ID='game_profile_zombicide_base';
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
    typeof window.goMenu==='function' &&
    typeof window.gensProfileContentFamily155==='function' &&
    typeof window.DungeonCore01?.openHero==='function'
  ,null,{timeout:60000});
}

async function openFamily(page,family){
  const selector=family==='survival'
    ?'button.gensRootModeCard.survival'
    :'button.gensRootModeCard.adventure';
  const b=page.locator(selector);
  await b.waitFor({state:'visible'});
  await b.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}

async function selectProfile(page,family,id){
  await openFamily(page,family);
  let selector=family==='survival'
    ?'#gensFamilyGames button.gensFamilyGameCard[onclick*="'+id+'"]'
    :'#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn';
  let card=page.locator(selector);
  await card.waitFor({state:'visible'});

  const sw=await page.evaluate(pid=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(pid):''
  }),id);

  if(sw.active&&sw.active!==id&&sw.from!==sw.to){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),
      card.click()
    ]);
    await waitPreview(page);
    await openFamily(page,family);
    card=page.locator(selector);
    await card.waitFor({state:'visible'});
  }

  await card.click();
  await page.waitForFunction(pid=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===pid&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,id,{timeout:30000});
}

async function startDungeon(page){
  await selectProfile(page,'adventure',DUNGEON_ID);
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});
  if(!(await first.isChecked()))await first.check();

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();

  await page.waitForFunction(()=>
    localStorage.getItem('z40k_session_active_v1')==='1' &&
    !!window.DungeonCore01?.active &&
    getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none'
  ,null,{timeout:15000});

  return await page.evaluate(()=>{
    const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
    return String(rt?.participants?.[0]||'');
  });
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[core023-e2e] WATCHDOG');process.exit(1)},210000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);

    // A. Nominal active Dungeon: Core 2.00 must short-circuit before Core 0.23.
    const hero=await startDungeon(page);
    await page.evaluate(id=>window.DungeonCore01.openHero(id),hero);
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sheet')).display!=='none');
    await page.evaluate(()=>window.goMenu());
    await page.waitForFunction(()=>
      getComputedStyle(document.getElementById('sheet')).display==='none' &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none'
    );

    const nominal=await page.evaluate(()=>({
      active:!!window.DungeonCore01?.active,
      dungeonMode:!!window.isDungeonMode?.(),
      sheet:getComputedStyle(document.getElementById('sheet')).display,
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      specialDiceOpen:document.getElementById('specialDiceModal')?.classList.contains('open')||false,
      dc01ModalOpen:document.getElementById('dc01Modal')?.classList.contains('open')||false
    }));
    assert.equal(nominal.active,true);
    assert.equal(nominal.dungeonMode,true);
    assert.equal(nominal.sheet,'none','nominal Dungeon goMenu must close the hero sheet');
    assert.notEqual(nominal.core,'none','nominal Dungeon goMenu must return to the Dungeon map');
    assert.equal(nominal.specialDiceOpen,false,'nominal Dungeon goMenu must not leave special dice open');
    assert.equal(nominal.dc01ModalOpen,false,'nominal Dungeon goMenu must not leave the Dungeon modal open');

    // B. Real user path out of an active Dungeon session:
    // Save & Quit returns authority to the Shell while keeping the Dungeon save.
    const beforeQuit=await page.evaluate(()=>({
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),
      session:localStorage.getItem('z40k_session_active_v1')
    }));
    assert.ok(Array.isArray(beforeQuit.runtime?.participants)&&beforeQuit.runtime.participants.length>0,
      'Dungeon runtime must exist before the real Save & Quit transition');

    await page.locator('#gensDungeonCore01 .dc01Top button[onclick="DungeonCore01.quit()"]').click();
    await page.waitForFunction(()=>
      getComputedStyle(document.getElementById('gensRootHome')).display!=='none' &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display==='none'
    ,null,{timeout:10000});

    const afterQuit=await page.evaluate(()=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      dungeonActive:!!window.DungeonCore01?.active,
      root:getComputedStyle(document.getElementById('gensRootHome')).display,
      dungeonDisplay:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(afterQuit.session,'1','Save & Quit must keep the Dungeon session resumable');
    assert.equal(afterQuit.dungeonActive,false,'Save & Quit must release Dungeon active screen authority');
    assert.notEqual(afterQuit.root,'none','Save & Quit must return to the Shell root');
    assert.equal(afterQuit.dungeonDisplay,'none');
    assert.ok(Array.isArray(afterQuit.runtime?.participants)&&afterQuit.runtime.participants.length>0,
      'Save & Quit must keep the independent Dungeon runtime');

    // The Shell now owns the real switch to Survival.
    await selectProfile(page,'survival',SURVIVAL_ID);

    const switched=await page.evaluate(()=>({
      profile:activeGameProfileId?.()||'',
      family:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
      session:localStorage.getItem('z40k_session_active_v1'),
      dungeonActive:!!window.DungeonCore01?.active,
      dungeonMode:!!window.isDungeonMode?.(),
      dungeonDisplay:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      gameHome:getComputedStyle(document.getElementById('gensGameHome')).display,
      staleDungeon:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));

    assert.equal(switched.profile,SURVIVAL_ID,'real Shell switch must activate the Survival profile');
    assert.equal(switched.dungeonMode,false,'real Shell switch must leave Dungeon mode');
    assert.equal(switched.dungeonActive,false,'Dungeon Core active state must not survive the real module switch');
    assert.equal(switched.dungeonDisplay,'none','Dungeon Core must stay hidden after the real module switch');
    assert.notEqual(switched.gameHome,'none','Survival game home must own the screen after switch');
    assert.ok(Array.isArray(switched.staleDungeon?.participants),
      'the routing proof must not depend on deleting the independent Dungeon runtime');

    // C. Exercise the shared goMenu boundary after the real switch.
    // Core 0.23 delegates outside Dungeon, but its post-delegation cleanup must
    // remain inert because DungeonCore01.active is now false.
    await page.evaluate(()=>window.goMenu());
    await page.waitForFunction(()=>
      getComputedStyle(document.getElementById('menu')).display!=='none' &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display==='none'
    ,null,{timeout:10000});

    const survivalGo=await page.evaluate(()=>({
      profile:activeGameProfileId?.()||'',
      dungeonActive:!!window.DungeonCore01?.active,
      dungeonMode:!!window.isDungeonMode?.(),
      menu:getComputedStyle(document.getElementById('menu')).display,
      dungeonDisplay:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      staleDungeon:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(survivalGo.profile,SURVIVAL_ID,'Survival goMenu must keep Survival profile authority');
    assert.equal(survivalGo.dungeonActive,false,'Core 0.23 post-delegation condition must be false after the real switch');
    assert.equal(survivalGo.dungeonMode,false,'Survival goMenu must remain outside Dungeon mode');
    assert.notEqual(survivalGo.menu,'none','Survival goMenu must return to the Survival menu');
    assert.equal(survivalGo.dungeonDisplay,'none','Core 0.23 must not re-show Dungeon after delegation');
    assert.ok(Array.isArray(survivalGo.staleDungeon?.participants),
      'the proof must keep the stale Dungeon runtime present');

    assert.deepEqual(errors,[],'Core 0.23 characterization must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 5 Core 0.23 goMenu E2E characterization',
      nominalDungeon:nominal,
      realDungeonToSurvivalSwitch:switched,
      survivalGoMenuWithStaleDungeonRuntime:survivalGo,
      conclusion:'Nominal Dungeon return stays correct. After real Save & Quit and a real Shell switch to Survival, Dungeon active authority is false, so Core 0.23 post-delegation cleanup cannot retake the screen.'
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
