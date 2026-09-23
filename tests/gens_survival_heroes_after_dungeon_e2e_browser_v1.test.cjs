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
    typeof window.startConfiguredGame==='function' &&
    typeof window.availableParticipantHeroIds==='function' &&
    typeof window.DungeonCore01?.quit==='function'
  ,null,{timeout:60000});
}

async function openFamily(page,rootClass){
  const b=page.locator('button.gensRootModeCard.'+rootClass);
  await b.waitFor({state:'visible'});await b.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}

async function selectProfile(page,rootClass,id){
  await openFamily(page,rootClass);
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn');
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
    await openFamily(page,rootClass);
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }

  await card.click();
  await page.waitForFunction(pid=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===pid&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,id,{timeout:30000});
}

async function selectDungeon(page){
  await selectProfile(page,'adventure',DUNGEON_ID);
}

async function startDungeon(page){
  await selectDungeon(page);
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
    getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none'
  ,null,{timeout:15000});
}

async function openSurvivalHeroSetup(page){
  await selectProfile(page,'survival',SURVIVAL_ID);

  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[survival-after-dungeon] WATCHDOG');process.exit(1)},180000);
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

    const initial=await page.evaluate(()=>({
      survivalPool:(loadGameProfiles().find(p=>p.id==='game_profile_zombicide_base')?.heroPool||[]).map(String),
      available:availableParticipantHeroIds().map(String),
      active:activeGameProfileId()
    }));
    assert.ok(initial.survivalPool.length>0,'clean 40K profile must initially contain Survival heroes');

    await startDungeon(page);

    const afterDungeonStart=await page.evaluate(()=>({
      survivalPool:(loadGameProfiles().find(p=>p.id==='game_profile_zombicide_base')?.heroPool||[]).map(String),
      active:activeGameProfileId(),
      dungeonMode:!!isDungeonMode()
    }));

    await page.evaluate(()=>window.DungeonCore01.quit());
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');

    await openSurvivalHeroSetup(page);

    const afterReturn=await page.evaluate(()=>({
      survivalPool:(loadGameProfiles().find(p=>p.id==='game_profile_zombicide_base')?.heroPool||[]).map(String),
      available:availableParticipantHeroIds().map(String),
      checkboxes:document.querySelectorAll('#participantList input[type="checkbox"]').length,
      active:activeGameProfileId(),
      dungeonMode:!!isDungeonMode()
    }));

    assert.ok(afterDungeonStart.survivalPool.length>0,
      'starting Dungeon must never erase the stored 40K heroPool');
    assert.equal(afterReturn.active,SURVIVAL_ID,'return fixture must activate the 40K Survival profile');
    assert.equal(afterReturn.dungeonMode,false,'return fixture must no longer be in Dungeon mode');
    assert.ok(afterReturn.available.length>0,'Survival must still expose available heroes after a Dungeon session');
    assert.ok(afterReturn.checkboxes>0,'Survival hero selector must still render at least one hero after Dungeon');
    assert.deepEqual(errors,[],'Survival after Dungeon regression scenario must not raise runtime errors');

    console.log(JSON.stringify({
      scenario:'Dungeon launch -> quit -> Survival hero availability',
      initial,
      afterDungeonStart,
      afterReturn
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
