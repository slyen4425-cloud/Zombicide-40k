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
  function combatSnapshot(){
    return page.evaluate(()=>{
      const battle=window.GensRpgTacticalCombatV2Ui?.getBattle(),E=window.GensRpgTacticalCombatV2,cur=E?.currentActor?.(battle)||null,
        enemy=battle?.actors?.find(a=>a.side==='enemy'&&a.alive)||null,
        attack=cur?.attacks?.[0]||null,p=cur&&enemy&&attack?E.attackPreview(battle,cur.id,enemy.id,attack.id):null,
        panel=document.querySelector('.gtv2Overlay [data-v108-panel]'),
        legacy=document.querySelector('.gtv2Overlay .gtv2Actions button[data-attack]'),
        el=panel?.querySelector('[data-v108-attack-go]'),
        css=x=>{if(!x)return null;const s=getComputedStyle(x),r=x.getBoundingClientRect();return {display:s.display,visibility:s.visibility,opacity:s.opacity,rect:{width:r.width,height:r.height},disabled:x.disabled}},
        log=(battle?.log||[]).filter(x=>x.type==='attack');
      return {
        overlay:!!document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]'),
        active:cur?{id:cur.id,side:cur.side,x:cur.x,y:cur.y,movementLeft:cur.movementLeft,actionsLeft:cur.actionsLeft}:null,
        target:enemy?{id:enemy.id,x:enemy.x,y:enemy.y,hp:enemy.hp}:null,
        selectedAttack:attack?.id||null,preview:p?{ok:p.ok,reason:p.reason||'',distance:p.distance,minRange:p.minRange,maxRange:p.maxRange}:null,
        tactical:!!window.GensRpgTacticalPolish1678108,
        panel:css(panel),visibleAttack:css(el),legacyAttack:css(legacy),
        approaches:document.querySelectorAll('.gtv2Overlay .gtv2Actions [data-approach]').length,
        dice:document.querySelectorAll('.gtv2DiceBackdrop').length,
        attackEvents:log.length,turn:battle?.round,phase:battle?.status,
        actions:document.querySelector('.gtv2Overlay .gtv2Actions')?.textContent?.trim().slice(0,240)
      };
    });
  }
  result.combat=await combatSnapshot();
  assert.equal(result.combat.active?.side,'hero','the actual Dungeon encounter must enter a hero turn');
  assert.ok(result.combat.target,'a live enemy must be present');
  const targetBtn=page.locator('.gtv2Overlay [data-target^="enemy:"]').first();
  await targetBtn.waitFor({state:'visible'});
  await targetBtn.click();
  result.steps.push('select-enemy');
  result.afterTarget=await combatSnapshot();

  // Rapprochement est une mécanique VOULUE. Tester l'attaque uniquement APRES
  // une distance valide, au lieu d'interpréter un "Hors de portée" comme un bug.
  if(!result.afterTarget.preview?.ok){
    assert.equal(result.afterTarget.preview?.reason,'out-of-range','unexpected non-range reason on first combat action');
    const approach=page.locator('.gtv2Overlay .gtv2Actions button[data-approach]');
    await approach.waitFor({state:'visible',timeout:8000});
    await approach.click();
    result.steps.push('legitimate-approach');
    result.afterApproach=await combatSnapshot();
    assert.ok(result.afterApproach.preview?.distance<result.afterTarget.preview.distance,
      'approach must genuinely reduce engine distance');
  }
  result.inRange=await combatSnapshot();
  if(!result.inRange.preview?.ok)throw new Error('Approach did not reach actual attack range: '+JSON.stringify(result.inRange));

  // STRICT regression: no test-only repair and no manual V108 install permitted.
  // The Tactical lifecycle must hand off the real render owner during activation.
  result.activation=await page.evaluate(()=>({
    uiRenderExists:typeof window.GensRpgTacticalCombatV2Ui?.render==='function',
    uiRenderWrapped:!!window.GensRpgTacticalCombatV2Ui?.render?.__gensRpg108Polish,
    polishAvailable:typeof window.GensRpgTacticalPolish1678108?.install==='function'
  }));
  assert.equal(result.activation.uiRenderExists,true,'Tactical UI must load');
  assert.equal(result.activation.uiRenderWrapped,true,'V108 owner must be reattached BEFORE the first action');
  assert.equal(result.inRange.panel?.display,'grid','the real attack/weapon/item panel must persist after approach');
  assert.equal(result.inRange.visibleAttack?.display,'block','the real attack command must be visible');
  assert.equal(result.inRange.legacyAttack?.display,'none','the hidden legacy button is not a user control');
  result.steps.push('lifecycle-owner-attached-without-manual-install');

  // L'ancienne attaque est volontairement CACHEE. La vraie UI du joueur est
  // [data-v108-attack-go] (menu attaque/arme/objet), qui lui délègue.
  const selected=page.locator('.gtv2Overlay [data-v108-panel] [data-v108-attack]');
  const go=page.locator('.gtv2Overlay [data-v108-panel] [data-v108-attack-go]');
  assert.equal(await selected.count(),1,'the real attack choice must exist');
  assert.equal(await go.count(),1,'the real visible player command must exist');
  await go.waitFor({state:'visible',timeout:8000});
  await selected.selectOption(result.inRange.selectedAttack);
  result.steps.push('visible-player-action-available');
  await go.click();
  result.steps.push('click-real-visible-attack');

  const dice=page.locator('.gtv2DiceBackdrop');
  await dice.waitFor({state:'visible',timeout:7000});
  result.steps.push('hero-animated-dice-visible');
  result.heroDice=await page.evaluate(()=>({
    dice:document.querySelectorAll('.gtv2DiceBackdrop').length,
    diceRow:document.querySelectorAll('.gtv2DiceBackdrop [data-v1149-die]').length,
    continueButton:!!document.querySelector('.gtv2DiceBackdrop [data-dice-continue]'),
    attackCount:window.GensRpgTacticalCombatV2Ui?.getBattle()?.log?.filter(x=>x.type==='attack')?.length||0,
    text:document.querySelector('.gtv2DiceBackdrop')?.innerText?.slice(0,450)
  }));
  assert.equal(result.heroDice.dice,1,'one and only one attack dice overlay');
  assert.ok(result.heroDice.diceRow>=1,'actual dice must be visible');
  assert.equal(result.heroDice.continueButton,true,'dice result must wait for explicit player confirmation');
  const countBefore=await page.evaluate(()=>window.GensRpgTacticalCombatV2Ui?.getBattle()?.log?.filter(x=>x.type==='attack')?.length||0);
  await page.waitForTimeout(1100);
  const countAfter=await page.evaluate(()=>window.GensRpgTacticalCombatV2Ui?.getBattle()?.log?.filter(x=>x.type==='attack')?.length||0);
  assert.equal(countAfter,countBefore,'automatic attack chains must not occur while Continue is waiting');
  await dice.locator('[data-dice-continue]').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('.gtv2DiceBackdrop [data-dice-continue]')?.disabled,null,{timeout:8000});
  await dice.locator('[data-dice-continue]').click();
  result.steps.push('hero-dice-confirmed');

  // Un tour ennemi peut suivre : ses propres dés doivent rester bloquants
  // jusqu'à "Continuer". Ne jamais inventer une riposte immédiate.
  try{
    await page.waitForFunction(()=>document.querySelector('.gtv2DiceBackdrop')||
      window.GensRpgTacticalCombatV2Ui?.getBattle()?.status==='ended'||
      window.GensRpgTacticalCombatV2?.currentActor?.(window.GensRpgTacticalCombatV2Ui?.getBattle())?.side==='hero',
      null,{timeout:10000});
  }catch(e){result.steps.push('enemy-turn-timeout')}
  result.after=await combatSnapshot();
  if(result.after.dice>0){
    result.steps.push('enemy-dice-visible');
    const frozen=result.after.attackEvents;
    await page.waitForTimeout(1050);
    const noChain=await combatSnapshot();
    assert.equal(noChain.attackEvents,frozen,'enemy attack must wait for Continue rather than chain hits');
    await page.waitForFunction(()=>!document.querySelector('.gtv2DiceBackdrop [data-dice-continue]')?.disabled,null,{timeout:8000});
    await page.locator('.gtv2DiceBackdrop [data-dice-continue]').click();
    result.steps.push('enemy-dice-confirmed');
  }

 }catch(e){result.exception=String(e).slice(0,700);result.html=await page.evaluate(()=>document.body?.innerText?.slice(0,250)).catch(()=>null)}
 finally{await context.close()}
 console.log('[dungeon-combat-preview-diagnostic] '+JSON.stringify(result));
 return result;
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{const local=await scenario(b,server.address().port,'local');const external=await scenario(b,server.address().port,'external-emulated');
   assert.ok(local.steps.includes('hero-animated-dice-visible'),'LOCAL preview must show dice for a VALID attack');
   assert.ok(external.steps.includes('hero-animated-dice-visible'),'EXTERNAL preview must show dice for a VALID attack');
   assert.ok(local.steps.includes('visible-player-action-available'),'LOCAL must provide real attack/weapon/item panel');
   assert.ok(external.steps.includes('visible-player-action-available'),'EXTERNAL must provide real attack/weapon/item panel');
   assert.ok(external.boot?.aux>=20,'external diagnostic must observe late auxiliary module loading');
   console.log('[dungeon-combat-preview-comparison] '+JSON.stringify({localSteps:local.steps,externalSteps:external.steps,localErrors:local.errors,externalErrors:external.errors,externalTiming:external.boot?.auxStates?.slice(0,5)}));
 }finally{await b.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
