'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
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
    typeof window.DungeonWorldSessionBridge167832?.selectAdventure==='function' &&
    typeof window.DungeonWorldSessionBridge167832?.selectWorld==='function' &&
    typeof window.DungeonAuthoredRuntime167839?.active==='function' &&
    typeof window.DungeonWorldRuntime167823?.getConfig==='function'
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

async function startDungeon(page){
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
  await page.waitForFunction(()=>!!localStorage.getItem('gensrpg_dungeon_runtime_v2'),null,{timeout:15000});
}

(async()=>{
  let stage='boot';
  const watchdog=setTimeout(()=>{console.error('[phase7-exploration-browser] WATCHDOG '+stage);process.exit(1)},180000);
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
    stage='generated-prepare';
    await prepare(page,port);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await prepare(page,port);
    await openDungeonHome(page);

    stage='generated-select';
    const generatedSelection=await page.evaluate(()=>{
      const aid=String(window.activeDungeonAdventureId?.()||'default');
      const ok=window.DungeonWorldSessionBridge167832.selectAdventure(aid,false);
      return {aid,ok,primary:window.DungeonWorldSessionBridge167832.primary?.()};
    });
    assert.equal(generatedSelection.ok,true,'generated adventure selection must remain available');

    stage='generated-start';
    await startDungeon(page);
    const generatedBefore=await page.evaluate(()=>({
      authoredActive:!!window.DungeonAuthoredRuntime167839?.active?.(),
      exploreMarkers:{
        authored:!!window.DungeonCore01?.explore?.__dar167839,
        room:!!window.DungeonCore01?.explore?.__drr167822,
        world:!!window.DungeonCore01?.explore?.__dwr167823
      },
      legacyWorld:window.DungeonWorldRuntime167823?.getConfig?.()||null,
      tacticalOverlay:(()=>{const el=document.querySelector('.gtv2Overlay');if(!el)return false;const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0&&r.width>0&&r.height>0})(),
      tacticalBattle:!!window.GensRpgTacticalCombatV2Bridge?.currentBattle?.(window)
    }));
    assert.equal(generatedBefore.authoredActive,false,'generated adventure must not activate authored travel');
    assert.deepEqual(generatedBefore.exploreMarkers,{authored:true,room:true,world:true},
      'final explore chain must expose the authored wrapper while preserving historical markers');
    assert.equal(!!generatedBefore.legacyWorld?.enabled,false,'generated adventure must not activate legacy built-world runtime by default');
    assert.equal(generatedBefore.tacticalOverlay,false,'generated exploration start must not create Tactical UI');
    assert.equal(generatedBefore.tacticalBattle,false,'generated exploration start must not create a Tactical battle');

    stage='generated-explore';
    const generatedRoomBefore=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return Number(x?.room)||0;
    });
    await page.locator('#dc01Explore').click();
    await page.waitForFunction(before=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return Number(x?.room)>before;
    },generatedRoomBefore,{timeout:15000});
    const generatedAfter=await page.evaluate(()=> {
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return {
        room:Number(x?.room)||0,
        authored:!!x?.last?.authoredRuntime167839,
        worldNode:String(x?.last?.worldNodeId||'')
      };
    });
    assert.equal(generatedAfter.authored,false,'generated adventure explore must delegate past Authored travel');
    assert.equal(generatedAfter.worldNode,'','generated adventure must not acquire an authored world node');

    stage='authored-reset';
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await prepare(page,port);
    await openDungeonHome(page);

    stage='authored-fixture';
    const fixture=await page.evaluate(()=>{
      const R=window.DungeonRoomCreator100,B=window.DungeonWorldBuilder167821;
      const room=R.createRoom({id:'phase7_authority_room',name:'Phase 7 autorité exploration',width:4,height:4,theme:'stone'});
      room.cells=room.cells.map(c=>({...c,terrain:'floor',object:null}));
      room.cells[12].object='entry';
      room.cells[3].object='exit';
      R.upsertRoom(room);
      const world=B.createDungeon({name:'Phase 7 autorité exploration'});
      const added=B.addRoomInstance(world.id,room.id,'Zone unique');
      if(typeof B.setStart==='function')B.setStart(world.id,added.node.id);
      const graph=B.findDungeon(world.id);
      const valid=B.validation(graph);
      const selected=window.DungeonWorldSessionBridge167832.selectWorld(world.id,false);
      return {roomId:room.id,worldId:world.id,nodeId:added.node.id,valid,selected};
    });
    assert.equal(fixture.valid.valid,true,'authored authority fixture must be structurally valid');
    assert.equal(fixture.selected,true,'authored world must be selected through the real session bridge');

    stage='authored-start';
    await startDungeon(page);
    await page.waitForFunction(()=>window.DungeonAuthoredRuntime167839?.active?.()===true,null,{timeout:15000});
    const authoredBefore=await page.evaluate(()=>({
      authoredActive:!!window.DungeonAuthoredRuntime167839?.active?.(),
      legacyWorld:window.DungeonWorldRuntime167823?.getConfig?.()||null,
      exploreMarkers:{
        authored:!!window.DungeonCore01?.explore?.__dar167839,
        room:!!window.DungeonCore01?.explore?.__drr167822,
        world:!!window.DungeonCore01?.explore?.__dwr167823
      },
      tacticalOverlay:(()=>{const el=document.querySelector('.gtv2Overlay');if(!el)return false;const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0&&r.width>0&&r.height>0})(),
      tacticalBattle:!!window.GensRpgTacticalCombatV2Bridge?.currentBattle?.(window)
    }));
    assert.equal(authoredBefore.authoredActive,true,'selected world must activate Authored travel');
    assert.equal(!!authoredBefore.legacyWorld?.enabled,false,'Authored world must keep legacy World Runtime disabled');
    assert.deepEqual(authoredBefore.exploreMarkers,{authored:true,room:true,world:true});
    assert.equal(authoredBefore.tacticalOverlay,false,'Authored exploration start must not create Tactical UI');
    assert.equal(authoredBefore.tacticalBattle,false,'Authored exploration start must not create a Tactical battle');

    stage='authored-enter';
    await page.locator('#dc01Explore').click();
    await page.waitForFunction(nodeId=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return x?.last?.worldNodeId===nodeId&&x?.last?.authoredRuntime167839===true;
    },fixture.nodeId,{timeout:15000});
    const authoredAfter=await page.evaluate(()=> {
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const hero=x?.participants?.[Number(x?.index)||0];
      return {
        room:Number(x?.room)||0,
        node:String(x?.last?.worldNodeId||''),
        roomId:String(x?.last?.customRoomId||''),
        authored:!!x?.last?.authoredRuntime167839,
        position:x?.positions?.[hero],
        tacticalOverlay:(()=>{const el=document.querySelector('.gtv2Overlay');if(!el)return false;const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0&&r.width>0&&r.height>0})(),
        tacticalBattle:!!window.GensRpgTacticalCombatV2Bridge?.currentBattle?.(window)
      };
    });
    assert.equal(authoredAfter.node,fixture.nodeId,'Authored travel must enter the selected World Builder node');
    assert.equal(authoredAfter.roomId,fixture.roomId,'Authored travel must use the exact Room Creator geometry');
    assert.equal(authoredAfter.authored,true,'Authored runtime must own the entered zone');
    assert.equal(authoredAfter.position,12,'Authored travel must place the active hero on the exact entry cell');
    assert.equal(authoredAfter.tacticalOverlay,false,'empty authored entry must not create Tactical UI');
    assert.equal(authoredAfter.tacticalBattle,false,'empty authored entry must not create a Tactical battle');

    assert.deepEqual(errors,[],'Phase 7 exploration authority browser characterization must raise no runtime errors');
    console.log(JSON.stringify({
      scenario:'Phase 7 Dungeon exploration authority browser characterization',
      generated:{selection:generatedSelection,before:generatedBefore,after:generatedAfter},
      authored:{fixture,before:authoredBefore,after:authoredAfter}
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
