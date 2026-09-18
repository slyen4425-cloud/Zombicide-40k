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
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.svg':'image/svg+xml'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){
    res.writeHead(403);res.end('forbidden');return;
  }
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return;}
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

(async()=>{
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
  const page=await context.newPage();
  page.setDefaultTimeout(60000);

  const errors=[];
  const unexpectedDialogs=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('dialog',async dialog=>{
    unexpectedDialogs.push({type:dialog.type(),message:dialog.message()});
    await dialog.accept();
  });

  try{
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'commit',timeout:60000});
    await page.waitForFunction(()=>[
      'openGensFamily',
      'openGensBuiltInGame',
      'newGame',
      'startConfiguredGame',
      'hasActiveSession',
      'isDungeonMode'
    ].every(name=>typeof window[name]==='function'));

    await page.waitForFunction(()=>document.querySelector('.gensRootModeCard.survival'));

    await page.locator('.gensRootModeCard.survival').click();
    await page.waitForFunction(()=>{
      const page=document.getElementById('gensFamilyHome');
      const title=document.getElementById('gensFamilyTitle');
      return page && getComputedStyle(page).display!=='none' && /Mode Survie/i.test(title?.textContent||'');
    });

    const survivalCards=page.locator('#gensFamilyGames .gensFamilyGameCard:not(.disabled)');
    assert.ok(await survivalCards.count()>=1,'at least one Survival universe card must exist');

    let chosen=null;
    const count=await survivalCards.count();
    for(let i=0;i<count;i++){
      const card=survivalCards.nth(i);
      const txt=(await card.innerText()).trim();
      if(!/NOUVEL UNIVERS/i.test(txt)){chosen=card;break;}
    }
    assert.ok(chosen,'a real Survival universe card must be selectable');
    const chosenLabel=(await chosen.innerText()).trim();

    await chosen.click();
    await page.waitForFunction(()=>{
      const home=document.getElementById('gensGameHome');
      return home && getComputedStyle(home).display!=='none';
    });

    await page.waitForFunction(()=>window.GensSurvivalModeIsolation1678104 || localStorage.getItem('gensrpg_session_family_guard_v1')==='survival');

    let state=await page.evaluate(()=>({
      guard:localStorage.getItem('gensrpg_session_family_guard_v1'),
      dungeonMode:isDungeonMode(),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      activeProfile:typeof activeGameProfileId==='function'?activeGameProfileId():null
    }));
    assert.equal(state.guard,'survival','Shell family guard must be Survival after selecting the universe');
    assert.equal(state.dungeonMode,false,'Survival universe must not be recognized as Dungeon');
    assert.equal(state.dungeonTheme,false,'Dungeon theme must not leak into Survival');

    await page.locator('#gensGameHome .newGameBtn').click();
    await page.waitForFunction(()=>{
      const pre=document.getElementById('pregameSetup');
      return pre && getComputedStyle(pre).display!=='none';
    });

    await page.locator('#pregameSetup .sessionSetupBtn').filter({hasText:'HÉROS'}).first().click();
    await page.waitForFunction(()=>{
      const p=document.getElementById('sessionHeroSetup');
      return p && getComputedStyle(p).display!=='none';
    });

    const participants=page.locator('#participantList input[type="checkbox"]');
    assert.ok(await participants.count()>=1,'Survival pregame must expose at least one participant');
    await participants.first().check();

    await page.locator('#sessionHeroSetup .startGameBtn').click();
    await page.waitForFunction(()=>{
      const pre=document.getElementById('pregameSetup');
      return pre && getComputedStyle(pre).display!=='none';
    });

    await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();

    await page.waitForFunction(()=>typeof hasActiveSession==='function' && hasActiveSession()===true);
    await page.waitForFunction(()=>{
      const menu=document.getElementById('menu');
      return menu && getComputedStyle(menu).display!=='none';
    });

    state=await page.evaluate(()=>({
      guard:localStorage.getItem('gensrpg_session_family_guard_v1'),
      active:hasActiveSession(),
      dungeonMode:isDungeonMode(),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      menu:getComputedStyle(document.getElementById('menu')).display,
      dungeonHost:document.getElementById('gensDungeonCore01')?getComputedStyle(document.getElementById('gensDungeonCore01')).display:null,
      dungeonCombatActive:typeof dungeonCombatActive!=='undefined'?!!dungeonCombatActive:false,
      participants:typeof loadGameParticipants==='function'?loadGameParticipants().map(String):[]
    }));

    assert.equal(state.guard,'survival','launch must keep the Survival family guard');
    assert.equal(state.active,true,'Survival launch must mark the session active');
    assert.equal(state.dungeonMode,false,'Survival launch must remain outside Dungeon mode');
    assert.equal(state.dungeonTheme,false,'Survival launch must not activate Dungeon theme');
    assert.notEqual(state.menu,'none','Survival game menu must be visible');
    if(state.dungeonHost!==null)assert.equal(state.dungeonHost,'none','Dungeon host must stay hidden during Survival launch');
    assert.equal(state.dungeonCombatActive,false,'Dungeon combat must not become active during Survival launch');
    assert.ok(state.participants.length>=1,'selected Survival participant must persist into the launched session');
    assert.deepEqual(unexpectedDialogs,[],'Survival launch must not require an unexpected confirm/alert');
    assert.deepEqual(errors,[],'browser console/page errors');

    console.log(JSON.stringify({
      scenario:'Phase 1 real Survival shell launch',
      viewport:'412x915 @2.625 touch',
      universe:chosenLabel,
      guard:state.guard,
      participants:state.participants.length,
      dungeonMode:state.dungeonMode,
      menu:'visible'
    }));
  }finally{
    await context.close();
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(err=>{
  console.error(err);
  process.exitCode=1;
});
