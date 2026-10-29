'use strict';
// Real classic World/roster owners, live World rarity/spawn selector, storage,
// and real encounter modal. Only the externally owned specimen catalog and
// deterministic RNG are injected; no alternate encounter generator is used.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const worldCode=fs.readFileSync(path.join(root,'assets/gensrpg/capture/world-exploration-v1.js'),'utf8');
const rosterCode=fs.readFileSync(path.join(root,'assets/gensrpg/capture/team-roster-v1.js'),'utf8');
const first={id:'crea-loup',name:'Loup volcanique',spawnChance:100,spawnTags:['earth']};
const second={id:'kitsune_lunaire',name:'Kitsune <rare>',spawnChance:100,spawnTags:['earth']};
function actualWorld({teamSize=2,reserve=0,missingSecond=false}={}){
 const profileId='the-existing-user-world',heroId='actual-trainer-01';
 const store=new Map(),modal={innerHTML:''};let writes=0,heroWrites=0;
 const hero={creatureTeam:Array.from({length:teamSize},(_,i)=>({
  uid:'ci-official-'+i,entityId:i?'crea_mossback':'crea-loup',hp:i?144:150,
  maxHp:i?144:150,level:4,xp:17,notes:'keep'
 })),creatureReserve:Array.from({length:reserve},(_,i)=>({uid:'ci-reserve-'+i})),
  gold:99,inventory:[{id:'potion',qty:3}],userNote:'stable'};
 store.set('hero:'+heroId,JSON.stringify(hero));
 const values=[0.01,0.1,0.2,0.1,0.1,0.2,0.9];
 let index=0,selectorCalls=0;
 const testMath=Object.create(Math);
 testMath.random=()=>values[index++]??0.01;
 const ctx=vm.createContext({
  current:heroId,state:null,Math:testMath,
  activeGameProfileId:()=>profileId,
  normalizeGameParticipants:()=>[heroId],
  localStorage:{
   getItem:key=>store.get(key)??null,
   setItem:(key,val)=>{store.set(key,String(val));writes++;if(key.startsWith('hero:'))heroWrites++;}
  },
  key:id=>'hero:'+id,
  loadState:id=>JSON.parse(store.get('hero:'+id)),
  loadSharedEntities:()=>[first,second],
  gensEncounterCreatures:()=>{
   selectorCalls++;
   return missingSecond&&selectorCalls===2?[]:[first,second];
  },
  document:{getElementById:id=>id==='captureEncounterModalBody'?modal:null},
  z40kEscHtml:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
  z40kEscAttr:x=>String(x).replaceAll("'",'&#39;')
 });
 vm.runInContext(worldCode,ctx);
 for(const part of [3,1]){
  const match=rosterCode.match(new RegExp(
   '// BEGIN_CAPTURE_TEAM_SECTION_'+part+'\\n([\\s\\S]*?)// END_CAPTURE_TEAM_SECTION_'+part
  ));
  assert.ok(match,'real canonical Capture roster owner section '+part+' required');
  vm.runInContext(match[1],ctx);
 }
 ctx.renderCaptureWorldHub=()=>{};
 ctx.saveCaptureWorldState({locationId:'cap_forest',locationName:'Forêt sauvegardée',
  playMode:'turns',day:9,turnIndex:2,last:null});
 const baselineWrites=writes;
 return {ctx,modal,hero,writes:()=>({world:writes-heroWrites,hero:heroWrites}),
  baselineWrites,selectorCalls:()=>selectorCalls,
  saved:()=>JSON.parse(store.get('hero:'+heroId))};
}

test('RED→GREEN real World location picker persists two genuine wild species for two active teammates, and renders both safely',()=>{
 const w=actualWorld();
 w.ctx.captureGenerateEncounter();
 const last=w.ctx.captureWorldState().last;
 assert.equal(last.type,'wild');
 assert.equal(last.creatureId,'crea-loup','legacy first species remains unchanged');
 assert.deepEqual([...last.creatureIds],['crea-loup','kitsune_lunaire'],
  'second wild must be chosen by the same original location encounter picker');
 assert.equal(w.selectorCalls(),2,'the canonical World spawner rolls once per real wild');
 assert.equal(w.ctx.captureWorldState().day,9);
 assert.equal(w.ctx.captureWorldState().turnIndex,2);
 assert.equal(w.writes().world,w.baselineWrites+1);
 assert.equal(w.writes().hero,0,'generating encounters must never edit trainer saves');
 w.ctx.renderCaptureEncounterPage();
 assert.match(w.modal.innerHTML,/Loup volcanique/);
 assert.match(w.modal.innerHTML,/Kitsune &lt;rare&gt;/);
 assert.doesNotMatch(w.modal.innerHTML,/<rare>/);
 assert.match(w.modal.innerHTML,/captureStartWildBattle\('crea-loup'\)/);
 assert.deepEqual(w.saved().creatureTeam,w.hero.creatureTeam);
 assert.equal(w.saved().gold,99);
});
test('legacy single-active World creates the identical old 1v1 event and never calls the second spawn',()=>{
 const w=actualWorld({teamSize:1});
 w.ctx.captureGenerateEncounter();
 const last=w.ctx.captureWorldState().last;
 assert.equal(last.type,'wild');
 assert.equal(last.creatureId,'crea-loup');
 assert.equal(Object.hasOwn(last,'creatureIds'),false);
 assert.equal(w.selectorCalls(),1);
 w.ctx.renderCaptureEncounterPage();
 assert.match(w.modal.innerHTML,/Loup volcanique/);
 assert.doesNotMatch(w.modal.innerHTML,/Kitsune/);
});
test('a second empty location roll does not forge a wild and cannot modify the saved roster',()=>{
 const w=actualWorld({missingSecond:true}),before=JSON.stringify(w.saved());
 w.ctx.captureGenerateEncounter();
 assert.equal(w.selectorCalls(),2);
 const last=w.ctx.captureWorldState().last;
 assert.equal(last.type,'empty');
 assert.equal(Object.hasOwn(last,'creatureIds'),false);
 assert.equal(w.writes().hero,0);
 assert.equal(JSON.stringify(w.saved()),before);
});
test('reserves or oversized historical team are not silently consumed to form two active combatants',()=>{
 for(const opts of [{teamSize:2,reserve:1},{teamSize:3}]){
  const w=actualWorld(opts),before=JSON.stringify(w.saved());
  w.ctx.captureGenerateEncounter();
  assert.equal(w.ctx.captureWorldState().last.type,'wild');
  assert.equal(w.ctx.captureWorldState().last.creatureId,'crea-loup');
  assert.equal(Object.hasOwn(w.ctx.captureWorldState().last,'creatureIds'),false);
  assert.equal(w.selectorCalls(),1);
  assert.equal(JSON.stringify(w.saved()),before);
 }
});
