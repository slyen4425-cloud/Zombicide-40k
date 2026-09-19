const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});

async function prepare(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.DungeonRoomCreator100?.upsertRoom==='function' &&
    typeof window.DungeonWorldBuilder167821?.createDungeon==='function' &&
    typeof window.DungeonZoneContent167824?.saveZoneContent==='function' &&
    typeof window.DungeonWorldSessionBridge167832?.selectWorld==='function' &&
    typeof window.DungeonAuthoredRuntime167839?.active==='function' &&
    typeof window.DungeonAuthoredActionFix167857?.syncActions==='function' &&
    typeof window.GensRpgTacticalRuntimeAuthority1678113?.scanDetection==='function'
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
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    const again=page.locator('button.gensRootModeCard.adventure');await again.waitFor({state:'visible'});await again.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});await card.click();
  }else await card.click();
  await page.waitForFunction(id=>typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
}

async function chooseParticipantAndStart(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>!!localStorage.getItem('gensrpg_dungeon_runtime_v2'),null,{timeout:15000});
}

async function syncMove(page,cell){
  return page.evaluate(cell=>{
    const cells=[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')],target=cells[cell];
    if(!target)throw new Error('missing board cell '+cell);
    const before=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
    const hero=before?.participants?.[Number(before?.index)||0]||'';
    target.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true}));
    target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
    const after=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
    const action=document.querySelector('#dzc167824Actions button');
    return {
      hero,
      before:Number(before?.positions?.[hero]),
      after:Number(after?.positions?.[hero]),
      remaining:Number(after?.remaining?.[hero]),
      chestAction:!!action,
      chestText:action?.textContent||'',
      detectionCalls:Array.isArray(window.__movementEventDetectionCalls)?window.__movementEventDetectionCalls.length:0
    };
  },cell);
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[dungeon-movement-events-red] WATCHDOG');process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push('pageerror:'+String(e)));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await prepare(page,port);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await prepare(page,port);await openDungeonHome(page);

    // Movement is a scenario prerequisite, not the seam under test.
    // Enable it through the canonical RPG profile data before starting the real Dungeon session.
    await page.evaluate(id=>{
      const profiles=loadGameProfiles(),index=profiles.findIndex(p=>String(p?.id||'')===String(id));
      if(index<0)throw new Error('Dungeon profile missing');
      const p=profiles[index];ensureRpgProfileData(p);
      p.rpgUniverse.gameplay={...(p.rpgUniverse.gameplay||{}),modules:{...(p.rpgUniverse.gameplay?.modules||{}),movement:true}};
      p.rpgUniverse.movement={...(p.rpgUniverse.movement||{}),enabled:true,mode:'tactical'};
      profiles[index]=p;saveGameProfiles(profiles);
    },DUNGEON_ID);
    assert.equal(await page.evaluate(()=>window.dc305PositionalGameplay?.()===true),true,'fixture must enable movement through canonical profile configuration');

    const fixture=await page.evaluate(()=>{
      const R=DungeonRoomCreator100,B=DungeonWorldBuilder167821,Z=DungeonZoneContent167824;
      const room=R.createRoom({id:'reg_move_events_room',name:'Régression mouvement événements',width:5,height:3,theme:'stone'});
      room.cells=room.cells.map(c=>({...c,terrain:'floor',object:null}));
      room.cells[12].object='entry';room.cells[4].object='exit';room.cells[8].object='chest';
      R.upsertRoom(room);
      const world=B.createDungeon({name:'Régression mouvement -> événements'}),added=B.addRoomInstance(world.id,room.id,'Salle mouvement');
      Z.saveZoneContent(world.id,added.node.id,{
        mode:'fixed',
        enemies:[{id:'reg_enemy',enemyId:'dng_skeleton',qty:1,cell:2,role:'enemy',hasKey:false,configured:true,hp:1}],
        chests:[{id:'reg_chest',cell:8,rarity:'rare',gold:1,items:[],label:'Coffre immédiat',configured:true}],
        traps:[],puzzles:[],npcs:[],items:[]
      });
      const selected=DungeonWorldSessionBridge167832.selectWorld(world.id,false);
      return {worldId:world.id,nodeId:added.node.id,selected,valid:B.validation(B.findDungeon(world.id))};
    });
    assert.equal(fixture.selected,true);assert.equal(fixture.valid.valid,true);

    await chooseParticipantAndStart(page);
    await page.waitForFunction(()=>window.DungeonAuthoredRuntime167839?.active?.(),null,{timeout:15000});
    const entry=page.locator('#dc01Explore');await entry.waitFor({state:'visible'});await entry.click();
    await page.waitForFunction(nodeId=>{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return x?.last?.worldNodeId===nodeId&&Number(x?.room)>0},fixture.nodeId,{timeout:15000});

    const setup=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),hero=x?.participants?.[Number(x?.index)||0]||'';
      const enemies=loadActiveEnemies?.()||[];for(const e of enemies){if(String(e?.id||'')&&Number(e?.dungeonRoom||0)===Number(x?.room||0)){e.vision=1;e.detectionRange=1}}saveActiveEnemies?.(enemies);
      window.__movementEventDetectionCalls=[];
      const old=window.dc200StartCombat;
      const spy=function(ids,reason){window.__movementEventDetectionCalls.push({ids:(ids||[]).map(String),reason:String(reason||'')});return {ok:true,intercepted:true}};
      if(old?.__gensRpg113Start)spy.__gensRpg113Start=true;
      if(old?.__gensRpg112Start)spy.__gensRpg112Start=true;
      spy.__original=old?.__original||old;
      window.dc200StartCombat=spy;
      return {
        hero,pos:Number(x?.positions?.[hero]),remaining:Number(x?.remaining?.[hero]),
        positional:typeof dc305PositionalGameplay==='function'?!!dc305PositionalGameplay():null,
        enemies:enemies.map(e=>({id:e.id,room:e.dungeonRoom,cell:x?.enemyCells?.[e.id],vision:e.vision,hp:e.hp})),
        actionFix:String(DungeonAuthoredActionFix167857.renderCommittedActions||''),
        detectionSchedule:String(GensRpgTacticalRuntimeAuthority1678113.scheduleDetection||''),
        moveHook:String(GensRpgTacticalRuntimeAuthority1678113.hookMovement||'')
      };
    });
    assert.equal(setup.pos,12,'authored hero must start on the real entry cell');
    assert.equal(setup.positional,true,'real Dungeon positional movement must be active');

    const neutralImmediate=await syncMove(page,13);
    await page.waitForTimeout(120);
    const neutralDelayed=await page.evaluate(()=>({action:!!document.querySelector('#dzc167824Actions button'),calls:window.__movementEventDetectionCalls.length}));

    const chestImmediate=await syncMove(page,8);
    await page.waitForTimeout(120);
    const chestDelayed=await page.evaluate(()=>({action:!!document.querySelector('#dzc167824Actions button'),text:document.querySelector('#dzc167824Actions button')?.textContent||'',calls:window.__movementEventDetectionCalls.length}));

    const detectionImmediate=await syncMove(page,7);
    await page.waitForTimeout(140);
    const detectionDelayed=await page.evaluate(()=>({calls:[...(window.__movementEventDetectionCalls||[])],action:!!document.querySelector('#dzc167824Actions button')}));

    const diagnostic={fixture,setup,neutralImmediate,neutralDelayed,chestImmediate,chestDelayed,detectionImmediate,detectionDelayed,errors};
    console.log('[dungeon-movement-events-red]',JSON.stringify(diagnostic,null,2));

    assert.equal(neutralImmediate.after,13,'neutral move must use the real board movement path');
    assert.equal(neutralImmediate.chestAction,false,'neutral move must not expose a chest action');
    assert.equal(neutralImmediate.detectionCalls,0,'neutral move must not trigger enemy detection');
    assert.equal(neutralDelayed.action,false,'neutral move must stay free of parasite interaction');
    assert.equal(neutralDelayed.calls,0,'neutral move must stay free of parasite detection');

    assert.equal(chestImmediate.after,8,'last movement must land on the authored chest cell');
    assert.equal(detectionImmediate.after,7,'last movement must enter the real enemy vision/LOS cell');
    assert.deepEqual(errors,[],'real Dungeon movement-event path must raise no browser/runtime errors');

    // Desired contract. This is intentionally RED on the diagnostic base:
    // both consumers must react in the same synchronous movement cycle, without timer/polling/retry.
    assert.deepEqual(
      {
        chestActionSameCycle:chestImmediate.chestAction,
        enemyDetectionSameCycle:detectionImmediate.detectionCalls>0
      },
      {chestActionSameCycle:true,enemyDetectionSameCycle:true},
      'movement completion must synchronously expose authored chest actions and run enemy detection'
    );
  }finally{
    clearTimeout(watchdog);server.closeAllConnections?.();server.closeIdleConnections?.();server.close();await context.close();await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
