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
async function start(page){
  await page.locator('button.gensRootModeCard.adventure').click();
  await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"] .gensUniverseMainBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  const first=page.locator('#participantList input[type="checkbox"]').first();await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>{try{return Array.isArray(JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}').participants)&&getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none'}catch(e){return false}},{timeout:20000});
}
async function scenario(browser,port,kind){
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(65000);
 const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 page.on('requestfailed',r=>failed.push({path:new URL(r.url()).pathname.slice(-100),failure:r.failure()?.errorText}));
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
 await page.addInitScript(()=>{
   window.__gensPreviewTiming=[];
   const old=Element.prototype.appendChild;
   Element.prototype.appendChild=function(node){
     if(node?.dataset?.gensrpgPreviewAux==='1')window.__gensPreviewTiming.push({readyState:document.readyState,src:String(node.src||'').split('/').slice(-1)[0],at:Math.round(performance.now())});
     return old.call(this,node);
   };
 });
 const target='http://127.0.0.1:'+port+'/preview.html'+(kind==='external-emulated'?'?url=https://github.com/slyen4425-cloud/Zombicide-40k/blob/'+SHA+'/preview.html':'');
 const result={kind,target:kind,steps:[],errors,failed};
 try{
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await ready(page);result.steps.push('boot');
  result.boot=await page.evaluate(()=>({ready:document.documentElement.dataset.gensrpgPreviewReady,aux:window.__gensPreviewTiming?.length,auxStates:window.__gensPreviewTiming?.map(x=>x.readyState),battleApi:typeof window.GensRpgTacticalCombatV2Ui?.getBattle,bridgeApi:typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat,tacticalEntry:typeof window.GensTacticalV1,bootstrap:typeof window.GensRuntimeBootstrapV1,render214:window.renderDungeonCombatRound===window.__dc214RenderCombat}));
  await start(page);result.steps.push('dungeon-session');
  await page.evaluate(()=>{
    const RT='gensrpg_dungeon_runtime_v2',x=JSON.parse(localStorage.getItem(RT)||'null');if(!x||!x.participants?.length)throw Error('runtime participants absent');
    const hero=String(x.participants[0]);
    x.index=0;x.room=1;x.round=1;x.branch=null;
    x.last={kind:'enemy',room:1,at:Date.now(),title:'Test Dungeon combat',map:{size:5,cells:Array(25).fill('floor')},narrative:'',exitLocked:false,keyEnemyId:''};x.last.map.cells[24]='exit';
    x.positions=x.positions||{};x.heroRooms=x.heroRooms||{};x.remaining=x.remaining||{};
    x.enemyCells={preview_diagnostic_enemy:12};x.positions[hero]=12;x.heroRooms[hero]=1;x.remaining[hero]=3;
    localStorage.setItem(RT,JSON.stringify(x));
    const def=activeEnemyDefinition('dng_skeleton')||activeEnemyDefinition('dng_ghoul'),enemyId=String(def?.id||'dng_skeleton'),hp=Math.max(1,Number(def?.hp||def?.maxHp)||6);
    saveActiveEnemies([{id:'preview_diagnostic_enemy',enemyId,hp,maxHp:hp,dungeonRoom:1,dungeonCell200:12,defeated:false}]);
    DungeonCore01.render();
  });result.steps.push('real-enemy-position');
  await page.waitForFunction(()=>/ATTAQUER|ENGAGER LE COMBAT/i.test(document.getElementById('dc01Explore')?.textContent||''),null,{timeout:15000});
  await page.locator('#dc01Explore').click();
  await page.waitForFunction(()=>!!document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]')&&!!window.GensRpgTacticalCombatV2Ui?.getBattle(),null,{timeout:20000});result.steps.push('tactical-overlay');
  result.combat=await page.evaluate(()=>{const b=window.GensRpgTacticalCombatV2Ui.getBattle();return {actors:b?.actors?.map(x=>({side:x.side,id:x.id})),diceBackdrops:document.querySelectorAll('.gtv2DiceBackdrop').length,attackButtons:document.querySelectorAll('.gtv2Actions button[data-attack]').length,targets:document.querySelectorAll('[data-target^="enemy:"]').length,actionText:document.querySelector('.gtv2Actions')?.textContent?.slice(0,280),turn:window.GensRpgTacticalCombatV2?.currentActor?.(b)?.side}});
  const targetBtn=page.locator('[data-target^="enemy:"]').first();
  if(await targetBtn.count()){await targetBtn.click();result.steps.push('select-enemy')}
  const attack=page.locator('.gtv2Actions button[data-attack]:not([disabled])').first();
  if(await attack.count()){
    result.steps.push('click-attack');
    await attack.click();
    try{await page.waitForSelector('.gtv2DiceBackdrop',{state:'visible',timeout:9000});result.steps.push('animated-dice-visible')}catch(e){result.steps.push('DICE-MISSING')}
  }else result.steps.push('NO-ENABLED-ATTACK');
  result.after=await page.evaluate(()=>({dice:document.querySelectorAll('.gtv2DiceBackdrop').length,turn:window.GensRpgTacticalCombatV2?.currentActor?.(window.GensRpgTacticalCombatV2Ui?.getBattle())?.side,actions:document.querySelector('.gtv2Actions')?.innerText?.slice(0,200),overlay:!!document.querySelector('.gtv2Overlay')}));
 }catch(e){result.exception=String(e).slice(0,700);result.html=await page.evaluate(()=>document.body?.innerText?.slice(0,250)).catch(()=>null)}
 finally{await context.close()}
 console.log('[dungeon-combat-preview-diagnostic] '+JSON.stringify(result));
 return result;
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{const local=await scenario(b,server.address().port,'local');const external=await scenario(b,server.address().port,'external-emulated');
   assert.ok(local.steps.includes('boot'),'local baseline must boot');
   assert.ok(external.steps.includes('boot'),'external preview must boot');
   assert.ok(external.boot?.aux>=20,'external diagnostic must observe late auxiliary module loading');
   console.log('[dungeon-combat-preview-comparison] '+JSON.stringify({localSteps:local.steps,externalSteps:external.steps,localErrors:local.errors,externalErrors:external.errors,externalTiming:external.boot?.auxStates?.slice(0,5)}));
 }finally{await b.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
