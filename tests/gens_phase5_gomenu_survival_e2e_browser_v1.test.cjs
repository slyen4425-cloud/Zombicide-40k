const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
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
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[phase5-gomenu-survival-e2e] WATCHDOG');process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{
    if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text());
  });
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>
      typeof window.openChar==='function' &&
      typeof window.goMenu==='function' &&
      typeof window.startConfiguredGame==='function' &&
      typeof window.GensSurvivalModeIsolation1678104?.storedFamily==='function'
    ,null,{timeout:60000});
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});

    const survival=page.locator('button.gensRootModeCard.survival');
    await survival.waitFor({state:'visible'});
    await survival.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

    const games=page.locator('#gensFamilyGames button.gensFamilyGameCard:not(.disabled)');
    await games.first().waitFor({state:'visible'});
    await games.first().click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');

    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');

    await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

    const first=page.locator('#participantList input[type="checkbox"]').first();
    await first.waitFor({state:'visible'});
    if(!(await first.isChecked()))await first.check();

    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');

    await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
    await page.waitForFunction(()=>(
      localStorage.getItem('z40k_session_active_v1')==='1' &&
      getComputedStyle(document.getElementById('menu')).display!=='none'
    ),null,{timeout:15000});

    const before=await page.evaluate(()=>({
      active:activeGameProfileId(),
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      participants:typeof loadGameParticipants==='function'?loadGameParticipants().map(String):[],
      menu:getComputedStyle(document.getElementById('menu')).display,
      dungeon:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      capture:getComputedStyle(document.getElementById('captureGameHub')).display
    }));

    assert.equal(before.family,'survival','fixture must be a real Survival session');
    assert.ok(before.participants.length>0,'Survival fixture must expose a real participant');
    assert.notEqual(before.menu,'none');
    assert.equal(before.dungeon,'none');
    assert.equal(before.capture,'none');

    await page.evaluate(id=>window.openChar(id),before.participants[0]);
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sheet')).display!=='none');

    await page.evaluate(()=>window.goMenu());
    await page.waitForFunction(()=>(
      getComputedStyle(document.getElementById('menu')).display!=='none' &&
      getComputedStyle(document.getElementById('sheet')).display==='none'
    ),null,{timeout:10000});

    const after=await page.evaluate(()=>({
      active:activeGameProfileId(),
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      session:localStorage.getItem('z40k_session_active_v1'),
      menu:getComputedStyle(document.getElementById('menu')).display,
      sheet:getComputedStyle(document.getElementById('sheet')).display,
      dungeon:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      capture:getComputedStyle(document.getElementById('captureGameHub')).display,
      dungeonTheme:document.body.classList.contains('gensDungeonTheme')
    }));

    assert.equal(after.active,before.active,'Survival goMenu must keep the selected profile');
    assert.equal(after.family,'survival','Survival goMenu must keep Survival family authority');
    assert.equal(after.session,'1','Survival goMenu must keep the active session');
    assert.notEqual(after.menu,'none','Survival goMenu must return to the Survival menu');
    assert.equal(after.sheet,'none','Survival goMenu must close the hero sheet');
    assert.equal(after.dungeon,'none','Survival goMenu must not enter Dungeon');
    assert.equal(after.capture,'none','Survival goMenu must not enter Capture');
    assert.equal(after.dungeonTheme,false,'Survival goMenu must not leak Dungeon theme');
    assert.deepEqual(errors,[],'Survival goMenu E2E must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 5 Survival hero sheet -> goMenu -> Survival menu',
      before,after
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
