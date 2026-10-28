'use strict';
// Actual old World-owner COMBATTRE markup + original Capture function,
// original World/roster persistence, official packaged Lab + real author view.
// No test overrides of the canonical button and no dummy combat simulation.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.webp':'image/webp','.css':'text/css;charset=utf-8'};
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head>
<body style="background:#162c1f;color:#fff">
<div id="captureEncounterModal" style="display:block">
<div id="captureEncounterModalBody"></div></div>
<div id="captureExploreResult"></div>
<script>
var current='trainer-real-hub',state=null;
function activeGameProfileId(){return 'ci_original_capture_world_public_button'}
function normalizeGameParticipants(){return [current]}
// Real Shell provides this hook. This focused harness has no active Dungeon session.
function hasActiveSession(){return false}
function key(id){return 'ci_real_capture_hero_'+id}
function loadState(id){return JSON.parse(localStorage.getItem(key(id))||'{}')}
function loadSharedEntities(){return [
 {id:'crea-loup',category:'creature',name:'Loup volcanique',hp:150,desc:'Loup auteur'},
 {id:'crea_voltik',category:'creature',name:'Voltige',hp:120,desc:'Voltige auteur'},
 {id:'crea_unsupported',category:'creature',name:'Créature non publiée',hp:90,desc:'Non publiée'},
 ...(globalThis.ciOfficialAuthorEntities||[])
]}
function z40kEscHtml(x){return String(x??'')}
function z40kEscAttr(x){return String(x??'')}
</script>
<script src="/assets/gensrpg/core/asset-resolver-v1.js"></script>
<script src="/assets/gensrpg/capture/world-exploration-v1.js"></script>
<script src="/assets/gensrpg/capture/team-roster-v1.js"></script>
<script src="/assets/gensrpg/capture/legacy-monolith-functions-v1.js"></script>
</body></html>`;
async function withPage(browserEngine,cb){
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname==='/actual-world-button'){res.writeHead(200,{'Content-Type':'text/html'}).end(html);return;}
   const relative=pathname.slice(1);
   if(!relative||relative.split('/').includes('..')){res.writeHead(403).end();return;}
   let body,location;
   for(const dir of [site,root]){
    const full=path.resolve(dir,relative);
    if(!full.startsWith(dir+path.sep))continue;
    try{body=await fs.readFile(full);location=full;break;}catch{}
   }
   if(!body){res.writeHead(404).end();return;}
   res.writeHead(200,{'Content-Type':types[path.extname(location)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
  }catch(e){res.writeHead(500).end(String(e));}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser,context,page;
 try{
  browser=await browserEngine.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('gensrpg_game_profiles_v1','{"unrelated":"preserved"}'));
  page=await context.newPage();page.setDefaultTimeout(25000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/actual-world-button');
  return await cb(page,pageErrors);
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
}
async function seed(page,{oldHp=false,unsupported=false,wild=null}={}){
 await page.evaluate(async({oldHp,unsupported,wild})=>{
  const inputs=await (await fetch('/assets/gensrpg/capture/runtime-data/author-inputs.json')).json();
  globalThis.ciOfficialAuthorEntities=inputs.creatureTransfers
   .filter(x=>!['crea-loup','crea_voltik'].includes(x.draft.id))
   .map(x=>({id:x.draft.id,category:'creature',name:x.draft.displayName,
    desc:x.draft.description})); // World rendering only: Lab still owns HP/skills.
  const player=inputs.creatureTransfers.find(x=>x.draft.id==='crea-loup');
  const abilities=player.loadout.slots.map(x=>x.skillId).filter(Boolean);
  saveHeroCreatureState('trainer-real-hub',{
   creatureTeam:[{uid:'ci_real_loup',entityId:'crea-loup',level:2,xp:14,
    hp:oldHp?17:150,maxHp:oldHp?17:150,
    activeAbilityIds:oldHp?['old_claw']:[...abilities],
    knownAbilityIds:oldHp?['old_claw']:[...abilities],
    userNote:'unchanged-from-world'}],
   creatureReserve:[],gold:67,inventory:[{id:'owned-potion',qty:2}],
   creatorNote:'my forest'
  });
  const ws=captureWorldState();
  saveCaptureWorldState({...ws,locationId:'cap_forest',locationName:'Forêt créée',
   day:8,turnIndex:3,playMode:'turns',
   last:{type:'wild',creatureId:unsupported?'crea_unsupported':(wild||'crea_voltik'),
    text:'Rencontre sauvage réelle'}});
  renderCaptureEncounterPage();
  // The real Capture owner closes this modal when entering combat. A second
  // wild encounter must reopen the same original UI through its canonical
  // owner before the user can tap COMBATTRE again; never force a hidden tap.
  captureOpenModal('captureEncounterModal');
 },{oldHp,unsupported,wild});
 await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').waitFor();
}
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': original World owner COMBATTRE launches real signed Lab, official sprites, flee and persists once',{timeout:70000},async()=>{
  await withPage(engine,async(page,errors)=>{
   await seed(page);
   const original=await page.evaluate(()=>({
    world:captureWorldState(),hero:loadState('trainer-real-hub'),
    other:localStorage.getItem('gensrpg_game_profiles_v1'),
    owner:window.captureStartWildBattle.toString()
   }));
   assert.match(original.owner,/capture-official-wild-entry-v1\.mjs/);
   assert.doesNotMatch(original.owner,/captureStartBattleAutomatic\(/);
   await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').tap();
   await page.locator('#capture-official-entry-arena:not([hidden]) #capture-official-flee').waitFor();
   assert.equal(await page.locator('#capture-official-entry-arena .hub-fighter').count(),2);
   assert.equal(await page.locator('#capture-official-entry-arena img[data-author-asset-id]').count(),2);
   await page.waitForFunction(()=>[...document.querySelectorAll('#capture-official-entry-arena img[data-author-asset-id]')]
    .every(im=>im.complete&&im.naturalWidth>0),null,{timeout:16000});
   assert.ok(await page.getByRole('button',{name:'Griffe',exact:true}).isVisible());
   assert.ok(await page.getByRole('button',{name:'Boule de feu',exact:true}).isVisible());
   assert.match(await page.locator('#capture-official-entry-arena').innerText(),/Énergie/);
   await page.locator('#capture-official-flee').tap();
   await page.locator('#gens-capture-official-battle-v1').waitFor({state:'detached'});
   const result=await page.evaluate(()=>({
    world:captureWorldState(),hero:loadState('trainer-real-hub'),
    port:GensCaptureLabOwnershipPortV1.status(),
    other:localStorage.getItem('gensrpg_game_profiles_v1')
   }));
   assert.equal(result.world.last.type,'resolved');
   assert.equal(result.world.day,8);
   assert.equal(result.world.locationName,'Forêt créée');
   assert.equal(result.hero.creatureTeam[0].uid,'ci_real_loup');
   assert.equal(result.hero.creatureTeam[0].userNote,'unchanged-from-world');
   assert.equal(result.hero.gold,67);
   assert.deepEqual(result.hero.inventory,[{id:'owned-potion',qty:2}]);
   assert.equal(result.port.installed,false);
   assert.equal(result.other,original.other);
   assert.deepEqual(errors,[]);
  });
 });
 test(name+': old HP17 requires explicit consent and decline leaves EXACT state untouched',{timeout:70000},async()=>{
  await withPage(engine,async(page,errors)=>{
   await seed(page,{oldHp:true});
   const before=await page.evaluate(()=>({
    hero:localStorage.getItem(key('trainer-real-hub')),
    world:localStorage.getItem(captureWorldKey())
   }));
   const dialog=page.waitForEvent('dialog'); // user consent is never auto-approved
   await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').tap();
   const confirm=await dialog;
   assert.equal(confirm.type(),'confirm');
   assert.match(confirm.message(),/PV 17\/17 vers 150\/150/);
   await confirm.dismiss();
   await page.locator('#capture-official-entry-status[data-consent="declined"]').waitFor();
   const after=await page.evaluate(()=>({
    hero:localStorage.getItem(key('trainer-real-hub')),
    world:localStorage.getItem(captureWorldKey())
   }));
   assert.deepEqual(after,before,'decline cannot write hero or World');
   await page.getByRole('button',{name:'Retour au monde'}).tap();
   assert.deepEqual(errors,[]);
  });
 });
 test(name+': unsupported species cannot start old engine or mutate original save',{timeout:70000},async()=>{
  await withPage(engine,async(page,errors)=>{
   await seed(page,{unsupported:true});
   const before=await page.evaluate(()=>({
    hero:localStorage.getItem(key('trainer-real-hub')),
    world:localStorage.getItem(captureWorldKey())
   }));
   await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').tap();
   await page.locator('#capture-official-entry-status[data-error="true"]').waitFor();
   const after=await page.evaluate(()=>({
    hero:localStorage.getItem(key('trainer-real-hub')),
    world:localStorage.getItem(captureWorldKey()),
    port:GensCaptureLabOwnershipPortV1.status()
   }));
   assert.equal(after.hero,before.hero);
   assert.equal(after.world,before.world);
   assert.equal(after.port.installed,false);
   await page.getByRole('button',{name:'Retour au monde'}).tap();
   assert.deepEqual(errors,[]);
  });
 });
}

for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': the ORIGINAL public World COMBATTRE handles Venombre and Golem from the real authored eleven-species package',{timeout:120000},async()=>{
  await withPage(engine,async(page,errors)=>{
   for(const creatureId of ['crea_tox_2','crea_mossback']){
    await seed(page,{wild:creatureId});
    const before=await page.evaluate(()=>({world:captureWorldState(),profile:loadState('trainer-real-hub')}));
    assert.equal(before.world.last.creatureId,creatureId);
    await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').tap();
    await page.locator('#capture-official-entry-arena:not([hidden]) #capture-official-flee').waitFor();
    assert.equal(await page.locator('#capture-official-entry-arena .hub-fighter').count(),2);
    const actual=await page.locator('#capture-official-entry-arena .hub-fighter h2').allTextContents();
    assert.ok(actual.some(x=>x.includes(creatureId==='crea_tox_2'?'Venombre':'Golem')),
     creatureId+' must display the native author species, not Voltige fallback');
    await page.waitForFunction(()=>[...document.querySelectorAll('#capture-official-entry-arena img[data-author-asset-id]')]
     .length===2&&[...document.querySelectorAll('#capture-official-entry-arena img[data-author-asset-id]')]
      .every(image=>image.complete&&image.naturalWidth>0),null,{timeout:18000});
    await page.locator('#capture-official-flee').tap();
    await page.locator('#gens-capture-official-battle-v1').waitFor({state:'detached'});
    const after=await page.evaluate(()=>({world:captureWorldState(),profile:loadState('trainer-real-hub')}));
    assert.equal(after.world.last.type,'resolved');
    assert.equal(after.world.locationName,before.world.locationName);
    assert.equal(after.profile.creatureTeam[0].uid,before.profile.creatureTeam[0].uid);
    assert.deepEqual(after.profile.inventory,before.profile.inventory);
    assert.equal(after.profile.gold,before.profile.gold);
   }
   assert.deepEqual(errors,[]);
  });
 });
}
