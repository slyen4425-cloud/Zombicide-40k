'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const DUNGEON_ID='game_profile_dungeon_demo';
const SURVIVAL_ID='game_profile_zombicide_base';

function scriptBody(id){
  const m=source.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));
const goOwners=blocks.filter(b=>/window\.goMenu\s*=/.test(b.body)).map(b=>b.id);
assert.deepEqual(goOwners,[],
  'cumulative guard requires no inline global goMenu override after Dungeon S2');

const core01=scriptBody('gensDungeonCore01Js');
const core200=scriptBody('dungeonCore200Rebuild');
assert.match(core01,/let coreActive=false/);
assert.equal((core01.match(/coreActive=true/g)||[]).length,1,
  'legacy Core01 active state must only be raised by its private show()');
assert.match(core01,/function show\(\)\{if\(!eligible\(\)\)return false;coreActive=true/);
assert.match(core01,/function start\(\)[\s\S]*return show\(\);/);
assert.match(core01,/window\.startConfiguredGame=async function\(\)\{if\(eligible\(\)\)return start\(\)/);
assert.doesNotMatch(core01,/window\.goMenu\s*=/,
  'retired Core01 must not regain global goMenu authority');

assert.match(core200,/window\.DungeonCore01=\{eligible:/,
  'Core 2.00 must replace the old public Dungeon API');
assert.match(core200,/window\.startConfiguredGame=async function\(\)\{if\(isDungeonMode\?\.\(\)&&!\(typeof isCaptureContext138/,
  'Core 2.00 must intercept current Dungeon starts before delegating');
assert.doesNotMatch(core200,/window\.goMenu\s*=/);
assert.match(core200,/GensShellScreenReturnV1/);
assert.match(core200,/register\?\.\("dungeon"/);
assert.match(core200,/if\(!active200\|\|!isDungeonMode\?\.\(\)\)return false;/);
assert.match(core200,/return show\(\)===true/);
const oldCapture='const old=window.DungeonCore01||{};';
assert.ok(core200.includes(oldCapture),'Core 2.00 replacement boundary must be explicit');
assert.equal((core200.slice(core200.indexOf(oldCapture)+oldCapture.length).match(/\bold\s*[.[]/g)||[]).length,0,
  'Core 2.00 must not keep using the retired public object after replacement');

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
    typeof window.showGensRootHome==='function' &&
    typeof window.DungeonCore01?.quit==='function'
  ,null,{timeout:60000});
}
async function openFamily(page,family){
  const selector=family==='survival'?'button.gensRootModeCard.survival':'button.gensRootModeCard.adventure';
  const b=page.locator(selector);await b.waitFor({state:'visible'});await b.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}
async function selectProfile(page,family,id){
  await openFamily(page,family);
  let selector=family==='survival'
    ?'#gensFamilyGames button.gensFamilyGameCard[onclick*="'+id+'"]'
    :'#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn';
  let card=page.locator(selector);await card.waitFor({state:'visible'});
  const sw=await page.evaluate(pid=>({
    active:activeGameProfileId?.()||'',
    from:gensProfileContentFamily155?.(activeGameProfileId?.()||'')||'',
    to:gensProfileContentFamily155?.(pid)||''
  }),id);
  if(sw.active&&sw.active!==id&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await waitPreview(page);await openFamily(page,family);
    card=page.locator(selector);await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(pid=>activeGameProfileId?.()===pid&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none',id,{timeout:30000});
}
async function startDungeon(page){
  await selectProfile(page,'adventure',DUNGEON_ID);
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>localStorage.getItem('z40k_session_active_v1')==='1' &&
    !!window.DungeonCore01?.active &&
    getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none',
    null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[core01-gomenu-preaudit] WATCHDOG');process.exit(1)},210000);
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

    await startDungeon(page);
    const started=await page.evaluate(()=>({
      active:!!DungeonCore01?.active,
      mode:!!isDungeonMode?.(),
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(started.active,true);
    assert.equal(started.mode,true);
    assert.notEqual(started.core,'none');
    assert.ok(Array.isArray(started.runtime?.participants)&&started.runtime.participants.length>0);

    await page.locator('#gensDungeonCore01 .dc01Top button[onclick="DungeonCore01.quit()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none' &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display==='none');

    await selectProfile(page,'survival',SURVIVAL_ID);
    const survival=await page.evaluate(()=>({
      profile:activeGameProfileId?.()||'',
      active:!!DungeonCore01?.active,
      mode:!!isDungeonMode?.(),
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(survival.profile,SURVIVAL_ID);
    assert.equal(survival.active,false);
    assert.equal(survival.mode,false);
    assert.equal(survival.core,'none');
    assert.ok(Array.isArray(survival.runtime?.participants));

    await page.evaluate(()=>showGensRootHome());
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');
    await selectProfile(page,'adventure',DUNGEON_ID);

    const dungeonHome=await page.evaluate(()=>({
      profile:activeGameProfileId?.()||'',
      active:!!DungeonCore01?.active,
      mode:!!isDungeonMode?.(),
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      gameHome:getComputedStyle(document.getElementById('gensGameHome')).display,
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(dungeonHome.profile,DUNGEON_ID);
    assert.equal(dungeonHome.mode,true,'returned profile must genuinely be Dungeon');
    assert.equal(dungeonHome.active,false,'Core 2.00 must remain inactive until Resume/New Game');
    assert.equal(dungeonHome.core,'none','Dungeon map must stay hidden on the profile home');
    assert.notEqual(dungeonHome.gameHome,'none');
    assert.ok(Array.isArray(dungeonHome.runtime?.participants),
      'the stale/resumable Dungeon runtime must still exist for this proof');

    // Decisive boundary: native Shell selects Dungeon, but the Dungeon provider
    // returns false because active200=false. Native Shell then falls back to the
    // shared profile/menu path. Legacy Core01 must remain unable to steal the screen.
    await page.evaluate(()=>window.goMenu());
    await page.waitForTimeout(350);

    const afterGo=await page.evaluate(()=>({
      profile:activeGameProfileId?.()||'',
      active:!!DungeonCore01?.active,
      mode:!!isDungeonMode?.(),
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')
    }));
    assert.equal(afterGo.profile,DUNGEON_ID);
    assert.equal(afterGo.mode,true);
    assert.equal(afterGo.active,false,
      'legacy Core01 goMenu must not resurrect Dungeon authority after a real module round-trip');
    assert.equal(afterGo.core,'none',
      'legacy Core01 goMenu must remain inert when returning to Dungeon profile without Resume');
    assert.ok(Array.isArray(afterGo.runtime?.participants),
      'proof must retain the resumable Dungeon runtime');

    assert.deepEqual(errors,[],'Core01 goMenu preaudit must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 5 remaining goMenu Core01 preaudit',
      chain:goOwners,
      afterRealDungeonStart:started,
      afterSurvivalSwitch:survival,
      returnedDungeonProfile:dungeonHome,
      afterDelegatedGoMenu:afterGo,
      conclusion:'Core 2.00 owns real Dungeon activation; legacy Core01 private coreActive stays inert across a real Dungeon -> Save/Quit -> Survival -> Dungeon-home round-trip.'
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
