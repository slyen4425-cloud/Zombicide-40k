import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
 createAdventureSessionV1,createAdventureStoreV1,
 DEFAULT_ADVENTURE_RULES_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {commitAdventureCombatResultV1} from '../assets/gensrpg/capture-v2/adventure-combat-commit-v1.mjs';

const fromCore=(path,name)=>{
 const context={};
 vm.runInNewContext(fs.readFileSync(new URL(path,import.meta.url),'utf8'),context);
 return context[name];
};
const coreStorage=fromCore('../assets/gensrpg/core/storage-v1.js','GensStorageV1');
const progression=fromCore('../assets/gensrpg/core/progression-v1.js','GensProgressionV1');
const cards=Object.freeze([
 {id:'real-player',name:'Héros',level:1,skills:[{state:'ready'}]},
 {id:'real-wild',name:'Sauvage',level:2,skills:[{state:'ready'}]}
]);
const timestamp='2026-11-04T08:00:00.000Z';
function fixture(){
 const map=new Map();let rejectWrite=false,writes=0;
 const storage={
  getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),
  removeItem:k=>map.delete(k)
 };
 const wrapper={
  readJson:(...args)=>coreStorage.readJson(...args),
  writeJson:(...args)=>{
   if(rejectWrite){rejectWrite=false;throw Error('storage transaction unavailable');}
   writes++;return coreStorage.writeJson(...args);
  }
 };
 const store=createAdventureStoreV1({storage,coreStorage:wrapper});
 const fresh=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'real-player',rules:DEFAULT_ADVENTURE_RULES_V1,
  ids:{sessionId:'session-game-1',instanceId:'owned-player-1'},now:timestamp
 });
 store.create({...fresh,status:'playing',world:{mapRef:'real-world',position:null}});
 return {store,storage,
  failOnce:()=>{rejectWrite=true},
  get writes(){return writes}};
}
function envelope({encounterId='encounter-1',returnToken='return-1',
  partyRef='adventure-party:session-game-1',outcome='victory',
  activeCreatureId='real-player',hp=81}={}){
 return {
  version:1,
  snapshot:{
   schema:'capture-encounter-snapshot-v1',version:1,encounterId,
   source:'terrain-random',
   player:{partyRef},
   opponents:[{creatureId:'real-wild'}],
   rules:{rulesetId:'capture.standard.1v1'},
   context:{areaId:'real-area',terrainFamilyId:'forest',elementId:'nature'},
   returnToken
  },
  returnState:{areaId:'real-area',x:20,y:40,returnUrl:'https://example.test/return'},
  result:{
   schema:'capture-combat-result-v1',version:1,
   encounterId,returnToken,outcome,
   partyState:{activeCreatureId,hp},rewards:[],
   capture:null,worldEffects:[]
  }
 };
}
function commit(store,raw=envelope(),overrides={}){
 return commitAdventureCombatResultV1({
  store,envelope:raw,bestiaryCards:cards,progressionCore:progression,
  random:()=>0.42,now:'2026-11-04T08:05:00.000Z',...overrides
 });
}
test('official Combat result is committed to real Core storage BEFORE a result may be acknowledged',()=>{
 const fx=fixture(),originalWrites=fx.writes;
 const r=commit(fx.store);
 assert.equal(r.persisted,true);
 assert.equal(r.applied,true);
 assert.equal(r.award.xp,1300);
 assert.equal(fx.store.load().party.active.xp,1300);
 assert.equal(fx.store.load().party.active.hp,81);
 assert.equal(fx.writes,originalWrites+1);
 assert.equal(fx.store.load().world.mapRef,'real-world');
 assert.equal(fx.store.load().world.position,null);
});
test('victory persists the exact fractional native HP and acknowledges it only once',()=>{
 const fx=fixture(),hp=33.47000000000003,raw=envelope({hp});
 assert.equal(commit(fx.store,raw).persisted,true);
 assert.equal(fx.store.load().party.active.hp,hp);
 const writes=fx.writes;
 assert.equal(commit(fx.store,raw).applied,false);
 assert.equal(fx.writes,writes);
});
test('repeat CombatResult is acknowledged without any second XP, loot roll or storage write',()=>{
 const fx=fixture();
 commit(fx.store);
 const writes=fx.writes;
 const duplicate=commit(fx.store,envelope(),{random:()=>{throw Error('loot rerolled')}});
 assert.equal(duplicate.persisted,true);
 assert.equal(duplicate.applied,false);
 assert.equal(fx.writes,writes);
 assert.equal(fx.store.load().party.active.xp,1300);
 const another=commit(fx.store,envelope({encounterId:'encounter-2',returnToken:'return-2'}));
 assert.equal(another.applied,true);
 assert.equal(fx.store.load().party.active.xp,2300);
});
test('storage failure never acknowledges combat, and retry after failure commits once',()=>{
 const fx=fixture();
 fx.failOnce();
 assert.throws(()=>commit(fx.store),/storage transaction unavailable/);
 assert.equal(fx.store.load().party.active.xp,0);
 assert.deepEqual(fx.store.load().processedEncounterKeys,[]);
 assert.equal(fx.storage.getItem('gensrpg.capture.combat-handoff.v1'),null,
   'the adapter may not consume an Exploration/Combat envelope');
 const retry=commit(fx.store);
 assert.equal(retry.persisted,true);
 assert.equal(fx.store.load().party.active.xp,1300);
});
test('wrong session partyRef or preview Tester party cannot award XP',()=>{
 for(const partyRef of ['capture-party-player-v1','adventure-party:other-session','']){
  const fx=fixture(),before=JSON.stringify(fx.store.load());
  assert.throws(()=>commit(fx.store,envelope({partyRef})),/partyRef|party|session/i);
  assert.equal(JSON.stringify(fx.store.load()),before);
 }
});
test('restore on defeat resets next-combat HP to native maximum; flee retains exact HP, no XP or loot',()=>{
 for(const outcome of ['defeat','fled']){
  const fx=fixture();
  const saved=commit(fx.store,envelope({outcome}));
  assert.equal(saved.award.xp,0);
  assert.equal(fx.store.load().party.active.xp,0);
  // Null is the versioned Combat-owned full-HP snapshot for policy 'restore'.
  // It is not the 81 HP of the defeated fighter and not a client-made heal.
  assert.equal(fx.store.load().party.active.hp,outcome==='defeat'?null:81);
 }
});
test('creator keep-ko policy really persists a KO without false game over or XP',()=>{
 const fx=fixture(),before=fx.store.load();
 fx.store.save({...before,rules:{...before.rules,combat:{...before.rules.combat,
  defeatPolicy:'keep-ko'}}});
 const saved=commit(fx.store,envelope({outcome:'defeat',hp:0}));
 assert.equal(saved.award.xp,0);
 assert.equal(fx.store.load().party.active.hp,0);
 assert.equal(fx.store.load().status,'playing');
});
test('missing or untrusted combat result must fail before touching storage or guessing a win',()=>{
 for(const bad of [
  {...envelope(),result:null},
  {...envelope(),result:{...envelope().result,outcome:'teleport'}},
  {...envelope(),result:{...envelope().result,returnToken:'other-token'}},
  {...envelope(),result:{...envelope().result,partyState:{activeCreatureId:'other',hp:40}}}
 ]){
  const fx=fixture();const before=JSON.stringify(fx.store.load());
  assert.throws(()=>commit(fx.store,bad));
  assert.equal(JSON.stringify(fx.store.load()),before);
 }
});


test('reject a different owned instance even when its species matches',()=>{
 const fx=fixture();
 const raw=envelope();
 raw.result.partyState.activeInstanceId='different-owned-instance';
 assert.throws(()=>commit(fx.store,raw),/instance/i);
 assert.equal(fx.store.load().party.active.xp,0);
 assert.deepEqual(fx.store.load().processedEncounterKeys,[]);
});
