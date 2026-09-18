const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.mp3':'audio/mpeg'
};

const criticalHttpFailures=[];
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){
    res.writeHead(403);res.end('forbidden');return;
  }
  fs.readFile(file,(err,data)=>{
    if(err){
      res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
      res.end('not found');
      return;
    }
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

function displayed(page,id){
  return page.evaluate(sel=>{
    const el=document.querySelector(sel);
    return !!el && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden';
  },id);
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);

  const dialogs=[];
  const pageErrors=[];
  page.on('dialog',async d=>{dialogs.push(d.message());await d.accept()});
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('response',r=>{
    try{
      const u=new URL(r.url());
      if(u.hostname!=='127.0.0.1'||r.status()<400)return;
      if(/\.(?:js|html)$/i.test(u.pathname)||/\/(?:preview|index)\.html$/i.test(u.pathname)){
        criticalHttpFailures.push([r.status(),u.pathname]);
      }
    }catch(e){}
  });

  try{
    await page.addInitScript(()=>{
      localStorage.clear();
      localStorage.setItem('gensrpg_session_family_guard_v1','adventure');
      localStorage.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify({
        participants:['dungeon_aldren'],
        positions:{dungeon_aldren:4},
        room:4,
        last:{kind:'enemy'}
      }));
    });

    await page.goto(`http://127.0.0.1:${port}/preview.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1');
    await page.waitForFunction(()=>(
      typeof window.openGensFamily==='function' &&
      typeof window.openGensBuiltInGame==='function' &&
      typeof window.startConfiguredGame==='function' &&
      !!window.GensSurvivalModeIsolation1678104 &&
      window.openGensFamily.__gensIsolation104===true
    ));

    assert.equal(await displayed(page,'#gensRootHome'),true,'root GenSrpG home must be visible on a clean launch');
    await page.locator('.gensRootModeCard.survival').click();

    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#gensFamilyHome')).display!=='none');
    assert.match(await page.locator('#gensFamilyTitle').innerText(),/Mode Survie/i);

    const survivalCards=page.locator('#gensFamilyGames button[onclick*="openGensBuiltInGame"]');
    await survivalCards.first().waitFor({state:'visible'});
    assert.ok(await survivalCards.count()>=1,'at least one real Survival universe must be rendered');
    assert.match(await survivalCards.first().getAttribute('onclick'),/survival/,'real Survival card must route through openGensBuiltInGame(..., survival)');
    await survivalCards.first().click();

    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#gensGameHome')).display!=='none');
    await page.waitForTimeout(80);

    let shell=await page.evaluate(()=>({
      guard:localStorage.getItem('gensrpg_session_family_guard_v1'),
      survival:window.GensSurvivalModeIsolation1678104?.isSurvival?.(),
      dungeon:typeof window.isDungeonMode==='function'?window.isDungeonMode():null,
      staleDungeon:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      activeProfile:window.activeGameProfileId?.()||''
    }));
    assert.equal(shell.guard,'survival','Survival shell selection must replace a stale adventure family guard');
    assert.equal(shell.survival,true,'Survival isolation owner must recognize the selected family');
    assert.equal(shell.dungeon,false,'Survival shell must not be interpreted as Dungeon');
    assert.ok(shell.staleDungeon,'selecting Survival must preserve dormant Dungeon save data');
    assert.equal(shell.dungeonTheme,false,'Dungeon body theme must not leak into Survival');

    await page.locator('#gensGameHome .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pregameSetup')).display!=='none');
    await page.locator('#sessionHeroSetupBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#sessionHeroSetup')).display!=='none');

    const participantBoxes=page.locator('#participantList input[type="checkbox"]');
    await participantBoxes.first().waitFor({state:'attached'});
    assert.ok(await participantBoxes.count()>=1,'real Survival preparation must expose at least one participant');
    if(!(await participantBoxes.first().isChecked())) await participantBoxes.first().check();
    await page.waitForFunction(()=>typeof window.normalizeGameParticipants==='function'&&window.normalizeGameParticipants().length>=1);

    const selected=await page.evaluate(()=>window.normalizeGameParticipants().map(String));
    assert.ok(selected.length>=1,'Survival launch must use the participant selected through the real preparation UI');

    await page.locator('#sessionHeroSetup button[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pregameSetup')).display!=='none');

    const start=page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]');
    await start.waitFor({state:'visible'});
    assert.equal(await start.isDisabled(),false,'Survival start button must be enabled once a participant is selected');
    await start.click();

    await page.waitForFunction(()=>window.hasActiveSession?.()===true);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#menu')).display!=='none');
    await page.waitForTimeout(120);

    const final=await page.evaluate(()=>{
      const layer=id=>{
        const el=document.getElementById(id);
        if(!el)return {exists:false,display:'',open:false};
        return {exists:true,display:getComputedStyle(el).display,open:el.classList.contains('open')};
      };
      return {
        guard:localStorage.getItem('gensrpg_session_family_guard_v1'),
        survival:window.GensSurvivalModeIsolation1678104?.isSurvival?.(),
        dungeon:typeof window.isDungeonMode==='function'?window.isDungeonMode():null,
        session:window.hasActiveSession?.(),
        menu:getComputedStyle(document.querySelector('#menu')).display,
        staleDungeon:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
        dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
        overlays:{
          core:layer('dc01Overlay'),
          combat:layer('dungeonCombatModal'),
          victory:layer('dungeonCombatVictoryModal'),
          stats:layer('dungeonCombatStatsModal')
        },
        participants:window.normalizeGameParticipants?.().map(String)||[]
      };
    });

    assert.equal(final.guard,'survival','family guard must remain Survival after startConfiguredGame');
    assert.equal(final.survival,true,'Survival owner must remain active after game start');
    assert.equal(final.dungeon,false,'Dungeon mode must stay disabled after Survival game start');
    assert.equal(final.session,true,'real startConfiguredGame path must activate the session');
    assert.notEqual(final.menu,'none','real game menu must be visible after launch');
    assert.ok(final.staleDungeon,'Survival launch must not delete a dormant Dungeon save');
    assert.equal(final.dungeonTheme,false,'Dungeon theme must remain absent after Survival launch');
    assert.ok(final.participants.length>=1,'launched session must keep its real selected participant');
    for(const [name,layer] of Object.entries(final.overlays)){
      if(!layer.exists)continue;
      assert.equal(layer.open,false,`${name} Dungeon layer must not be open in Survival`);
      assert.equal(layer.display,'none',`${name} Dungeon layer must remain hidden in Survival`);
    }

    assert.equal(dialogs.some(m=>/Sélectionne au moins un héros/i.test(m)),false,'real Survival launch must not fall back to missing-participant alert');
    assert.deepEqual(criticalHttpFailures,[],'critical preview/runtime files must load without HTTP errors');

    console.log(JSON.stringify({
      scenario:'Phase 1 real Survival shell launch',
      viewport:'412x915 @2.625 touch',
      participant:selected[0],
      familyGuard:final.guard,
      dungeonMode:final.dungeon,
      dormantDungeonSavePreserved:!!final.staleDungeon,
      pageErrors
    }));
  }finally{
    try{await context.close()}catch(e){}
    try{await browser.close()}catch(e){}
    try{server.closeAllConnections?.()}catch(e){}
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
