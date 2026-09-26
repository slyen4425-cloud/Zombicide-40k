'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const RT_KEY='gensrpg_dungeon_runtime_v2';
const DEVICE_HERO_KEY='gensrpg_dungeon_core01_device_hero_v1';

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

async function prepare(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.DungeonCore01?.explore==='function' &&
    typeof window.DungeonCore01?.endTurn==='function' &&
    typeof window.DungeonWorldSessionBridge167832?.selectAdventure==='function' &&
    typeof window.GensDungeonV1?.exploration?.planGeneratedAdvance==='function'
  ,null,{timeout:60000});
}

async function openDungeonHome(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');
  await adventure.waitFor({state:'visible'});await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await prepare(page,new URL(page.url()).port);
    const again=page.locator('button.gensRootModeCard.adventure');
    await again.waitFor({state:'visible'});await again.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});await card.click();
  }else await card.click();
  await page.waitForFunction(id=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,DUNGEON_ID,{timeout:30000});
}

async function startDungeonWithTwoHeroes(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

  const checks=page.locator('#participantList input[type="checkbox"]');
  assert.ok(await checks.count()>=2,'transition characterization requires at least two selectable heroes');
  for(let i=0;i<2;i++){
    const box=checks.nth(i);
    await box.waitFor({state:'visible'});
    if(!(await box.isChecked()))await box.check();
  }

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(key=>{
    const x=JSON.parse(localStorage.getItem(key)||'null');
    return Array.isArray(x?.participants)&&x.participants.length>=2;
  },RT_KEY,{timeout:15000});
}

(async()=>{
  let stage='boot';
  const watchdog=setTimeout(()=>{console.error('[phase7-generated-transition-browser] WATCHDOG '+stage);process.exit(1)},180000);
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
    stage='prepare';
    await prepare(page,port);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await prepare(page,port);
    await openDungeonHome(page);

    stage='select-generated';
    const selected=await page.evaluate(()=>{
      const aid=String(window.activeDungeonAdventureId?.()||'default');
      return window.DungeonWorldSessionBridge167832.selectAdventure(aid,false);
    });
    assert.equal(selected,true,'generated adventure selection must remain available');

    stage='start';
    await startDungeonWithTwoHeroes(page);

    const initial=await page.evaluate(key=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      return {
        participants:x.participants.map(String),
        room:Number(x.room)||0,
        index:Number(x.index)||0,
        heroRooms:{...x.heroRooms}
      };
    },RT_KEY);
    assert.ok(initial.participants.length>=2);
    const firstHero=initial.participants[0];
    const secondHero=initial.participants[1];
    assert.equal(initial.room,0,'generated session must start at entrance room 0');

    stage='create-room-1';
    await page.evaluate(()=>{
      window.__phase7GeneratedTransitionOldRandom=Math.random;
      Math.random=()=>0.999999;
    });
    await page.locator('#dc01Explore').click();
    await page.waitForFunction(key=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      return Number(x?.room)===1&&!!x?.roomStates?.['1']?.last;
    },RT_KEY,{timeout:15000});

    const afterCreate=await page.evaluate(({key,firstHero,secondHero})=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      return {
        room:Number(x.room)||0,
        index:Number(x.index)||0,
        heroRooms:{...x.heroRooms},
        positions:{...x.positions},
        remaining:{...x.remaining},
        roomState:JSON.stringify(x.roomStates?.['1']||null),
        roomLastAt:Number(x.roomStates?.['1']?.last?.at)||0,
        transition:x.dc313LastTransition||null,
        firstPosition:Number(x.positions?.[firstHero]),
        secondPosition:Number(x.positions?.[secondHero]),
        tacticalBattle:!!window.GensRpgTacticalCombatV2Bridge?.currentBattle?.(window)
      };
    },{key:RT_KEY,firstHero,secondHero});

    assert.equal(afterCreate.room,1,'first hero must create room 1');
    assert.equal(Number(afterCreate.heroRooms[firstHero]),1,'first hero must own room 1 after creation');
    assert.equal(Number(afterCreate.heroRooms[secondHero]),0,'second hero must remain at entrance before its turn');
    assert.equal(afterCreate.transition?.created,true,'first transition must record created=true');
    assert.equal(afterCreate.tacticalBattle,false,'creating the calm fixture room must not start Tactical');

    stage='close-intro';
    await page.evaluate(()=>window.DungeonCore01.closeModal());

    stage='turn-second-hero';
    await page.evaluate(()=>window.DungeonCore01.endTurn());
    await page.waitForFunction(({key,secondHero})=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      return String(x?.participants?.[x?.index||0]||'')===String(secondHero)&&Number(x?.room)===0;
    },{key:RT_KEY,secondHero},{timeout:15000});

    stage='prepare-existing-join';
    const beforeJoin=await page.evaluate(({key,firstHero,secondHero})=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      x.remaining=x.remaining||{};
      x.remaining[secondHero]=2;
      localStorage.setItem(key,JSON.stringify(x));
      window.DungeonCore01.assignHero(secondHero);
      return {
        room:Number(x.room)||0,
        firstRoom:Number(x.heroRooms?.[firstHero])||0,
        secondRoom:Number(x.heroRooms?.[secondHero])||0,
        firstPosition:Number(x.positions?.[firstHero]),
        secondPosition:Number(x.positions?.[secondHero]),
        firstRemaining:Number(x.remaining?.[firstHero]),
        secondRemaining:Number(x.remaining?.[secondHero]),
        roomState:JSON.stringify(x.roomStates?.['1']||null),
        roomLastAt:Number(x.roomStates?.['1']?.last?.at)||0
      };
    },{key:RT_KEY,firstHero,secondHero});

    assert.equal(beforeJoin.room,0,'second hero view must be restored to entrance before join');
    assert.equal(beforeJoin.firstRoom,1,'first hero must remain in room 1');
    assert.equal(beforeJoin.secondRoom,0,'second hero must still be at entrance');
    assert.equal(beforeJoin.secondRemaining,2,'fixture must set a known remaining movement value');

    stage='join-existing-room';
    await page.locator('#dc01Explore').click();
    await page.waitForFunction(({key,secondHero})=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      return Number(x?.room)===1&&Number(x?.heroRooms?.[secondHero])===1&&x?.dc313LastTransition?.created===false;
    },{key:RT_KEY,secondHero},{timeout:15000});

    const afterJoin=await page.evaluate(({key,firstHero,secondHero})=>{
      const x=JSON.parse(localStorage.getItem(key)||'null');
      const m=x?.last?.map;
      const candidates=[m?.heroIdx,m?.entryIdx,m?.cells?.indexOf?.('hero'),m?.cells?.indexOf?.('entry')];
      let entry=-1;
      for(const v of candidates){
        const n=Number(v);
        if(Number.isInteger(n)&&n>=0&&n<(m?.cells?.length||0)){entry=n;break}
      }
      if(entry<0&&Array.isArray(m?.cells))entry=m.cells.findIndex(v=>!['wall','void'].includes(String(v)));
      const overlay=document.querySelector('.gtv2Overlay');
      const visible=overlay?(()=>{
        const cs=getComputedStyle(overlay),r=overlay.getBoundingClientRect();
        return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0&&r.width>0&&r.height>0;
      })():false;
      return {
        room:Number(x.room)||0,
        firstRoom:Number(x.heroRooms?.[firstHero])||0,
        secondRoom:Number(x.heroRooms?.[secondHero])||0,
        firstPosition:Number(x.positions?.[firstHero]),
        secondPosition:Number(x.positions?.[secondHero]),
        firstRemaining:Number(x.remaining?.[firstHero]),
        secondRemaining:Number(x.remaining?.[secondHero]),
        expectedEntry:entry,
        roomState:JSON.stringify(x.roomStates?.['1']||null),
        roomLastAt:Number(x.roomStates?.['1']?.last?.at)||0,
        transition:x.dc313LastTransition||null,
        tacticalBattle:!!window.GensRpgTacticalCombatV2Bridge?.currentBattle?.(window),
        tacticalOverlay:visible
      };
    },{key:RT_KEY,firstHero,secondHero});

    assert.equal(afterJoin.room,1,'second hero must activate room 1 after existing-room join');
    assert.equal(afterJoin.firstRoom,1,'first hero must remain assigned to room 1');
    assert.equal(afterJoin.secondRoom,1,'second hero must now be assigned to room 1');
    assert.equal(afterJoin.firstPosition,beforeJoin.firstPosition,
      'joining hero must not move the first hero');
    assert.equal(afterJoin.firstRemaining,beforeJoin.firstRemaining,
      'joining hero must not change first hero remaining movement');
    assert.equal(afterJoin.secondPosition,afterJoin.expectedEntry,
      'joining hero must be placed on the existing room entry cell');
    assert.equal(afterJoin.secondRemaining,2,
      'joining hero must preserve the remaining movement value');
    assert.equal(afterJoin.roomState,beforeJoin.roomState,
      'existing-room join must not recreate or mutate the stored room snapshot');
    assert.equal(afterJoin.roomLastAt,beforeJoin.roomLastAt,
      'existing-room join must preserve the original room creation timestamp');
    assert.equal(String(afterJoin.transition?.heroId),String(secondHero));
    assert.equal(Number(afterJoin.transition?.from),0);
    assert.equal(Number(afterJoin.transition?.to),1);
    assert.equal(afterJoin.transition?.created,false);
    assert.equal(afterJoin.tacticalBattle,false,
      'existing-room join alone must not create a Tactical battle');
    assert.equal(afterJoin.tacticalOverlay,false,
      'existing-room join alone must not open Tactical UI');

    assert.equal(errors.length,0,'browser errors: '+errors.join('\n'));
    console.log(JSON.stringify({
      scenario:'Phase 7 generated existing-room transition browser characterization',
      heroes:[firstHero,secondHero],
      beforeJoin,
      afterJoin,
      result:'GREEN'
    },null,2));
  }finally{
    try{await page.evaluate(()=>{if(window.__phase7GeneratedTransitionOldRandom)Math.random=window.__phase7GeneratedTransitionOldRandom})}catch(e){}
    clearTimeout(watchdog);
    await context.close();
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(err=>{console.error(err);process.exit(1)});
