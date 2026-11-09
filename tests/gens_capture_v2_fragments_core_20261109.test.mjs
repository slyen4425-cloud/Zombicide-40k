import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
 DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1,
 normalizeAdventureRulesV1,createAdventureSessionV1,
 applyAdventureCombatResultV1,createAdventureStoreV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {fragmentItemIdV1,speciesFromFragmentItemV1,
 normalizeAdventureRecruitmentV1,adventureFragmentSettingsV1}
 from '../assets/gensrpg/capture-v2/adventure-fragment-policy-v1.mjs';
import {redeemAdventureFragmentsV1}
 from '../assets/gensrpg/capture-v2/adventure-fragment-transaction-v1.mjs';

const source={};
vm.runInNewContext(fs.readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8'),source);
const progressionCore=source.GensProgressionV1;
const date='2026-11-09T21:30:00Z';
const icon={assetId:'official.icon',file:'capture/library/official-icon.webp'};
const cards=['leaf','enemy'].map(id=>({
 id,name:id,level:1,icon,portrait:icon,skills:[{state:'ready'}]
}));
function game(starters=['leaf'],rules=SHOWCASE_ADVENTURE_RULES_V1){
 const s=createAdventureSessionV1({bestiaryCards:cards,starterId:starters[0],
  starterIds:starters,rules,ids:{
   sessionId:'save1',instanceId:'owned1',creatorId:'creator1',
   reserveInstanceIds:starters.slice(1).map((_,i)=>'owned'+(i+2))
  },now:date});
 return {...s,status:'playing'};
}
function fight({enemy='enemy',outcome='victory',encounter='fight1'}={}){
 return {version:1,snapshot:{
  schema:'capture-encounter-snapshot-v1',version:1,encounterId:encounter,
  returnToken:'return1',opponents:[{creatureId:enemy}]
 },result:{
  schema:'capture-combat-result-v1',version:1,encounterId:encounter,
  returnToken:'return1',outcome,partyState:{activeCreatureId:'leaf',hp:30},rewards:[]
 }};
}
function awarded(session,envelope=fight(),random=()=>0.5){
 return applyAdventureCombatResultV1({session,envelope,bestiaryCards:cards,
  progressionCore,random,now:date});
}
function withFragments(session,speciesId,quantity){
 return {...session,inventory:{...session.inventory,items:{
  ...session.inventory.items,[fragmentItemIdV1(speciesId)]:quantity
 }}};
}
function redeem(session,speciesId,action,extra={}){
 return redeemAdventureFragmentsV1({session,bestiaryCards:cards,speciesId,
  action,progressionCore,now:date,...extra});
}
test('historical saves remain opt-out; Showcase defaults to 10 and creator can override per species',()=>{
 assert.equal(normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1).recruitment,undefined);
 const old=game(['leaf'],DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(old.collection,undefined);
 assert.equal(awarded(old).session.inventory.items['fragment:enemy'],undefined);
 assert.throws(()=>redeem(old,'enemy','invoke',{newInstanceId:'newone'}),/désactivés/);
 const rules=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
 assert.equal(rules.recruitment.fragments.required,10);
 assert.equal(adventureFragmentSettingsV1(rules,'enemy').xpPerFragment,200);
 const custom=normalizeAdventureRulesV1({...rules,recruitment:{
  ...rules.recruitment,fragments:{...rules.recruitment.fragments,
   speciesOverrides:{enemy:{required:6,xpPerFragment:350}}}
 }});
 assert.equal(adventureFragmentSettingsV1(custom,'enemy').required,6);
 assert.equal(adventureFragmentSettingsV1(custom,'leaf').required,10);
 assert.throws(()=>normalizeAdventureRecruitmentV1({...rules.recruitment,
  fragments:{...rules.recruitment.fragments,required:0}}),/required/);
 assert.throws(()=>normalizeAdventureRulesV1({...rules,
  loot:{...rules.loot,items:[{id:'fragment:enemy',name:'Fake',saleValue:1}]}}),
  /reserved/);
 assert.equal(speciesFromFragmentItemV1('fragment:enemy'),'enemy');
 assert.equal(speciesFromFragmentItemV1('potion'),null);
});
test('real CombatResult grants species fragment once and never on flee/defeat',()=>{
 const s=game();
 const first=awarded(s);
 assert.equal(first.session.inventory.items['fragment:enemy'],1);
 assert.deepEqual(first.award.drops,[{itemId:'fragment:enemy',quantity:1}]);
 assert.equal(awarded(first.session).applied,false);
 assert.equal(awarded(first.session).session.inventory.items['fragment:enemy'],1);
 for(const outcome of ['defeat','fled'])
  assert.equal(awarded(s,fight({outcome})).session.inventory.items['fragment:enemy'],undefined);
 assert.equal(s.inventory.items['fragment:enemy'],undefined,'input state untouched');
});
test('fragment policy honors chance and quantities without shadow loot catalogue',()=>{
 const settings=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  recruitment:{...SHOWCASE_ADVENTURE_RULES_V1.recruitment,fragments:{
   ...SHOWCASE_ADVENTURE_RULES_V1.recruitment.fragments,
   dropChancePercent:45,minQuantity:2,maxQuantity:4
  }}});
 assert.equal(awarded(game(['leaf'],settings),fight(),()=>0.9).award.drops.length,0);
 const x=awarded(game(['leaf'],settings),fight(),()=>0.1);
 assert.equal(x.session.inventory.items['fragment:enemy'],2);
 assert.throws(()=>awarded(game(['leaf'],settings),fight(),()=>1),/Random adapter/);
});
test('XP conversion chooses exact owned same-species instance and Core official level rules',()=>{
 const start=withFragments(game(['leaf','leaf']),'leaf',15),before=JSON.stringify(start);
 const x=redeem(start,'leaf','xp',{quantity:10,instanceId:'owned2'});
 assert.equal(x.spent,10);
 assert.equal(x.xpGained,2000);
 assert.equal(x.session.inventory.items['fragment:leaf'],5);
 assert.equal(x.session.party.active.xp,0);
 assert.equal(x.session.party.reserve[0].xp,2000);
 assert.equal(x.session.party.reserve[0].level,2);
 assert.equal(JSON.stringify(start),before);
 assert.throws(()=>redeem(start,'enemy','xp',{quantity:1,instanceId:'owned2'}),/Fragments insuffisants|espèce/);
 assert.throws(()=>redeem(start,'leaf','xp',{quantity:20,instanceId:'owned2'}),/insuffisants/);
 assert.throws(()=>redeem(start,'leaf','xp',{quantity:1,instanceId:'unknown'}),/instance/);
});
test('invocation creates a real instance only in storage, never in combat party.reserve',()=>{
 const before=withFragments(game(),'enemy',10);
 const x=redeem(before,'enemy','invoke',{newInstanceId:'stored1'});
 assert.equal(x.spent,10);
 assert.equal(x.session.inventory.items['fragment:enemy'],undefined);
 assert.equal(x.session.collection.stored.length,1);
 assert.deepEqual(x.session.collection.stored[0],{
  instanceId:'stored1',speciesId:'enemy',level:1,xp:0,hp:null,statAllocations:{}
 });
 assert.deepEqual(x.session.party,before.party,'combat bench stays exactly unchanged');
 assert.equal(before.collection.stored.length,0);
 const stocked=withFragments(x.session,'enemy',3);
 const gained=redeem(stocked,'enemy','xp',{quantity:3,instanceId:'stored1'});
 assert.equal(gained.session.collection.stored[0].xp,600);
 assert.deepEqual(gained.session.party,x.session.party);
});
test('storage full, duplicate ID, wrong species and level cap reject without spending',()=>{
 const s=withFragments(game(),'enemy',10);
 assert.throws(()=>redeem(s,'enemy','invoke',{newInstanceId:'owned1'}),/utilisé/);
 const one=redeem(s,'enemy','invoke',{newInstanceId:'stored1'}).session;
 const small=normalizeAdventureRulesV1({...one.rules,recruitment:{
  ...one.rules.recruitment,storageCapacity:1
 }});
 const blocked=withFragments({...one,rules:small},'enemy',10);
 assert.throws(()=>redeem(blocked,'enemy','invoke',{newInstanceId:'stored2'}),/pleine/);
 assert.equal(blocked.inventory.items['fragment:enemy'],10);
 const atCap=withFragments({...s,party:{...s.party,
  active:{...s.party.active,level:100,xp:300000}}},'leaf',3);
 assert.throws(()=>redeem(atCap,'leaf','xp',{quantity:1,instanceId:'owned1'}),/Niveau maximum/);
 assert.equal(atCap.inventory.items['fragment:leaf'],3);
});
test('same original Core Storage can save/reload fragment wallet and noncombat storage',()=>{
 const data=new Map();
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const storageSource={};
 vm.runInNewContext(fs.readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8'),storageSource);
 const store=createAdventureStoreV1({storage,coreStorage:storageSource.GensStorageV1});
 store.create(game());
 const earned=withFragments(store.load(),'enemy',10);
 store.save(earned);
 const stored=redeem(store.load(),'enemy','invoke',{newInstanceId:'new1'}).session;
 store.save(stored);
 assert.deepEqual(store.load(),stored);
 assert.equal(store.load().collection.stored.length,1);
 assert.equal(store.load().party.reserve.length,0);
});
