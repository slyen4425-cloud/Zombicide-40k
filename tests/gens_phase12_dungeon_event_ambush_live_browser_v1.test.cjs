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
      return {fixLoaded:!!fix,appVersion:fix?.APP_VERSION,wrapped:!!fn?.__der167879,spawned:all.length,outcome:outcome?.result||'',enemyId:enemy?.id||'',type:enemy?.enemyId||'',enemyCell:Number.isInteger(cell)?cell:null,distance:dist,enemyRoom:enemy?.dungeonRoom,stored:enemy?.dungeonCell200,mapKind:x2.last.map.cells[cell],heroCell,hero,ids:ids.slice(0,8)};
    });
    assert.deepEqual(errors,[],kind+' browser exceptions');
    assert.equal(result.fixLoaded,true,'the production Dungeon event proximity owner MUST load into real game');
    assert.equal(result.wrapped,true,'actual global event function must be wrapped exactly once');
    assert.ok(result.spawned>=1,'real engine must spawn an ambush opponent');
    assert.ok(result.enemyId,'spawned event enemy must have a real instance id');
    assert.equal(result.distance,1,'spawned ambush enemy MUST be adjacent to hero on traversable dungeon grid');
    assert.equal(result.stored,result.enemyCell,'position must persist on real enemy state');
    assert.notEqual(result.mapKind,'exit','ambush must never spawn on the exit');
    console.log('[dungeon-real-ambush] '+JSON.stringify({kind,...result}));
    return result;
  }finally{await context.close()}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
   const local=await scenario(b,server.address().port,'local'),external=await scenario(b,server.address().port,'external-emulated');
   assert.equal(local.distance,external.distance,'both loading orders preserve same close-spawn contract');
 }finally{await b.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
