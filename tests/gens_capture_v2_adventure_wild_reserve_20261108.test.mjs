import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
 createAdventureSessionV1,applyAdventureCombatResultV1,
 createAdventureStoreV1,recoverAdventureDefeatedPartyV1,
 DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventurePlayingPartyV1}
 from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1}
 from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';
const source={};
vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8'),source);
const progressionCore=source.GensProgressionV1;
const combatSha='a'.repeat(40),date='2026-11-08T12:00:00Z';
const cards=['a','b','enemy'].map(id=>({id,name:id,level:1,skills:[{state:'ready'}]}));
function session(species=['a','b','a'],rules=DEFAULT_ADVENTURE_RULES_V1){
 const base=createAdventureSessionV1({bestiaryCards:cards,starterId:species[0],starterIds:species,
  rules,ids:{sessionId:'game-1',instanceId:'owned-1',creatorId:'creator-1',
   reserveInstanceIds:species.slice(1).map((_,i)=>'owned-'+(i+2))},now:date});
 return {...base,status:'playing',world:{mapRef:'world-1',position:null}};
}
function context(s){
 const entries=new Map(),storage={getItem:k=>entries.get(k)??null,
  setItem:(k,v)=>entries.set(k,v)};
 const world={id:'world-1',areas:[{id:'zone-1'}]};
 const publicationGrant=writeAdventurePublishedEncounterGrantV1({
  storage,session:s,world,bestiaryCards:cards,combatSha
 });
 return {storage,session:s,world,publicationGrant,combatSha};
}
function native(outcome,members,encounterId='wild-1'){
 return {version:1,snapshot:{schema:'capture-encounter-snapshot-v1',version:1,
  encounterId,returnToken:'return-1',opponents:[{creatureId:'enemy'}]},
 result:{schema:'capture-combat-result-v1',version:1,encounterId,
  returnToken:'return-1',outcome,rewards:[],partyState:{
    activeCreatureId:'a',activeInstanceId:'owned-1',hp:0,
    members:members.map(([instanceId,speciesId,hp])=>({instanceId,speciesId,hp}))
  }}};
}
const commit=(s,e)=>applyAdventureCombatResultV1({session:s,envelope:e,
 bestiaryCards:cards,progressionCore,random:()=>0.5,now:date});
test('grant is the read-only canonical full party including six, duplicate species and individual stats',()=>{
 const s=session(['a','b','a','b','a','b']);
 const original=JSON.stringify(s),x=context(s);
 const result=writeAdventurePlayingPartyV1(x);
 assert.equal(result.active.instanceId,'owned-1');
 assert.deepEqual(result.reserve.map(v=>v.instanceId),
  ['owned-2','owned-3','owned-4','owned-5','owned-6']);
 assert.deepEqual(result.reserve.map(v=>v.speciesId),['b','a','b','a','b']);
 assert.ok(Object.isFrozen(result.reserve));
 assert.equal(JSON.stringify(s),original);
 assert.deepEqual(JSON.parse(x.storage.getItem('gensrpg.capture.v2.active-party.v1:game-1')),result);
});
test('wild victory with active KO and living reserve commits ALL HP, preserves XP once, promotes owned member',()=>{
 const s=session();
 const e=native('victory',[['owned-1','a',0],['owned-2','b',17],['owned-3','a',0]]);
 const result=commit(s,e);
 assert.equal(result.applied,true);
 assert.equal(result.session.status,'playing');
 assert.equal(result.session.party.active.instanceId,'owned-2');
 assert.equal(result.session.party.active.hp,17);
 assert.deepEqual(result.session.party.reserve.map(x=>[x.instanceId,x.hp]),
  [['owned-1',0],['owned-3',0]]);
 assert.equal(result.session.party.reserve[0].xp,result.award.xp,'original combat participant gets official XP');
 assert.equal(result.session.party.active.xp,0,'no duplicate XP to the replacement');
 assert.equal(commit(result.session,e).applied,false,'same CombatResult cannot award twice');
 assert.equal(s.party.active.hp,null,'input save untouched');
});
test('native KO does not revive anyone; team defeat applies only the configured creator policy',()=>{
 const keep=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  combat:{hpMultiplier:0.25,defeatPolicy:'keep-ko'}});
 const e=native('defeat',[['owned-1','a',0],['owned-2','b',0],['owned-3','a',0]]);
 const x=commit(session(['a','b','a'],keep),e);
 assert.equal(x.session.status,'playing');
 assert.equal(x.session.party.active.hp,0);
 assert.deepEqual(x.session.party.reserve.map(m=>m.hp),[0,0]);
 const over=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  combat:{hpMultiplier:0.25,defeatPolicy:'game-over'}});
 assert.equal(commit(session(['a','b','a'],over),e).session.status,'finished');
 const restored=commit(session(),e);
 assert.equal(restored.session.party.active.hp,null);
 assert.deepEqual(restored.session.party.reserve.map(m=>m.hp),[null,null],
  'Every member of the defeated party must recover under the creator restore policy');
});
test('native result validates all member IDs/species/HP with no partial save mutation',()=>{
 const s=session(),correct=[['owned-1','a',0],['owned-2','b',9],['owned-3','a',2]];
 const invalid=[
 [['owned-1','a',0],['owned-2','b',9]],
 [['owned-1','a',0],['owned-1','b',9],['owned-3','a',2]],
 [['owned-1','a',0],['owned-2','a',9],['owned-3','a',2]],
 [['owned-1','a',0],['owned-2','b',-1],['owned-3','a',2]],
 [['owned-1','a',0],['owned-2','b',NaN],['owned-3','a',2]],
 [['owned-1','a',0],['owned-2','b',9],['owned-4','a',2]]
 ];
 for(const members of invalid)assert.throws(()=>commit(s,native('victory',members)));
 assert.throws(()=>commit(s,native('defeat',correct)),/conflict|defeat/i);
 assert.equal(s.processedEncounterKeys.length,0);
 assert.equal(s.party.active.hp,null);
});
test('legacy one-creature grant/result unchanged, no empty reserve field added',()=>{
 const s=session(['a']);const grant=writeAdventurePlayingPartyV1(context(s));
 assert.equal(Object.hasOwn(grant,'reserve'),false);
 const e=native('victory',[['owned-1','a',15]]);
 delete e.result.partyState.members;
 e.result.partyState.hp=15;
 const result=commit(s,e);
 assert.equal(result.session.party.active.hp,15);
 assert.equal(result.award.outcome,'victory');
});

test('six wounded/KO party members recover under the creator rule and persist after save/reload',()=>{
 const members=[['owned-1','a',0],['owned-2','b',0],['owned-3','a',0],
  ['owned-4','b',0],['owned-5','a',0],['owned-6','b',0]];
 const before=session(['a','b','a','b','a','b']);
 const recovered=commit(before,native('defeat',members,'wild-six'));
 assert.deepEqual([recovered.session.party.active,...recovered.session.party.reserve]
  .map(m=>m.hp),[null,null,null,null,null,null]);
 assert.deepEqual([recovered.session.party.active,...recovered.session.party.reserve]
  .map(m=>m.instanceId),members.map(m=>m[0]),
  'Keep saved party order and identity');
 assert.equal(recovered.session.rules.combat.hpMultiplier,0.25,
  'Null HP is projected back to full game HP via official Combat at 25 %');
 const services={};
 vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8'),services);
 const values=new Map(),storage={
  getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,v),
  removeItem:k=>values.delete(k)
 };
 const store=createAdventureStoreV1({storage,coreStorage:services.GensStorageV1,
  key:'gensrpg.capture.v2.adventure.slot.v1:recovery-check'});
 store.create(before);
 store.save(recovered.session);
 assert.deepEqual([store.load().party.active,...store.load().party.reserve]
  .map(m=>m.hp),Array(6).fill(null));
 assert.equal(commit(store.load(),native('defeat',members,'wild-six')).applied,false,
  'No duplicate post-combat reward/recovery from replay');
 const oldSave={...recovered.session,party:{...recovered.session.party,
  reserve:recovered.session.party.reserve.map((m,i)=>({...m,hp:i%2===0?0:11}))}};
 const repaired=recoverAdventureDefeatedPartyV1({session:oldSave,now:date});
 assert.deepEqual(repaired.party.reserve.map(m=>m.hp),Array(5).fill(null),
  'Both injured and KO reserves must recover after a real defeat');
 assert.equal(before.party.active.hp,null,'Input session and original creature remain immutable');
});
