import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,createAdventureSessionV1,applyAdventureCombatResultV1,createAdventureStoreV1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
const sandbox={};
vm.runInNewContext(fs.readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8'),sandbox);
const cards=[{id:'ally',name:'Ally',level:1,skills:[{state:'ready'}]},{id:'foe',name:'Foe',level:2,skills:[{state:'ready'}]}];
const create=rules=>createAdventureSessionV1({bestiaryCards:cards,starterId:'ally',rules,ids:{sessionId:'session1',instanceId:'instance1'},now:'2026-11-04T10:00:00Z'});
const rules=changes=>normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,heroProgression:{...DEFAULT_ADVENTURE_RULES_V1.heroProgression,...changes}});
const apply=(session,id='encounter1')=>applyAdventureCombatResultV1({session,envelope:{version:1,snapshot:{schema:'capture-encounter-snapshot-v1',version:1,encounterId:id,returnToken:'return1',opponents:[{creatureId:'foe'}]},result:{schema:'capture-combat-result-v1',version:1,encounterId:id,returnToken:'return1',outcome:'victory',partyState:{activeCreatureId:'ally',hp:70},rewards:[]}},bestiaryCards:cards,progressionCore:sandbox.GensProgressionV1,random:()=>0.5,now:'2026-11-04T10:30:00Z'});
test('hero has NO level or XP by default, creature still gains 1300 XP',()=>{
 assert.equal(DEFAULT_ADVENTURE_RULES_V1.heroProgression.enabled,false);
 const initial=create(DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(initial.hero.progression,null);
 const won=apply(initial);
 assert.equal(won.session.party.active.xp,1300);
 assert.equal(won.session.hero.progression,null);
 assert.equal(won.award.heroXp,0);
});
test('author enables XP share/curve/skill points; Core progression owns level',()=>{
 const initial=create(rules({enabled:true,xpGainPercent:50,xpPerLevel:500,maxLevel:20,talentPointsPerLevel:3}));
 assert.deepEqual(initial.hero.progression,{xp:0,level:1,talentPoints:0});
 const first=apply(initial);
 assert.equal(first.session.party.active.xp,1300);
 assert.deepEqual(first.session.hero.progression,{xp:650,level:2,talentPoints:3});
 assert.equal(first.award.heroXp,650);
 assert.equal(apply(first.session).applied,false);
});
test('can enable after creation and disable later without deleting earned hero XP',()=>{
 const start=create(DEFAULT_ADVENTURE_RULES_V1);
 const first=apply({...start,rules:rules({enabled:true,xpGainPercent:100})});
 assert.equal(first.session.hero.progression.xp,1300);
 const next=apply({...first.session,rules:rules({enabled:false})},'encounter2');
 assert.equal(next.award.heroXp,0);
 assert.deepEqual(next.session.hero.progression,first.session.hero.progression);
});
test('legacy save without hero or policy stays playable and unchanged',()=>{
 const old={...create(DEFAULT_ADVENTURE_RULES_V1)};
 delete old.hero;
 const legacyRules=JSON.parse(JSON.stringify(old.rules));
 delete legacyRules.heroProgression;
 const saved=apply({...old,rules:legacyRules});
 assert.equal(saved.session.party.active.xp,1300);
 assert.equal(Object.hasOwn(saved.session,'hero'),false);
 assert.equal(normalizeAdventureRulesV1(legacyRules).heroProgression.enabled,false);
});
test('invalid hero policy is rejected',()=>{
 for(const c of [{enabled:1},{xpGainPercent:-1},{xpPerLevel:0},{maxLevel:101},{talentPointsPerLevel:-1}])
  assert.throws(()=>rules(c));
});
test('Aventure exposes hero creator controls, without copying Exploration actor',()=>{
 const html=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 for(const id of ['adventure-hero-xp-enabled','adventure-hero-xp-share','adventure-hero-xp-per-level','adventure-hero-max-level','adventure-hero-talent-points'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(ui,/heroProgression/);
});

test('combat XP never erases the chosen official HeroDefinition, including after Core Storage reload',()=>{
 const heroDefinitionId='hero.user.00000000-0000-4000-8000-000000000001';
 const session=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'ally',heroDefinitionId,
  rules:rules({enabled:true,xpGainPercent:50,xpPerLevel:500,maxLevel:20,talentPointsPerLevel:3}),
  ids:{sessionId:'hero-selected-session',instanceId:'hero-selected-ally'},
  now:'2026-11-04T10:00:00Z'
 });
 const data=new Map();
 const storage={
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 };
 const store=createAdventureStoreV1({storage,coreStorage:sandbox.GensStorageV1});
 const playing={...session,status:'playing'};
 store.create(playing);
 const victory=apply(store.load());
 assert.equal(victory.session.hero.definitionId,heroDefinitionId);
 assert.deepEqual(victory.session.hero.progression,{xp:650,level:2,talentPoints:3});
 store.save(victory.session);
 assert.equal(store.load().hero.definitionId,heroDefinitionId);
 const second=apply(store.load(),'encounter2');
 assert.equal(second.session.hero.definitionId,heroDefinitionId);
 assert.equal(second.award.heroXp,500); // second battle: both creatures now level 2
 assert.equal(second.session.hero.progression.xp,victory.session.hero.progression.xp+second.award.heroXp);
 // Replaying a processed result must not duplicate XP or modify the visual selection.
 assert.equal(apply(victory.session).session.hero.definitionId,heroDefinitionId);
});
