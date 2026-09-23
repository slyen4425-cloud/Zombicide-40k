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
    typeof window.startConfiguredGame==='function' &&
    typeof window.goMenu==='function' &&
    typeof window.gensProfileContentFamily155==='function' &&
    typeof window.DungeonCore01?.openHero==='function'
  ,null,{timeout:60000});
}

async function openAdventure(page){
  const b=page.locator('button.gensRootModeCard.adventure');
  await b.waitFor({state:'visible'});await b.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}

async function selectProfile(page,id){
  await openAdventure(page);
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(pid=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(pid):''
  }),id);
  if(sw.active&&sw.active!==id&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await waitPreview(page);await openAdventure(page);
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(pid=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===pid&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,id,{timeout:30000});
}

async function startDungeon(page){
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
    return Array.isArray(rt?.participants)&&rt.participants.length>0 &&
      localStorage.getItem('z40k_session_active_v1')==='1' &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none';
  },null,{timeout:15000});

  return await page.evaluate(()=>{
    const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
    return String(rt.participants[0]);
  });
}

async function leaveDungeonSave(page){
  await page.evaluate(()=>window.DungeonCore01.quit());
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');
  const rt=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'));
  assert.ok(Array.isArray(rt?.participants)&&rt.participants.length>0,'Dungeon save must remain persisted for cross-module goMenu test');
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
  await page.waitForFunction(()=>
    localStorage.getItem('z40k_session_active_v1')==='1' &&
    typeof gensMode151==='function'&&gensMode151()==='capture' &&
    getComputedStyle(document.getElementById('captureGameHub')).display!=='none'
  ,null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[phase5-gomenu-e2e] WATCHDOG');process.exit(1)},210000);
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

    // 1) Dungeon hero sheet -> goMenu -> Dungeon map.
    const hero=await startDungeon(page);
    await page.evaluate(id=>window.DungeonCore01.openHero(id),hero);
    await page.waitForFunction(()=>{
      const sh=document.getElementById('sheet');
      return !!sh&&getComputedStyle(sh).display!=='none';
    },null,{timeout:10000});

    const beforeDungeonGo=await page.evaluate(()=>({
      profile:activeGameProfileId(),
      mode:typeof gensMode151==='function'?gensMode151():'',
      sheet:getComputedStyle(document.getElementById('sheet')).display,
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      bodyOverflow:document.body.style.overflow||'',
      bodyPointer:document.body.style.pointerEvents||'',
      htmlOverflow:document.documentElement.style.overflow||''
    }));
    assert.equal(beforeDungeonGo.profile,DUNGEON_ID);
    assert.notEqual(beforeDungeonGo.sheet,'none','Dungeon hero sheet must be open before goMenu characterization');

    await page.evaluate(()=>window.goMenu());
    await page.waitForFunction(()=>{
      const sh=document.getElementById('sheet');
      const core=document.getElementById('gensDungeonCore01');
      return !!sh&&getComputedStyle(sh).display==='none' &&
        !!core&&getComputedStyle(core).display!=='none';
    },null,{timeout:10000});

    const afterDungeonGo=await page.evaluate(()=>({
      profile:activeGameProfileId(),
      mode:typeof gensMode151==='function'?gensMode151():'',
      sheet:getComputedStyle(document.getElementById('sheet')).display,
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      root:getComputedStyle(document.getElementById('gensRootHome')).display,
      bodyOverflow:document.body.style.overflow||'',
      bodyPointer:document.body.style.pointerEvents||'',
      htmlOverflow:document.documentElement.style.overflow||'',
      specialDiceOpen:document.getElementById('specialDiceModal')?.classList.contains('open')||false,
      dc01ModalOpen:document.getElementById('dc01Modal')?.classList.contains('open')||false
    }));
    assert.equal(afterDungeonGo.profile,DUNGEON_ID,'Dungeon goMenu must keep Dungeon profile authority');
    assert.equal(afterDungeonGo.sheet,'none','Dungeon goMenu must close the hero sheet');
    assert.notEqual(afterDungeonGo.core,'none','Dungeon goMenu must return to the Dungeon map');
    assert.equal(afterDungeonGo.root,'none','Dungeon goMenu must not escape to global root while session is active');
    assert.notEqual(afterDungeonGo.bodyPointer,'none','Dungeon goMenu must not leave pointer events blocked');
    assert.equal(afterDungeonGo.specialDiceOpen,false,'Dungeon goMenu must not leave special dice modal open');
    assert.equal(afterDungeonGo.dc01ModalOpen,false,'Dungeon goMenu must not leave Dungeon modal open');

    // 2) Keep a real Dungeon save, then prove Capture owns goMenu.
    await leaveDungeonSave(page);
    await startCapture(page);
    const stale=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'));
    assert.ok(Array.isArray(stale?.participants)&&stale.participants.length>0,'old Dungeon save must coexist with Capture');

    // Call the real shared public boundary from the active Capture session.
    // Do not mutate views or storage to manufacture the expected result.
    await page.evaluate(()=>window.goMenu());
    await page.waitForFunction(()=>
      getComputedStyle(document.getElementById('captureGameHub')).display!=='none'
    ,null,{timeout:10000});

    const afterCaptureGo=await page.evaluate(()=>({
      profile:activeGameProfileId(),
      mode:typeof gensMode151==='function'?gensMode151():'',
      session:localStorage.getItem('z40k_session_active_v1'),
      hub:getComputedStyle(document.getElementById('captureGameHub')).display,
      dungeon:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      root:getComputedStyle(document.getElementById('gensRootHome')).display,
      staleDungeon:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));

    assert.equal(afterCaptureGo.profile,CAPTURE_ID,'Capture goMenu must keep Capture profile authority');
    assert.equal(afterCaptureGo.mode,'capture','Capture goMenu must keep Capture mode');
    assert.equal(afterCaptureGo.session,'1');
    assert.notEqual(afterCaptureGo.hub,'none','Capture goMenu must return to Capture hub');
    assert.equal(afterCaptureGo.dungeon,'none','stale Dungeon save must not steal Capture goMenu');
    assert.equal(afterCaptureGo.root,'none','Capture goMenu must not return to global root');
    assert.ok(Array.isArray(afterCaptureGo.staleDungeon?.participants)&&afterCaptureGo.staleDungeon.participants.length>0,
      'routing must be correct without deleting the independent Dungeon save');

    assert.deepEqual(errors,[],'goMenu E2E characterization must not raise browser/runtime errors');
    console.log(JSON.stringify({
      scenario:'Phase 5 goMenu E2E boundary characterization',
      dungeon:{hero,before:beforeDungeonGo,after:afterDungeonGo},
      capture:afterCaptureGo
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
