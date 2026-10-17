'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHA='a832da1cbbad39c446f46f1035dbb819aa60ec20';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
function fixture(file){const target=path.resolve(root,'.'+file);if(!target.startsWith(root+path.sep))return null;try{return {data:fs.readFileSync(target),type:mime[path.extname(target).toLowerCase()]||'application/octet-stream'}}catch(_){return null}}
const server=http.createServer((req,res)=>{const f=fixture(decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));res.writeHead(f?200:404,{'content-type':f?.type||'text/plain','cache-control':'no-store','access-control-allow-origin':'*'});res.end(f?.data||'Not Found')});
async function ready(page){
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:110000});
  await page.waitForFunction(()=>typeof window.startConfiguredGame==='function',null,{timeout:12000});
}
async function openDungeonHome(page){
  const cardSelector='#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseMainBtn';
  const dungeonId='game_profile_dungeon_demo';
  const adventure=page.locator('button.gensRootModeCard.adventure');
  await adventure.waitFor({state:'visible'});
  await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator(cardSelector);
  await card.waitFor({state:'visible'});
  const switchInfo=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),dungeonId);
  if(switchInfo.active&&switchInfo.active!==dungeonId&&switchInfo.from!==switchInfo.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000}),card.click()]);
    await ready(page);
    await page.locator('button.gensRootModeCard.adventure').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    card=page.locator(cardSelector);
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(id=>typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',dungeonId,{timeout:30000});
}
async function start(page,alreadyAtGameHome=false){
  if(!alreadyAtGameHome)await openDungeonHome(page);
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
    try{
      const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const core=document.getElementById('gensDungeonCore01');
      return localStorage.getItem('z40k_session_active_v1')==='1'&&Array.isArray(rt?.participants)&&rt.participants.length>0&&!!core&&getComputedStyle(core).display!=='none';
    }catch(e){return false}
  },null,{timeout:30000});
}

async function scenario(browser,port,kind){
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(65000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,400)));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  if(kind==='external-emulated')await page.route('https://raw.githack.com/**',route=>{
    const u=new URL(route.request().url()),prefix='/slyen4425-cloud/Zombicide-40k/'+SHA+'/';
    if(!u.pathname.startsWith(prefix))return route.abort();
    const f=fixture('/'+u.pathname.slice(prefix.length));
    return route.fulfill({status:f?200:404,body:f?.data||'not found',headers:{'content-type':f?.type||'text/plain','access-control-allow-origin':'*','cache-control':'no-store'}});
  });
  const target='http://127.0.0.1:'+port+'/preview.html'+(kind==='external-emulated'?'?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/'+SHA+'/preview.html':'');
  try{
    await page.goto(target,{waitUntil:'domcontentloaded'});await ready(page);await start(page);
    const result=await page.evaluate(()=>{
      const fix=window.DungeonEventRuntimeFix167878,fn=window.applyDungeonTurnEvent;
      // Placement and detection are distinct owners that wrap the same event.
      // Check each owner once along the effective chain, not just the outermost.
      const chain=[];let wrapped=fn;
      for(let depth=0;typeof wrapped==='function'&&depth<12;depth++){
        chain.push({event:!!wrapped.__der167879,detection:!!wrapped.__gensRpg113Detection});
        wrapped=wrapped.__original;
      }
      const eventCount=chain.filter(x=>x.event).length;
      const detectionCount=chain.filter(x=>x.detection).length;
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      if(!x?.participants?.length)throw new Error('Real Dungeon session absent');
      const hero=String(x.participants[0]),heroCell=12,room=1;
      x.index=0;x.room=room;x.branch=null;x.last={kind:'ambush',room,title:'Embuscade réelle',map:{size:5,cells:Array(25).fill('floor')}};
      x.last.map.cells[24]='exit';x.heroRooms={...x.heroRooms,[hero]:room};x.positions={...x.positions,[hero]:heroCell};x.enemyCells={};
      localStorage.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x));
      saveActiveEnemies([]);
      const ids=typeof DUNGEON_ENEMY_IDS!=='undefined'?[...DUNGEON_ENEMY_IDS]:[];
      const reserve=loadZombieReserve();ids.forEach(id=>{reserve[id]=Math.max(Number(reserve[id])||0,10)});saveZombieReserve(reserve);
      const effect={id:'d_evt_ambush',name:'Embuscade',effect:{kind:'spawn',qty:1}};
      const outcome=fn(effect,1),all=loadActiveEnemies(),x2=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const enemy=all.find(e=>e?.hp>0&&Number(e.dungeonRoom)===room),cell=enemy?.id!=null?Number(x2.enemyCells?.[String(enemy.id)]):NaN;
      const dist=Number.isInteger(cell)?Math.abs(Math.floor(cell/5)-Math.floor(heroCell/5))+Math.abs(cell%5-heroCell%5):null;
      return {fixLoaded:!!fix,appVersion:fix?.APP_VERSION,wrapped:eventCount===1,eventCount,detectionCount,chain,spawned:all.length,outcome:outcome?.result||'',enemyId:enemy?.id||'',type:enemy?.enemyId||'',enemyCell:Number.isInteger(cell)?cell:null,distance:dist,enemyRoom:enemy?.dungeonRoom,stored:enemy?.dungeonCell200,mapKind:x2.last.map.cells[cell],heroCell,hero,ids:ids.slice(0,8)};
    });
    assert.deepEqual(errors,[],kind+' browser exceptions');
    console.log('[dungeon-real-ambush-owner-chain] '+JSON.stringify({kind,fixLoaded:result.fixLoaded,eventCount:result.eventCount,detectionCount:result.detectionCount,chain:result.chain,spawned:result.spawned}));
    assert.equal(result.fixLoaded,true,'the production Dungeon event proximity owner MUST load into real game');
    assert.equal(result.wrapped,true,'actual global event function must be wrapped exactly once');
    assert.equal(result.eventCount,1,'placement owner must appear once in the effective event wrapper chain');
    assert.equal(result.detectionCount,1,'V113 detection must wrap the same event function once');
    assert.ok(result.spawned>=1,'real engine must spawn an ambush opponent');
    assert.ok(result.enemyId,'spawned event enemy must have a real instance id');
    assert.equal(result.distance,1,'spawned ambush enemy MUST be adjacent to hero on traversable dungeon grid');
    assert.equal(result.stored,result.enemyCell,'position must persist on real enemy state');
    assert.notEqual(result.mapKind,'exit','ambush must never spawn on the exit');
    // The existing V113 owner must detect this REAL adjacent spawn and pass
    // through the public Dungeon->Tactical combat entry (no test scan call).
    const vision=await page.evaluate(()=>{
      const owner=window.GensRpgTacticalRuntimeAuthority1678113;
      return {owner:!!owner,installed:owner?.status?.(),
        pairs:owner?.detectionPairs?.(window)?.map(x=>({enemyId:x.enemyId,heroId:x.heroId,distance:x.distance,vision:x.vision}))||[]};
    });
    console.log('[dungeon-real-ambush-detection] '+JSON.stringify({kind,vision}));
    assert.ok(vision.owner,'V113 remains the sole runtime enemy detection owner');
    assert.ok(vision.pairs.some(x=>x.enemyId===result.enemyId&&x.heroId===result.hero),
      'adjacent, unobstructed real ambush must be visible to the active hero');
    await page.waitForFunction(()=>!!window.GensRpgTacticalCombatV2Ui?.getBattle?.()&&
      !!document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]'),null,{timeout:15000});
    const engaged=await page.evaluate(()=>{
      const battle=window.GensRpgTacticalCombatV2Ui.getBattle();
      return {participants:battle.actors.map(a=>({id:a.id,instanceId:a.meta?.instanceId||'',side:a.side,x:a.x,y:a.y})),
        overlays:document.querySelectorAll('.gtv2Overlay[data-gens-tactical-v2="1"]').length};
    });
    assert.equal(engaged.overlays,1,'one and only one Tactical combat UI');
    assert.ok(engaged.participants.some(a=>a.instanceId===result.enemyId),
      'detected adjacent ambush must enter Tactical with original enemy identity');
    console.log('[dungeon-real-ambush-tactical-entry] '+JSON.stringify({kind,engaged}));
    console.log('[dungeon-real-ambush] '+JSON.stringify({kind,...result}));
    return result;
  }finally{await context.close()}
}

async function realMovementDetection(browser,port){
 const ctx=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
 const page=await ctx.newPage();page.setDefaultTimeout(25000);
 page.on('dialog',d=>d.accept().catch(()=>{}));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 try{
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded'});await ready(page);await openDungeonHome(page);
  await page.locator('#gensGameHome button[onclick="backToGensFamily()"]').click();
  await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseCardActions button').first().click();
  const editor=page.locator('#rpgUniverseEditorModal');await editor.waitFor({state:'visible'});
  await editor.locator('button[onclick="showRpgUniverseTab(\'style\')"]').click();
  await editor.locator('[data-gmodule="movement"]').check();
  await editor.locator('button[onclick="saveRpgGameplayModules()"]').click();
  await editor.locator('[data-rpgtab-btn="movement"]').click();
  await editor.locator('#rpgMovementMode').selectOption('tactical');
  await editor.locator('#rpgMovementRefreshMode').selectOption('turn');
  await editor.locator('button[onclick="saveRpgMovementSettings()"]').click();
  await editor.locator('button[onclick="closeRpgUniverseEditor()"]').click();
  await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseMainBtn').click();
  await start(page,true);
  const initial=await page.evaluate(()=>{
   const K='gensrpg_dungeon_runtime_v2',x=JSON.parse(localStorage.getItem(K)||'null');
   if(!x?.participants?.length)throw Error('Dungeon runtime missing');
   const hero=String(x.participants[0]);
   x.index=0;x.room=1;x.branch=null;x.last={kind:'enemy',room:1,title:'Mouvement réel V113',map:{size:5,cells:Array(25).fill('floor')}};
   x.last.map.cells[24]='exit';x.positions={...x.positions,[hero]:6};x.heroRooms={...x.heroRooms,[hero]:1};
   x.remaining={...x.remaining,[hero]:4};x.enemyCells={v113_movement_enemy:13};
   localStorage.setItem(K,JSON.stringify(x));
   const d=activeEnemyDefinition('dng_skeleton')||activeEnemyDefinition('dng_ghoul');
   const hp=Math.max(1,Number(d?.hp||d?.maxHp)||6);
   saveActiveEnemies([{id:'v113_movement_enemy',enemyId:d?.id||'dng_skeleton',hp,maxHp:hp,vision:1,dungeonRoom:1,dungeonCell200:13,defeated:false}]);
   DungeonCore01.render();
   return {hero,enabled:!!window.dc305PositionalGameplay?.(),before:window.GensRpgTacticalRuntimeAuthority1678113?.detectionPairs?.(window)?.length,
     battle:!!window.GensRpgTacticalCombatV2Ui?.getBattle?.(),remaining:x.remaining[hero]};
  });
  console.log('[dungeon-real-movement-before] '+JSON.stringify(initial));
  assert.equal(initial.enabled,true,'creator configured real positional movement');
  assert.equal(initial.before,0,'enemy with vision 1 is not visible at distance 3');
  assert.equal(initial.battle,false,'no premature Tactical battle');
  const target=page.locator('#dc047RoomBoard .dc047Cell.dc200Reach[data-dc-map-index="12"]');
  await target.waitFor({state:'visible',timeout:15000});
  await target.tap(); // Actual user gesture and Dungeon movement owner.
  await page.waitForFunction(()=>{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return x.positions?.[x.participants?.[0]]===12},{},{timeout:12000});
  await page.waitForFunction(()=>{const b=window.GensRpgTacticalCombatV2Ui?.getBattle?.();return !!document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]')&&b?.actors?.some(a=>a.meta?.instanceId==='v113_movement_enemy')},null,{timeout:15000});
  const after=await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')),b=window.GensRpgTacticalCombatV2Ui.getBattle();
   return {cell:x.positions[x.participants[0]],remaining:x.remaining[x.participants[0]],enemies:b.actors.filter(a=>a.meta?.instanceId==='v113_movement_enemy').length,
    overlays:document.querySelectorAll('.gtv2Overlay[data-gens-tactical-v2="1"]').length};
  });
  console.log('[dungeon-real-movement-after] '+JSON.stringify(after));
  assert.equal(after.enemies,1,'one real enemy instance');assert.equal(after.overlays,1,'one Tactical overlay');
  assert.ok(after.remaining<initial.remaining,'movement cost must be consumed');
 }finally{await ctx.close()}
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
   await realMovementDetection(b,server.address().port);
   const local=await scenario(b,server.address().port,'local'),external=await scenario(b,server.address().port,'external-emulated');
   assert.equal(local.distance,external.distance,'both loading orders preserve same close-spawn contract');
 }finally{await b.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
