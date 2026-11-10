// Contract test: official Monster Capture AdventureSession + existing Core, no mock game runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {
 DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1,
 createAdventureSessionV1,createAdventureStoreV1,
 applyAdventureCombatResultV1,
 normalizeAdventureRulesV1,awardAdventureSpeciesFragmentsV1,
 summonAdventureCreatureWithFragmentsV1,grantAdventureCreatureFragmentXpV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventureFragmentItemIdV1,normalizeAdventureFragmentRulesV1}
 from '../assets/gensrpg/capture-v2/adventure-fragments-v1.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={};
runInNewContext(readFileSync(resolve(root,'assets/gensrpg/core/progression-v1.js'),'utf8'),ctx);
const progressionCore=ctx.GensProgressionV1; // Real unchanged official Core
const cards=[
 {id:'gorice',name:'Gorice',level:1,skills:[{state:'ready'}]},
 {id:'gemmor',name:'Gemmor',level:1,skills:[{state:'ready'}]},
 {id:'ailevent',name:'Ailevent',level:1,skills:[{state:'ready'}]}
];
let seq=0;
const now='2026-11-10T09:00:00.000Z';
const session=(rules=SHOWCASE_ADVENTURE_RULES_V1,team=['gorice'])=>{
 seq++;
 const created=createAdventureSessionV1({
  bestiaryCards:cards,starterId:team[0],starterIds:team,rules,
  ids:{sessionId:'world'+seq,instanceId:'first'+seq,
   reserveInstanceIds:team.slice(1).map((_,i)=>'bench'+seq+'-'+i)},
  now
 });
 return {...created,status:'playing'};
};
const grant=(s,speciesId,quantity,actionId)=>awardAdventureSpeciesFragmentsV1({
 session:s,bestiaryCards:cards,speciesId,quantity,actionId,now
});
const summon=(s,speciesId,actionId,instanceId,destination='auto')=>
 summonAdventureCreatureWithFragmentsV1({
  session:s,bestiaryCards:cards,speciesId,actionId,instanceId,destination,
  progressionCore,now
 });
const xp=(s,speciesId,actionId,instanceId,quantity)=>
 grantAdventureCreatureFragmentXpV1({
  session:s,bestiaryCards:cards,speciesId,actionId,instanceId,quantity,
  progressionCore,now
 });
const count=(s,id)=>s.inventory.items[adventureFragmentItemIdV1(id)]??0;

test('previously saved games preserve exact old rules and reject hidden fragment grants',()=>{
 const old=session(DEFAULT_ADVENTURE_RULES_V1);
 assert.deepEqual(normalizeAdventureRulesV1(old.rules),normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1));
 assert.equal(Object.hasOwn(old.rules,'fragmentRecruitment'),false);
 assert.throws(()=>grant(old,'gemmor',10,'old-award'),/disabled/);
 assert.deepEqual(old.inventory.items,{});
 assert.equal(Object.hasOwn(old,'storedCreatures'),false);
});
test('ten canonical fragments summon an official level 1 creature into the battle team',()=>{
 const before=session();
 const result=grant(before,'gemmor',10,'drop-first');
 assert.equal(result.applied,true);
 assert.equal(count(result.session,'gemmor'),10);
 assert.equal(count(before,'gemmor'),0);
 assert.equal(grant(result.session,'gemmor',10,'drop-first').applied,false);
 const invoked=summon(result.session,'gemmor','summon-1','instance-new');
 assert.equal(invoked.applied,true);
 assert.equal(invoked.creature.level,1);
 assert.equal(invoked.creature.xp,0);
 assert.equal(invoked.destination,'party');
 assert.equal(invoked.session.party.reserve.at(-1).instanceId,'instance-new');
 assert.equal(count(invoked.session,'gemmor'),0);
 assert.equal(summon(invoked.session,'gemmor','summon-1','instance-new').applied,false);
 assert.equal(count(result.session,'gemmor'),10,'prior immutable state unchanged');
});
test('the storage reserve is NOT party.reserve and never becomes a combat participant',()=>{
 let s=grant(session(),'ailevent',10,'loot').session;
 const result=summon(s,'ailevent','summon-storage','storage-01','storage');
 assert.equal(result.session.storedCreatures.length,1);
 assert.equal(result.session.party.reserve.length,0);
 assert.equal(result.session.storedCreatures[0].level,1);
 assert.equal(count(result.session,'ailevent'),0);
});
test('explicit fragment XP targets exactly one owned instance and preserves KO',()=>{
 let s=grant(session(),'gemmor',10,'initial').session;
 s=summon(s,'gemmor','summon','stored-1','storage').session;
 s={...s,storedCreatures:s.storedCreatures.map(v=>({...v,hp:0}))};
 s=grant(s,'gemmor',4,'more').session;
 assert.throws(()=>xp(s,'ailevent','wrong','stored-1',2),/enough|Target/);
 assert.throws(()=>xp(s,'gemmor','wrongid','nonexistent',2),/Target/);
 assert.equal(count(s,'gemmor'),4);
 const result=xp(s,'gemmor','convert','stored-1',3);
 assert.equal(result.xpGained,300);
 assert.equal(result.session.storedCreatures[0].xp,300);
 assert.equal(result.session.storedCreatures[0].hp,0);
 assert.equal(result.session.party.active.xp,0);
 assert.equal(count(result.session,'gemmor'),1);
 assert.equal(xp(result.session,'gemmor','convert','stored-1',3).applied,false);
});
test('custom threshold and level are derived by Core, not a second XP formula',()=>{
 const rules=structuredClone(SHOWCASE_ADVENTURE_RULES_V1);
 rules.fragmentRecruitment.perSpecies.gemmor={
  required:5,summonLevel:3,xpPerFragment:42};
 let s=grant(session(rules),'gemmor',5,'drop').session;
 const result=summon(s,'gemmor','summon','custom-member');
 assert.equal(result.fragmentsSpent,5);
 assert.equal(result.creature.level,3);
 assert.equal(progressionCore.levelFromXp(result.creature.xp,{
  xpCurveMode:'custom',xpPerLevel:2000,maxLevel:100
 }),3);
 assert.equal(count(result.session,'gemmor'),0);
});
test('full battle team, full storage, duplicates, invalid IDs all reject before spending',()=>{
 const rules=structuredClone(SHOWCASE_ADVENTURE_RULES_V1);
 rules.fragmentRecruitment.storageCapacity=0;
 let s=grant(session(rules,
  ['gorice','gemmor','ailevent','gorice','gemmor','ailevent']),'ailevent',10,'drop').session;
 assert.throws(()=>summon(s,'ailevent','full','extra'),/storage full/i);
 assert.equal(count(s,'ailevent'),10);
 assert.throws(()=>summon(s,'ailevent','full-party','extra','party'),/party is full/i);
 assert.equal(count(s,'ailevent'),10);
 assert.throws(()=>summon(s,'ailevent','bad-id',s.party.active.instanceId),/already exists/);
 assert.equal(count(s,'ailevent'),10);
 const noDuplicates=structuredClone(SHOWCASE_ADVENTURE_RULES_V1);
 noDuplicates.fragmentRecruitment.allowDuplicates=false;
 s=grant(session(noDuplicates),'gorice',10,'award').session;
 assert.throws(()=>summon(s,'gorice','duplicate','new'),/forbids duplicate/);
 assert.equal(count(s,'gorice'),10);
});
test('invalid official species, insufficient balance and illegal configurations are rejected',()=>{
 const s=session();
 assert.throws(()=>grant(s,'unknown',10,'unknown'),/published Bestiary/);
 assert.throws(()=>summon(s,'gemmor','empty','new'),/Not enough/);
 assert.throws(()=>normalizeAdventureFragmentRulesV1({required:0}),/required/);
 assert.throws(()=>normalizeAdventureFragmentRulesV1({
  perSpecies:{gemmor:{dropMin:5,dropMax:1}}
 }),/maximum/);
});
test('same Core persistence keeps storage and inventory isolated per saved world',()=>{
 const s=grant(session(),'gemmor',10,'world-a-drop').session;
 const {storage,coreStorage}=(()=>{
  const map=new Map();
  const storage={getItem:key=>map.get(key)??null,
   setItem:(key,value)=>map.set(key,String(value))};
  return {storage,coreStorage:{
   readJson:(storage,key,fallback)=>storage.getItem(key)===null?fallback:
    JSON.parse(storage.getItem(key)),
   writeJson:(storage,key,value)=>storage.setItem(key,JSON.stringify(value))
  }};
 })();
 const store=createAdventureStoreV1({storage,coreStorage});
 store.create(s);
 let stored=summon(store.load(),'gemmor','from-save','storage-member','storage').session;
 store.save(stored);
 assert.equal(store.load().storedCreatures[0].instanceId,'storage-member');
 assert.equal(count(store.load(),'gemmor'),0);
 assert.equal(count(s,'gemmor'),10);
 assert.equal(count(session(),'gemmor'),0);
});

test('official native CombatResult grants one species fragment after victory and never re-rolls',()=>{
 const original=session();
 const envelope={
  version:1,
  snapshot:{schema:'capture-encounter-snapshot-v1',version:1,
   encounterId:'encounter-frag-1',returnToken:'return-frag-1',
   opponents:[{creatureId:'gemmor'}]},
  result:{schema:'capture-combat-result-v1',version:1,
   encounterId:'encounter-frag-1',returnToken:'return-frag-1',
   outcome:'victory',partyState:{activeCreatureId:'gorice',hp:10},rewards:[]}
 };
 const first=applyAdventureCombatResultV1({
  session:original,envelope,bestiaryCards:cards,
  progressionCore,random:()=>0.1,now
 });
 assert.equal(first.applied,true);
 assert.equal(count(first.session,'gemmor'),1);
 assert.equal(first.award.drops.length,1);
 assert.deepEqual({...first.award.drops[0]},
  {itemId:adventureFragmentItemIdV1('gemmor'),quantity:1});
 const unchanged=applyAdventureCombatResultV1({
  session:first.session,envelope,bestiaryCards:cards,progressionCore,
  random:()=>{throw new Error('duplicate draw')},now
 });
 assert.equal(unchanged.applied,false);
 assert.equal(count(unchanged.session,'gemmor'),1);
 assert.equal(first.session.processedEncounterKeys.length,1);
 assert.equal(count(original,'gemmor'),0);
});
test('custom native chance and species quantity override apply only to victory',()=>{
 const rules=structuredClone(SHOWCASE_ADVENTURE_RULES_V1);
 rules.fragmentRecruitment.dropChancePercent=0;
 rules.fragmentRecruitment.perSpecies.gemmor={
  dropChancePercent:80,dropMin:2,dropMax:4
 };
 const initial=session(rules);
 const event=(outcome,id)=>({
  version:1,
  snapshot:{schema:'capture-encounter-snapshot-v1',version:1,
   encounterId:id,returnToken:id+'-return',opponents:[{creatureId:'gemmor'}]},
  result:{schema:'capture-combat-result-v1',version:1,encounterId:id,
   returnToken:id+'-return',outcome,
   partyState:{activeCreatureId:'gorice',hp:18},rewards:[]}
 });
 for(const outcome of ['fled','defeat']){
  const got=applyAdventureCombatResultV1({
   session:initial,envelope:event(outcome,'no-'+outcome),
   bestiaryCards:cards,progressionCore,random:()=>0,now
  });
  assert.equal(count(got.session,'gemmor'),0);
 }
 const missed=applyAdventureCombatResultV1({
  session:initial,envelope:event('victory','miss'),
  bestiaryCards:cards,progressionCore,random:()=>0.9,now
 });
 assert.equal(count(missed.session,'gemmor'),0);
 const won=applyAdventureCombatResultV1({
  session:initial,envelope:event('victory','hit'),
  bestiaryCards:cards,progressionCore,
  random:(()=>{let n=0;return ()=>++n===1?0.1:0.99})(),now
 });
 assert.equal(count(won.session,'gemmor'),4);
 assert.equal(won.award.drops[0].quantity,4);
});
test('XP at level cap and a disabled XP policy preserve fragment balance',()=>{
 const normal=structuredClone(SHOWCASE_ADVENTURE_RULES_V1);
 const atCap=session(normal);
 const max=atCap.rules.progression.maxLevel;
 const capped={...atCap,party:{...atCap.party,
  active:{...atCap.party.active,level:max,xp:1000000}}};
 const saved=grant(capped,'gorice',2,'cap-drop').session;
 assert.throws(()=>xp(saved,'gorice','cap-convert',saved.party.active.instanceId,1),
  /maximum level/);
 assert.equal(count(saved,'gorice'),2);
 normal.fragmentRecruitment.xpPerFragment=0;
 const zero=grant(session(normal),'gorice',1,'zero-drop').session;
 assert.throws(()=>xp(zero,'gorice','zero-convert',zero.party.active.instanceId,1),
  /disabled/);
 assert.equal(count(zero,'gorice'),1);
});
