import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {
 DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1,
 normalizeAdventureRulesV1,createAdventureSessionV1,
 applyAdventureCombatResultV1,createAdventureStoreV1,
 coreAdventureProgressionConfigV1,availableAdventureStatPointsV1,
 allocateAdventureStatPointsV1,updateAdventureSessionControlV1,
 initializeAdventureSessionControlV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const coreModule=fs.readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8');
const storageModule=fs.readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8');
function core(source,field){
 const context={};
 vm.runInNewContext(source,context);
 return context[field];
}
const progression=core(coreModule,'GensProgressionV1');
const storageCore=core(storageModule,'GensStorageV1');
const ids={sessionId:'session-123',instanceId:'creature-instance-456'};
const date='2026-11-05T01:00:00.000Z';
const cards=[
 {id:'lumilo',name:'Lumilo',level:1,skills:[{state:'ready'}]},
 {id:'venombre',name:'Venombre',level:1,skills:[{state:'ready'}]}
];
const registry={
 schema:'capture-stat-registry-v1',
 stats:[{id:'health',label:'Santé / PV'},{id:'speed',label:'Vitesse'},
  {id:'physical',label:'Puissance physique'},{id:'electric',label:'Électricité'},
  {id:'custom_focus',label:'Concentration personnalisée'}]
};
const game=(rules=SHOWCASE_ADVENTURE_RULES_V1)=>createAdventureSessionV1({
 bestiaryCards:cards,starterId:'lumilo',rules,ids,now:date
});
const outcome=(n)=>({
 version:1,
 snapshot:{schema:'capture-encounter-snapshot-v1',version:1,
   encounterId:'enc-'+n,returnToken:'return-'+n,opponents:[{creatureId:'venombre'}]},
 result:{schema:'capture-combat-result-v1',version:1,
   encounterId:'enc-'+n,returnToken:'return-'+n,outcome:'victory',
   rewards:[],worldEffects:[],capture:null,
   partyState:{activeCreatureId:'lumilo',hp:60}}
});
test('showcase preset grants 20 distributable points per LEVEL and caps at 100, without changing old save defaults',()=>{
 assert.equal(SHOWCASE_ADVENTURE_RULES_V1.progression.maxLevel,100);
 assert.equal(SHOWCASE_ADVENTURE_RULES_V1.progression.statPointsPerLevel,20);
 assert.deepEqual(SHOWCASE_ADVENTURE_RULES_V1.progression.xpBands.map(x=>[x.throughLevel,x.xpPerLevel]),
  [[20,2000],[40,4000],[60,6000],[80,8000],[100,10000]]);
 const old=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(old.progression.xpCurveMode,'linear');
 assert.equal(old.progression.xpPerLevel,1000);
 assert.equal(Object.hasOwn(old.progression,'statPointsPerLevel'),false);
});
test('the existing CORE Progression alone levels each bracket: lv20 to lv21 costs 4000; level cap stops XP levels',()=>{
 const rules=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
 const p=coreAdventureProgressionConfigV1(rules.progression);
 assert.equal(p.xpCurveMode,'custom');
 assert.deepEqual(Array.from(p.xpBands,x=>[x.throughLevel,x.xpPerLevel]),
  [[20,2000],[40,4000],[60,6000],[80,8000],[100,10000]]);
 assert.equal(Object.hasOwn(p,'xpThresholds'),false,
  'Core interprets the exact bands, never a materialized second threshold table');
 assert.equal(progression.levelFromXp(37999,p),19);
 assert.equal(progression.levelFromXp(38000,p),20);
 assert.equal(progression.levelFromXp(41999,p),20);
 assert.equal(progression.levelFromXp(42000,p),21);
 assert.equal(progression.levelFromXp(Number.MAX_SAFE_INTEGER,p),100);
 assert.equal(progression.xpIntoLevel(41999,p),3999);
});
test('showcase victory twice earns one level and 20 unspent stats; no phantom stat growth on first fight',()=>{
 let saved=game();
 assert.equal(availableAdventureStatPointsV1(saved),0);
 let first=applyAdventureCombatResultV1({session:saved,envelope:outcome(1),
  bestiaryCards:cards,progressionCore:progression,random:()=>0.9,now:date});
 assert.equal(first.session.party.active.level,1);
 assert.equal(first.session.party.active.xp,1000);
 assert.equal(availableAdventureStatPointsV1(first.session),0);
 const second=applyAdventureCombatResultV1({session:first.session,envelope:outcome(2),
  bestiaryCards:cards,progressionCore:progression,random:()=>0.9,now:date});
 assert.equal(second.session.party.active.level,2);
 assert.equal(second.session.party.active.xp,2000);
 assert.equal(availableAdventureStatPointsV1(second.session),20);
 const repeat=applyAdventureCombatResultV1({session:second.session,envelope:outcome(2),
  bestiaryCards:cards,progressionCore:progression,random:()=>{throw Error('duplicate reward')}});
 assert.equal(repeat.applied,false);
 assert.equal(availableAdventureStatPointsV1(repeat.session),20);
});
test('official Combat stat IDs may be allocated without overspending or replacing authored species values',()=>{
 let g={...game(),party:{active:{...game().party.active,level:2,xp:2000}}};
 const plus=allocateAdventureStatPointsV1({session:g,registry,statId:'health',points:7,now:date});
 assert.equal(plus.party.active.statAllocations.health,7);
 assert.equal(availableAdventureStatPointsV1(plus),13);
 const plus2=allocateAdventureStatPointsV1({session:plus,registry,statId:'custom_focus',points:13,now:date});
 assert.equal(availableAdventureStatPointsV1(plus2),0);
 assert.equal(plus2.party.active.statAllocations.custom_focus,13);
 assert.equal(plus2.party.active.hp,null);
 assert.equal(plus2.party.active.speciesId,'lumilo');
 assert.throws(()=>allocateAdventureStatPointsV1({session:plus2,registry,statId:'electric',points:1}),/points|available|disponible/i);
 assert.throws(()=>allocateAdventureStatPointsV1({session:plus,registry,statId:'ghost',points:1}),/stat|officiel|unknown/i);
 assert.throws(()=>allocateAdventureStatPointsV1({session:plus,registry,statId:'health',points:-1}),/points|range/i);
 assert.throws(()=>allocateAdventureStatPointsV1({session:plus,registry,statId:'health',points:1.5}),/points|integer/i);
 assert.deepEqual(g.party.active.statAllocations,{},'allocation must preserve original session and base stat wallet');
});
test('creator/MJ and guest choices persist with the AdventureSession; never grant spawn or network authority by UI alone',()=>{
 const start=game();
 assert.ok(start.sessionControl.creatorId);
 assert.equal(start.sessionControl.hostIsGameMaster,false);
 assert.equal(start.sessionControl.joinEnabled,false);
 assert.equal(start.sessionControl.guestPermissions.editProgression,false);
 const toggled=updateAdventureSessionControlV1({session:start,now:date,
  settings:{hostIsGameMaster:true,joinEnabled:true,
   guestPermissions:{editProgression:false,editRewards:false,editWorld:false,
    allocateOwnCreatureStats:true}}});
 assert.equal(toggled.sessionControl.hostIsGameMaster,true);
 assert.equal(toggled.sessionControl.joinEnabled,true);
 assert.equal(toggled.sessionControl.creatorId,start.sessionControl.creatorId);
 assert.equal(Object.hasOwn(toggled.sessionControl,'spawnMonster'),false);
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const store=createAdventureStoreV1({storage,coreStorage:storageCore});
 store.create(toggled);
 assert.deepEqual(store.load(),toggled);
 assert.throws(()=>updateAdventureSessionControlV1({session:toggled,now:date,settings:{
  hostIsGameMaster:true,joinEnabled:true,guestPermissions:{editProgression:true}}}),/permissions|fields/i);
});
test('historical adventure saves without progression bands, stat wallets or host permissions remain loadable untouched',()=>{
 const old=game(DEFAULT_ADVENTURE_RULES_V1);
 const legacy={...old,party:{active:{...old.party.active}},hero:old.hero};
 delete legacy.sessionControl;
 assert.equal(availableAdventureStatPointsV1(legacy),0);
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const store=createAdventureStoreV1({storage,coreStorage:storageCore});
 store.create(legacy);
 assert.deepEqual(store.load(),legacy);
 assert.equal(Object.hasOwn(store.load(),'sessionControl'),false);
});

test('showcase setup exposes progression configuration while stat allocation belongs to in-game sheet',()=>{
 const html=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const script=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 for(const id of ['adventure-xp-mode','adventure-xp-bands','adventure-xp-band-add',
  'adventure-stat-points-per-level',
  'adventure-creator-panel','adventure-gm-enabled','adventure-join-enabled',
  'adventure-guest-edit-progression','adventure-guest-edit-rewards',
  'adventure-guest-edit-world','adventure-guest-allocate-stats','adventure-save-control']){
   assert.ok(html.includes('id="'+id+'"'),'missing game setting/owner UI '+id);
 }
 assert.match(script,/SHOWCASE_ADVENTURE_RULES_V1/);
 const sheet=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 assert.match(sheet,/onAllocate:tab==='stats'\\?onAllocate:null/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/);
 assert.match(script,/allocateAdventureStatPointsV1/);
 assert.match(script,/updateAdventureSessionControlV1/);
 assert.match(script,/officialStatRegistry/);
 assert.match(script,/fetchJson\('\.\.\/\.\.\/\.\.\/vendor\/combat-lab\/data\/capture\/monster-capture-stat-registry\.v1\.json'\)/);
 assert.doesNotMatch(script,/const AVAILABLE_STATS=\[/,'Combat registry is the sole stat authority');
});

test('an old local save may opt into creator/MJ configuration explicitly, never on read',()=>{
 const old=game(DEFAULT_ADVENTURE_RULES_V1);
 const legacy={...old};delete legacy.sessionControl;
 const withOwner=initializeAdventureSessionControlV1({
  session:legacy,creatorId:'creator-upgraded-1',
  settings:{hostIsGameMaster:true,joinEnabled:false,guestPermissions:{
   editProgression:false,editRewards:false,editWorld:false,allocateOwnCreatureStats:true
  }},now:date
 });
 assert.equal(withOwner.sessionControl.creatorId,'creator-upgraded-1');
 assert.equal(withOwner.sessionControl.hostIsGameMaster,true);
 assert.equal(Object.hasOwn(legacy,'sessionControl'),false);
 assert.throws(()=>initializeAdventureSessionControlV1({
  session:withOwner,creatorId:'creator-stealer',settings:{
   hostIsGameMaster:false,joinEnabled:true,guestPermissions:{
    editProgression:true,editRewards:true,editWorld:true,allocateOwnCreatureStats:false
   }
  }
 }),/existing|already|creator/i);
});
