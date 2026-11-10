import './gens_capture_v2_fragments_contract_20261110.test.mjs'; // Fragment contract regression joins the existing source CI gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
 ADVENTURE_RULES_SCHEMA_V1, ADVENTURE_SAVE_SCHEMA_V1, DEFAULT_ADVENTURE_RULES_V1,
 normalizeAdventureRulesV1, calculateAdventureXpV1, publishedAdventureSpeciesV1,
 createAdventureSessionV1, applyAdventureCombatResultV1, createAdventureStoreV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const createCore=(path,key)=>{const context={};vm.runInNewContext(
 fs.readFileSync(new URL(path,import.meta.url),'utf8'),context);
 return context[key];};
const progression=createCore('../assets/gensrpg/core/progression-v1.js','GensProgressionV1');
const storageCore=createCore('../assets/gensrpg/core/storage-v1.js','GensStorageV1');
const image={assetId:'pack:official',file:'capture/creatures/published.webp'};
const published=Object.freeze([
 Object.freeze({id:'crea_nat_1',name:'Grainou',level:1,portrait:image,icon:image,
  skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]}),
 Object.freeze({id:'crea_dracendre',name:'Dracendre',level:2,portrait:image,icon:image,
  skills:[{slot:'slot-1',state:'ready',name:'Braise'}]}),
 Object.freeze({id:'crea_mossback',name:'Moussados',level:1,portrait:image,icon:image,
  skills:[{slot:'slot-1',state:'unpublished'}]})
]);

const ids=()=>({sessionId:'session-test-1',instanceId:'owned-instance-test-1'});
const time=()=>new Date('2026-11-03T08:00:00.000Z').toISOString();
const newGame=(starter='crea_nat_1',rules=DEFAULT_ADVENTURE_RULES_V1)=>
 createAdventureSessionV1({bestiaryCards:published,starterId:starter,rules,ids:ids(),now:time()});
const combatEnvelope=({enemy='crea_dracendre',outcome='victory',encounterId='real-encounter-1'}={})=>({
 version:1,
 snapshot:{schema:'capture-encounter-snapshot-v1',version:1,encounterId,
  returnToken:'return-correlated-1',opponents:[{creatureId:enemy}]},
 result:{schema:'capture-combat-result-v1',version:1,encounterId,
  returnToken:'return-correlated-1',outcome,
  partyState:{activeCreatureId:'crea_nat_1',hp:85},rewards:[]}
});

test('editable Adventure rules are versioned and validated, without a second combat/stats engine',()=>{
 const r=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(r.schema,ADVENTURE_RULES_SCHEMA_V1);
 assert.equal(r.xp.baseVictoryXp,1000);
 assert.equal(r.xp.higherEnemyBonusPercent,30);
 assert.equal(r.xp.higherAllyPenaltyPercent,30);
 assert.equal(r.xp.distribution,'active');
 assert.equal(r.progression.xpCurveMode,'linear');
 assert.equal(r.progression.xpPerLevel,1000);
 assert.equal(r.loot.currencyPerVictory,0);
 assert.deepEqual(r.loot.drops,[]);
 assert.throws(()=>normalizeAdventureRulesV1({...r,unknown:1}),/unknown|inconnue/i);
 assert.throws(()=>normalizeAdventureRulesV1({...r,xp:{...r.xp,baseVictoryXp:-1}}),/baseVictoryXp/);
 assert.throws(()=>normalizeAdventureRulesV1({...r,progression:{...r.progression,xpPerLevel:0}}),/xpPerLevel/);
});
test('XP follows 1000 equal-level, +30% per higher enemy, -30% per stronger ally, no hidden fixed value',()=>{
 const rule=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(calculateAdventureXpV1({rules:rule,allyLevel:1,enemyLevel:1}).xp,1000);
 assert.equal(calculateAdventureXpV1({rules:rule,allyLevel:1,enemyLevel:2}).xp,1300);
 assert.equal(calculateAdventureXpV1({rules:rule,allyLevel:2,enemyLevel:1}).xp,700);
 assert.equal(calculateAdventureXpV1({rules:rule,allyLevel:3,enemyLevel:1}).xp,490);
 const custom=normalizeAdventureRulesV1({...rule,xp:{...rule.xp,baseVictoryXp:200,globalMultiplier:1.5}});
 assert.equal(calculateAdventureXpV1({rules:custom,allyLevel:1,enemyLevel:1}).xp,300);
});
test('published Bestiary is the only species authority, not all authored or unfinished drafts',()=>{
 assert.deepEqual(publishedAdventureSpeciesV1(published).map(c=>c.id),
  ['crea_nat_1','crea_dracendre','crea_mossback']);
 assert.throws(()=>newGame('draft-not-published'),/bestiaire|publi/i);
 const saved=newGame();
 assert.equal(saved.schema,ADVENTURE_SAVE_SCHEMA_V1);
 assert.equal(saved.party.active.speciesId,'crea_nat_1');
 assert.equal(saved.party.active.instanceId,'owned-instance-test-1');
 assert.equal(saved.party.active.level,1);
 assert.equal(saved.party.active.xp,0);
 assert.equal(saved.world.position,null);
 assert.throws(()=>newGame('crea_mossback'),/compétence|jouable/i);
});
test('only official CombatResult + correlated Exploration snapshot awards XP once and Core owns XP→level',()=>{
 const state=newGame();
 const envelope=combatEnvelope();
 const first=applyAdventureCombatResultV1({
  session:state,envelope,bestiaryCards:published,progressionCore:progression,random:()=>0.5,
  now:'2026-11-03T08:05:00.000Z'
 });
 assert.equal(first.session.party.active.xp,1300);
 assert.equal(first.session.party.active.level,2);
 assert.equal(first.award.xp,1300);
 assert.equal(first.award.levelBefore,1);
 assert.equal(first.award.levelAfter,2);
 assert.equal(first.session.party.active.hp,85);
 assert.deepEqual(first.session.inventory,{currency:0,items:{}});
 const repeat=applyAdventureCombatResultV1({
  session:first.session,envelope,bestiaryCards:published,progressionCore:progression,random:()=>0.5
 });
 assert.equal(repeat.applied,false);
 assert.equal(repeat.session.party.active.xp,1300);
 assert.throws(()=>applyAdventureCombatResultV1({
  session:state,envelope:combatEnvelope({enemy:'unpublished'}),bestiaryCards:published,
  progressionCore:progression,random:()=>0.5
 }),/bestiaire|publi/i);
});
test('defeat/flee give no XP or loot and incorrect correlation is rejected',()=>{
 const state=newGame();
 for(const outcome of ['defeat','fled']){
  const x=applyAdventureCombatResultV1({session:state,envelope:combatEnvelope({outcome}),
   bestiaryCards:published,progressionCore:progression,random:()=>0.5});
  assert.equal(x.award.xp,0);assert.equal(x.session.party.active.level,1);
 }
 const wrong=combatEnvelope();
 wrong.result.returnToken='different';
 assert.throws(()=>applyAdventureCombatResultV1({session:state,envelope:wrong,
   bestiaryCards:published,progressionCore:progression,random:()=>0.5}),/returnToken|corrél/i);
});
test('configurable species-specific loot uses declared items, deterministic injected roll, no duplicate award',()=>{
 const rule=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  loot:{currencyPerVictory:4,items:[{id:'plume',name:'Plume',saleValue:7}],
   drops:[{speciesId:'crea_dracendre',itemId:'plume',chancePercent:50,minQuantity:1,maxQuantity:2}]}
 });
 const state=newGame('crea_nat_1',rule);
 let draw=0;
 const x=applyAdventureCombatResultV1({session:state,envelope:combatEnvelope(),
  bestiaryCards:published,progressionCore:progression,
  random:()=>++draw===1?0.1:0.95});
 assert.equal(x.session.inventory.currency,4);
 assert.equal(x.session.inventory.items.plume,2);
 assert.equal(x.award.drops[0].itemId,'plume');
 assert.throws(()=>normalizeAdventureRulesV1({...rule,loot:{...rule.loot,
  drops:[{speciesId:'crea_dracendre',itemId:'unregistered',chancePercent:20,minQuantity:1,maxQuantity:1}]} }),/itemId|inconnu/i);
});
test('the existing injected Core Storage persists the saved adventure and refuses overwrite/corruption',()=>{
 const data=new Map(),adapter={
  getItem:key=>data.get(key)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)
 };
 const store=createAdventureStoreV1({storage:adapter,coreStorage:storageCore});
 assert.equal(store.load(),null);
 const state=newGame();
 store.create(state);
 assert.deepEqual(store.load(),state);
 assert.throws(()=>store.create(state),/existe|existing|remplacer/i);
 data.set(store.key,'{broken');
 assert.throws(()=>store.load(),/invalide|corrompue|invalid/i);
});
