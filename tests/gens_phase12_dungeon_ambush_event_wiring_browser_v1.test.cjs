'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'), http=require('node:http'), path=require('node:path');
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
async function start(page){
  await openDungeonHome(page);
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

function manhattan(a,b,width){return Math.abs(Math.floor(a/width)-Math.floor(b/width))+Math.abs(a%width-b%width)}
async function scenario(browser,port,kind){
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
 const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(65000);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,600)));
 page.on('dialog',d=>d.accept().catch(()=>{}));
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 if(kind==='external-emulated'){
   await page.route('https://raw.githack.com/**',route=>{
     const u=new URL(route.request().url()),prefix='/slyen4425-cloud/Zombicide-40k/'+SHA+'/';
     if(!u.pathname.startsWith(prefix))return route.abort();
     const f=fixture('/'+u.pathname.slice(prefix.length));
     return route.fulfill({status:f?200:404,body:f?.data||'not found',headers:{'content-type':f?.type||'text/plain','access-control-allow-origin':'*','cache-control':'no-store'}});
   });
 }
 const target='http://127.0.0.1:'+port+'/preview.html'+(kind==='external-emulated'?'?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/'+SHA+'/preview.html':'');
 const result={kind,boot:false,session:false,errors};
 try {
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await ready(page);
  result.boot=true;
  await start(page);
  result.session=true;
  const report=await page.evaluate(()=>{
    const API=window.DungeonEventRuntimeFix167878;
    if(!API)throw Error('DUNGEON-AMBUSH-OWNER-NOT-LOADED');
    if(typeof window.applyDungeonTurnEvent!=='function')throw Error('Real applyDungeonTurnEvent missing');
    if(typeof loadZombieReserve!=='function'||typeof saveZombieReserve!=='function')throw Error('Real enemy reserve missing');
    if(typeof loadActiveEnemies!=='function')throw Error('Real enemy list missing');
    const RT='gensrpg_dungeon_runtime_v2',x=JSON.parse(localStorage.getItem(RT)||'null');
    if(!x?.participants?.length)throw Error('Real Dungeon session without participants');
    const hero=String(x.participants[0]),size=7,cells=Array(49).fill('floor');
    cells[48]='exit';
    x.room=1;x.round=1;x.index=0;x.branch=null;
    x.last={kind:'enemy',room:1,at:Date.now(),title:'Diagnostic événement embuscade réel',map:{size,cells},narrative:'',exitLocked:false,keyEnemyId:''};
    x.positions={...(x.positions||{}),[hero]:24};
    x.heroRooms={...(x.heroRooms||{}),[hero]:1};
    x.enemyCells={};
    x.remaining={...(x.remaining||{}),[hero]:3};
    localStorage.setItem(RT,JSON.stringify(x));
    const ids=typeof DUNGEON_ENEMY_IDS!=='undefined'?DUNGEON_ENEMY_IDS:['dng_skeleton','dng_ghoul'];
    const reserve=loadZombieReserve();
    for(const id of ids)reserve[String(id)]=Math.max(20,Number(reserve[String(id)])||0);
    saveZombieReserve(reserve);
    const trace=()=>{
      const markers=[],seen=new Set();let fn=window.applyDungeonTurnEvent;
      for(let i=0;i<14&&typeof fn==='function'&&!seen.has(fn);i++){seen.add(fn);markers.push({ambush:fn.__der167879===true,vision:fn.__gensRpg113Detection===true});fn=fn.__original}
      return markers;
    };
    const beforeMarkers=trace();
    const countBefore=new Set(loadActiveEnemies().map(e=>String(e.id)));
    const event={id:'d_evt_ambush',name:'Embuscade',category:'combat',icon:'👹',effect:{kind:'spawn',qty:1},text:'Test réel de spawn'};
    const oldResult=window.applyDungeonTurnEvent(event,1);
    const after1=loadActiveEnemies();
    const first=after1.filter(e=>!countBefore.has(String(e.id))&&Number(e.hp)>0);
    const state1=JSON.parse(localStorage.getItem(RT)||'null');
    const loc1=first.map(e=>({id:String(e.id),cell:state1?.enemyCells?.[e.id],instanceCell:e.dungeonCell200,room:e.dungeonRoom}));
    const beforeSecond=new Set(after1.map(e=>String(e.id)));
    const reinforcement={id:'d_evt_reinforce',name:'Renforts ennemis',category:'combat',icon:'⚔️',effect:{kind:'spawn',qty:1},text:'Test vrai renfort'};
    const secondResult=window.applyDungeonTurnEvent(reinforcement,2);
    const after2=loadActiveEnemies();
    const second=after2.filter(e=>!beforeSecond.has(String(e.id))&&Number(e.hp)>0);
    const state2=JSON.parse(localStorage.getItem(RT)||'null');
    const loc2=second.map(e=>({id:String(e.id),cell:state2?.enemyCells?.[e.id],instanceCell:e.dungeonCell200,room:e.dungeonRoom}));
    API.install();API.install();
    return {loaded:true,hero,heroCell:24,room:1,size,source:typeof API.placeNewEventEnemies,owner:API.APP_VERSION,
      eventResult:oldResult?.result,reinforcementResult:secondResult?.result,
      beforeMarkers,afterMarkers:trace(),first:loc1,second:loc2,
      detectedBefore:!!window.GensRpgTacticalRuntimeAuthority1678113,
      reserveCount:ids.length};
  });
  result.report=report;
  assert.equal(report.loaded,true);
  assert.equal(report.owner,'16.78.79');
  assert.ok(report.first.length>0,kind+': original Dungeon event must spawn an actual enemy');
  assert.ok(report.second.length>0,kind+': original Dungeon event must spawn an actual reinforcement');
  for(const e of [...report.first,...report.second]){
    assert.ok(Number.isInteger(Number(e.cell)),kind+': new enemy has no persisted cell '+JSON.stringify(e));
    assert.equal(Number(e.cell),Number(e.instanceCell),kind+': runtime list and map must agree');
    assert.equal(Number(e.room),1,kind+': new enemy remains in same room');
    assert.equal(manhattan(Number(e.cell),24,7),1,kind+': event enemy is not adjacent to hero: '+JSON.stringify(e));
  }
  assert.equal(report.afterMarkers.filter(x=>x.ambush).length,1,kind+': event proximity owner must be installed exactly once');
  if(report.detectedBefore)assert.ok(report.afterMarkers.some(x=>x.vision),kind+': loaded V113 owner must remain in wrapper chain');
  else assert.equal(report.afterMarkers.filter(x=>x.vision).length,0,kind+': deferred V113 must not be invented by the event placement module');
  await page.waitForTimeout(350);
  result.post=await page.evaluate(()=>({
    battleActive:!!window.GensRpgTacticalCombatV2Ui?.getBattle?.(),
    lastDetection:window.GensRpgTacticalRuntimeAuthority1678113?.status?.()||null,
    map:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')?.enemyCells||{}
  }));
  assert.deepEqual(errors,[],kind+': no JS runtime errors during real event');
 }catch(e){result.error=String(e);throw Object.assign(e,{diagnostic:result})}
 finally{console.log('[dungeon-ambush-real-event] '+JSON.stringify(result));await context.close()}
 return result;
}
(async()=>{
  const watchdog=setTimeout(()=>{console.error('WATCHDOG real Dungeon ambush');process.exit(1)},180000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  try{
    const a=await scenario(b,server.address().port,'local');
    const x=await scenario(b,server.address().port,'external-emulated');
    console.log('[dungeon-ambush-real-event-parity] '+JSON.stringify({local:a.report.first,external:x.report.first,reinforcements:[a.report.second,x.report.second],sameDetectionOwner:a.report.afterMarkers.some(x=>x.vision)&&x.report.afterMarkers.some(x=>x.vision)}));
  }finally{
    clearTimeout(watchdog);await b.close();await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e,e.diagnostic||'');process.exitCode=1});
