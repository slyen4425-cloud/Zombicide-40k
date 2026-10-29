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
 test(name+': real original World COMBATTRE 2v2 → four native fighters → one profile save, one World consume',{timeout:120000},async()=>{
  await withPage(engine,async(page,errors)=>{
   await seed(page);
   await page.evaluate(()=>{
    const hero=loadState('trainer-real-hub');
    hero.creatureTeam.push({...hero.creatureTeam[0],uid:'ci-second-loup',xp:18,userNote:'second-saved'});
    saveHeroCreatureState('trainer-real-hub',hero);
    const world=captureWorldState();
    saveCaptureWorldState({...world,last:{type:'wild',encounterId:'paired-original-2v2',
     creatureId:'crea_voltik',creatureIds:['crea_voltik','crea_voltik'],text:'Deux vrais Voltige'}});
    renderCaptureEncounterPage();
    captureOpenModal('captureEncounterModal');
    window.ciBefore={hero:loadState('trainer-real-hub'),world:captureWorldState()};
    window.ciWrites=[];
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){window.ciWrites.push(k);return original.call(this,k,v);};
   });
   const before=await page.evaluate(()=>window.ciBefore);
   assert.deepEqual(before.world.last.creatureIds,['crea_voltik','crea_voltik']);
   await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').tap();
   await page.locator('#capture-official-entry-arena:not([hidden]) [data-combat-demo] [data-combat-arena]').waitFor();
   assert.equal(await page.locator('#capture-official-entry-arena [data-demo-slot]:not([hidden])').count(),4);
   assert.equal(await page.locator('#capture-official-entry-arena [data-demo-image]').count(),4);
   await page.waitForFunction(()=>[...document.getElementById('capture-official-entry-arena').shadowRoot.querySelectorAll('[data-demo-image]')].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:18000});
   await page.locator('#capture-official-entry-arena [data-demo-slot="opponent-b"]').tap();
   assert.equal(await page.locator('#capture-official-entry-arena [data-demo-slot="opponent-b"]').getAttribute('data-target-selected'),'true');
   await page.locator('#capture-official-flee').tap();
   await page.locator('#gens-capture-official-battle-v1').waitFor({state:'detached'});
   const after=await page.evaluate(()=>({hero:loadState('trainer-real-hub'),world:captureWorldState(),writes:window.ciWrites,
    heroKey:key('trainer-real-hub'),worldKey:captureWorldKey(),port:GensCaptureLabOwnershipPortV1.status()}));
   assert.equal(after.world.last.type,'resolved');
   assert.equal(after.world.day,before.world.day);
   assert.equal(after.world.locationName,before.world.locationName);
   assert.deepEqual(after.hero.creatureTeam.map(x=>x.uid),before.hero.creatureTeam.map(x=>x.uid));
   assert.deepEqual(after.hero.creatureTeam.map(x=>x.hp),before.hero.creatureTeam.map(x=>x.hp));
   assert.deepEqual(after.hero.creatureTeam.map(x=>x.userNote),before.hero.creatureTeam.map(x=>x.userNote));
   assert.deepEqual(after.hero.inventory,before.hero.inventory);
   assert.equal(after.hero.gold,before.hero.gold);
   assert.equal(after.writes.filter(x=>x===after.heroKey).length,1);
   assert.equal(after.writes.filter(x=>x===after.worldKey).length,1);
   assert.equal(after.port.installed,false);
   assert.deepEqual(errors,[]);
  });
 });
}


for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': user-facing isolated 2v2 preview page actually runs canonical World button and returns after Lab flee',{timeout:140000},async()=>{
  await withPage(engine,async(page,errors)=>{
   const origin=new URL(page.url()).origin;
   await page.goto(origin+'/capture-world-2v2-test.html');
   await page.locator('#prepare').tap();
   await page.waitForFunction(()=>window.capture2v2PreviewReady===true,null,{timeout:30000});
   assert.equal(await page.locator('#status[data-error="true"]').count(),0);
   const before=await page.evaluate(()=>({
    world:captureWorldState(),hero:loadState(current),
    other:localStorage.getItem('gensrpg_game_profiles_v1')
   }));
   assert.deepEqual(before.world.last.creatureIds,['crea_voltik','kitsune_lunaire']);
   assert.deepEqual(before.hero.creatureTeam.map(x=>x.entityId),['crea-loup','crea_mossback']);
   await page.locator('#captureEncounterModalBody button[onclick^="captureStartWildBattle"]').tap();
   await page.locator('#capture-official-entry-arena:not([hidden]) [data-combat-demo] [data-combat-arena]').waitFor();
   assert.equal(await page.locator('#capture-official-entry-arena [data-demo-slot]:not([hidden])').count(),4);
   await page.waitForFunction(()=>{const imgs=[...document.getElementById('capture-official-entry-arena').shadowRoot.querySelectorAll('[data-demo-image]')];return imgs.length===4&&imgs.every(x=>x.complete&&x.naturalWidth>0)},null,{timeout:20000});
   await page.locator('#capture-official-flee').tap();
   await page.locator('#gens-capture-official-battle-v1').waitFor({state:'detached'});
   const after=await page.evaluate(()=>({
    world:captureWorldState(),hero:loadState(current),
    other:localStorage.getItem('gensrpg_game_profiles_v1')
   }));
   assert.equal(after.world.last.type,'resolved');
   assert.equal(after.world.locationId,before.world.locationId);
   assert.equal(after.hero.creatureTeam.length,2);
   assert.deepEqual(after.hero.creatureTeam.map(x=>x.uid),before.hero.creatureTeam.map(x=>x.uid));
   assert.deepEqual(after.hero.creatureTeam.map(x=>x.hp),before.hero.creatureTeam.map(x=>x.hp));
   assert.equal(after.other,before.other,'public-game profiles cannot be changed by preview');
   assert.deepEqual(errors,[]);
  });
 });
}
