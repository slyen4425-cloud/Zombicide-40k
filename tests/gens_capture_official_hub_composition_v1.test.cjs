'use strict';
// End-to-end owner composition against the original saved Capture World/roster,
// the exact authored delivery artifact and the official native Combat Core.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
const baseUrl=pathToFileURL(site+path.sep);
const tick=()=>new Promise(done=>setImmediate(done));
let modulePromise;
const composition=()=>modulePromise??(modulePromise=import(pathToFileURL(
 path.join(root,'assets/gensrpg/capture/capture-official-hub-composition-v1.mjs')).href));

function realOwners({hp=150,maxHp=150,abilities=['claw','fireball','cap_fire_special_1','lib_flame_bite','cap_fire_atk_6'],
 reserve=[],wild='crea_voltik',heroId='trainer-saved'}={}) {
 const store=new Map();let heroWrites=0,worldWrites=0,rendered=0;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const ctx=vm.createContext({
  current:heroId,state:null,
  activeGameProfileId:()=> 'profile-authored-forest',
  normalizeGameParticipants:()=>[heroId],
  loadSharedEntities:()=>[
   {id:'crea-loup',name:'Loup volcanique',hp:150,abilityIds:abilities},
   {id:'crea_voltik',name:'Voltige',hp:120,abilityIds:[]}
  ],
  key:id=>'hero-saved-'+id,
  loadState:id=>JSON.parse(store.get('hero-saved-'+id)),
  localStorage:{
   getItem:key=>store.get(key)??null,
   setItem(key,value){
    store.set(key,String(value));
    if(key.startsWith('hero-saved-'))heroWrites++;
    if(key.startsWith('gensrpg_capture_world_v1_'))worldWrites++;
   }
  }
 });
 vm.runInContext(source('assets/gensrpg/capture/world-exploration-v1.js'),ctx);
 const roster=source('assets/gensrpg/capture/team-roster-v1.js');
 for(const part of [3,1]){
  const segment=roster.match(new RegExp('// BEGIN_CAPTURE_TEAM_SECTION_'+part+'\\n([\\s\\S]*?)// END_CAPTURE_TEAM_SECTION_'+part));
  assert.ok(segment,'physically loaded Capture roster owner '+part);
  vm.runInContext(segment[1],ctx);
 }
 ctx.renderCaptureWorldHub=()=>{rendered++};
 ctx.renderCaptureExploreResult=()=>{rendered++};
 const member={uid:'ci_saved_loup',entityId:'crea-loup',level:2,xp:14,
  hp,maxHp,activeAbilityIds:[...abilities],knownAbilityIds:[...abilities],statAlloc:{},
  userNote:'Do not discard my exact creature'};
 const hero={creatureTeam:[member],creatureReserve:reserve,gold:67,
  inventory:[{id:'creator-potion',qty:3}],customWorldLink:'my-forest'};
 store.set('hero-saved-'+heroId,JSON.stringify(hero));
 ctx.saveCaptureWorldState({locationId:'cap_forest',locationName:'Forêt du créateur',
  day:6,turnIndex:1,playMode:'turns',
  last:{type:'wild',creatureId:wild,text:'Vraie rencontre persistée'}});
 const baseline=worldWrites,bridgeCtx={};
 vm.runInNewContext(source('assets/gensrpg/capture/battle-bridge-contract-v1.js'),bridgeCtx);
 vm.runInNewContext(source('assets/gensrpg/capture/lab-ownership-port-v1.js'),bridgeCtx);
 let seq=0;
 return {
  owners:{
   activeHeroId:()=>ctx.captureActiveHeroId(),
   loadHeroState:id=>ctx.loadState(id),
   saveHeroState:(id,st)=>ctx.saveHeroCreatureState(id,st),
   readWorldState:()=>ctx.captureWorldState(),
   saveWorldState:next=>ctx.saveCaptureWorldState(next),
   consumeWildEncounter:reason=>ctx.captureConsumeWildEncounter(reason),
   worldStorageKey:()=>ctx.captureWorldKey(),
   nextEncounterId:()=> 'real-package-ticket-'+(++seq)
  },
  combatPort:bridgeCtx.GensCaptureLabOwnershipPortV1,
  validateBattleResult:bridgeCtx.GensCaptureBattleBridgeContractV1.result,
  baseline,
  get:()=>JSON.parse(store.get('hero-saved-'+heroId)),
  world:()=>copy(ctx.captureWorldState()),
  writes:()=>({hero:heroWrites,world:worldWrites}),
  renderCount:()=>rendered,
  store,ctx
 };
}
function reader(changes={}) {
 return async relative=>{
  const bytes=fs.readFileSync(path.join(site,relative));
  if(typeof changes[relative]==='function')return changes[relative](bytes);
  return new Uint8Array(bytes);
 };
}
function clock(){
 let now=0,seq=0;const tasks=new Map();
 return {
  now:()=>now,
  setTimer(fn,ms){const id=++seq;tasks.set(id,{at:now+ms,fn});return id;},
  clearTimer(id){tasks.delete(id);},
  count:()=>tasks.size
 };
}
async function ready(extra={},user={}){
 const {createCaptureOfficialHubCompositionV1}=await composition();
 const s=realOwners(user);
 const events=[],errors=[],time=clock();
 let session=null,disposed=0,resources=null;
 const controller=await createCaptureOfficialHubCompositionV1({
  siteBaseUrl:baseUrl,owners:s.owners,combatPort:s.combatPort,
  validateBattleResult:s.validateBattleResult,
  readBytes:reader(extra),nextClock:time,
  mountBattle:(battle,context,refs)=>{
   session=battle;resources=refs;
   return {render(){},dispose(){disposed++}};
  },
  onReturn:e=>events.push(e),onError:e=>errors.push(e)
 });
 return {...s,time,events,errors,controller,session:()=>session,
  resources:()=>resources,disposed:()=>disposed};
}
test('official static payload + exact Capture owners start one real native fight, flee and commit once',async()=>{
 const s=await ready();
 assert.equal(s.controller.resources.publishedSpecies.length,2);
 assert.deepEqual([...s.controller.resources.publishedSpecies],['crea-loup','crea_voltik']);
 assert.equal(s.writes().hero,0);
 const start=s.controller.startWildBattle('crea_voltik');
 assert.equal(start.ready,true);
 assert.equal(s.session().state().fighters.player.maxHp,150);
 assert.equal(s.session().state().fighters.opponent.maxHp,120);
 assert.equal(s.resources().source.combatSha,'65e21792ff74aea9862e528c8dbfdb22797b6693');
 assert.equal(s.combatPort.status().battleActive,true);
 assert.equal(s.world().last.encounterId,start.encounterId);
 assert.equal(s.writes().world,s.baseline+1);
 assert.equal(s.session().flee(),true);
 await tick();
 assert.equal(s.events.length,1);
 assert.equal(s.events[0].outcome,'flee');
 assert.equal(s.events[0].worldResolved,true);
 assert.equal(s.errors.length,0);
 assert.equal(s.get().creatureTeam[0].uid,'ci_saved_loup');
 assert.equal(s.get().creatureTeam[0].xp,14);
 assert.equal(s.get().creatureTeam[0].userNote,'Do not discard my exact creature');
 assert.equal(s.get().gold,67);
 assert.deepEqual(s.get().inventory,[{id:'creator-potion',qty:3}]);
 assert.equal(s.get().customWorldLink,'my-forest');
 assert.equal(s.world().last.type,'resolved');
 assert.equal(s.world().day,6);
 assert.equal(s.world().locationName,'Forêt du créateur');
 assert.equal(s.writes().hero,1);
 assert.equal(s.writes().world,s.baseline+2);
 assert.equal(s.disposed(),1);
 assert.equal(s.time.count(),0);
 assert.equal(s.combatPort.status().installed,false);
 assert.equal(s.controller.dispose(),true);
});
test('real saved incompatible HP and reserve are refused without profile write, World stamp or port install',async()=>{
 for(const user of [{hp:17,maxHp:17},{reserve:[{uid:'ci_reserve',entityId:'crea_voltik',hp:120,maxHp:120}]}]){
  const s=await ready({},user),before=s.get(),world=s.world();
  assert.throws(()=>s.controller.startWildBattle('crea_voltik'),/HP|1v1|team|reserve|incompatible/i);
  assert.equal(s.writes().hero,0);
  assert.equal(s.writes().world,s.baseline);
  assert.equal(s.world().last.encounterId,undefined);
  assert.deepEqual(s.get(),before);
  assert.deepEqual(s.world(),world);
  assert.equal(s.combatPort.status().installed,false);
  assert.equal(s.controller.dispose(),true);
 }
});
test('an author species absent from the pinned delivery is rejected before any original World write',async()=>{
 const s=await ready({}, {wild:'crea_inconnue'});
 const previous=s.world();
 assert.throws(()=>s.controller.startWildBattle('crea_inconnue'),/no official Combat Lab author transfer/);
 assert.equal(s.writes().hero,0);
 assert.equal(s.writes().world,s.baseline);
 assert.deepEqual(s.world(),previous);
 assert.equal(s.controller.dispose(),true);
});
test('altered authored input fails SHA-256 check before official engine import and before any user write',async()=>{
 const original='assets/gensrpg/capture/runtime-data/author-inputs.json';
 const {createCaptureOfficialHubCompositionV1}=await composition();
 const s=realOwners();
 let importCalled=false;
 await assert.rejects(()=>createCaptureOfficialHubCompositionV1({
  siteBaseUrl:baseUrl,owners:s.owners,combatPort:s.combatPort,
  validateBattleResult:s.validateBattleResult,mountBattle:()=>({dispose(){}}),
  readBytes:reader({[original]:raw=>{const bytes=Uint8Array.from(raw);bytes[20]^=1;return bytes;}})
 }),/SHA256/);
 assert.equal(importCalled,false);
 assert.equal(s.writes().world,s.baseline);
 assert.equal(s.writes().hero,0);
 assert.equal(s.combatPort.status().installed,false);
});
test('a spoofed Combat SHA or stale visual author source cannot become a second battle authority',async()=>{
 const {createCaptureOfficialHubCompositionV1}=await composition();
 for(const [path,patch,match] of [
  ['assets/gensrpg/capture/runtime-data/delivery-manifest.json',x=>({...x,combatSha:'f'.repeat(40)}),/pinned official Combat/],
  ['assets/gensrpg/capture/runtime-data/source.json',x=>({...x,assetsSha:'a'.repeat(40)}),/SHA256/]
 ]){
  const s=realOwners();
  await assert.rejects(()=>createCaptureOfficialHubCompositionV1({
   siteBaseUrl:baseUrl,owners:s.owners,combatPort:s.combatPort,
   validateBattleResult:s.validateBattleResult,mountBattle:()=>({dispose(){}}),
   readBytes:reader({[path]:raw=>new TextEncoder().encode(JSON.stringify(patch(JSON.parse(raw.toString('utf8')))))})
  }),match);
  assert.equal(s.writes().hero,0);
  assert.equal(s.writes().world,s.baseline);
 }
});
test('integration factory requires real owner callbacks and never creates a global replacement',async()=>{
 const {createCaptureOfficialHubCompositionV1}=await composition();
 const s=realOwners();
 await assert.rejects(()=>createCaptureOfficialHubCompositionV1({
  siteBaseUrl:baseUrl,owners:{...s.owners,saveHeroState:undefined},
  combatPort:s.combatPort,validateBattleResult:s.validateBattleResult,
  mountBattle:()=>({dispose(){}}),readBytes:reader()
 }),/owner missing saveHeroState/);
 const sourceBody=source('assets/gensrpg/capture/capture-official-hub-composition-v1.mjs');
 assert.ok(!sourceBody.includes('window.captureStartWildBattle'));
 assert.ok(!sourceBody.includes('localStorage'));
 assert.ok(!sourceBody.includes('createFakeCombat'));
 assert.equal(s.writes().hero,0);
});