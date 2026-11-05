import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveCaptureCombatCreatureLevelsV1} from '../_site/vendor/combat-lab/src/ui/capture-editor-combat-test-v1.js';
import {readScopedAdventurePlayingPartyV1} from '../_site/vendor/exploration-lab/src/encounters/adventure-playing-party-v1.js';
import {writeAdventurePlayingPartyV1} from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';
import {projectCaptureEncounterOwnedStatsV1} from '../_site/vendor/combat-lab/src/adapters/input/capture/capture-encounter-owned-stats-v1.js';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const pins=JSON.parse(fs.readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
test('GenSRPG consumer explicitly pins certified Combat main owner commit with per-creature levels',()=>{
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'954f38e6b84e842bc8bf6d8515d5c77b93aca5f1');
 assert.equal(pins.combat.certifiedCiRun,42036361285);
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'4bfb15a3092455bec879d3c5ad6098398759d0d3',
  'Exploration pin must be the certified official main, including real HP policy and exact Adventure duel');
 assert.equal(pins.exploration.certifiedCiRun,42056822806);
});
test('a true owned starter level 1 and an enemy level 3 project independently through official Combat',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['published.starter'],opponentCreatureIds:['published.enemy'],
  creatureLevelsById:{'published.starter':1,'published.enemy':3}
 });
 assert.equal(levels.get('published.starter'),1);
 assert.equal(levels.get('published.enemy'),3);
});
test('the historical isolated Combat Tester retains level 20 and no alternative rules owner',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['published.starter'],opponentCreatureIds:['published.enemy']
 });
 assert.equal(levels.get('published.starter'),20);
 assert.equal(levels.get('published.enemy'),20);
});
test('unknown/missing real fighter levels fail, never become a false level-20 battle',()=>{
 assert.throws(()=>resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['published.starter'],opponentCreatureIds:['published.enemy'],
  creatureLevelsById:{'published.starter':1}
 }));
});


test('real Core Adventure level 250 passes same-origin official Exploration and official Combat with no fallback',()=>{
 const id='freecap-session-250',worldId='published-world-1',species='published.starter';
 const snapshot={
  schema:'gensrpg-capture-adventure-save-v1',version:1,status:'playing',sessionId:id,
  world:{mapRef:worldId,position:null},
  rules:{progression:{maxLevel:250},combat:{hpMultiplier:0.25}},
  party:{active:{instanceId:'owned-creature-1',speciesId:species,level:250,hp:35.5}}
 };
 const storage=new Map();
 const disk={setItem:(key,val)=>storage.set(key,val),getItem:key=>storage.get(key)??null};
 const grant={
  schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
  sessionId:id,worldId,combatSha:pins.combat.sha,
  allowedCreatureIds:[species,'published.enemy']
 };
 const write=writeAdventurePlayingPartyV1({
  storage:disk,session:snapshot,world:{id:worldId},publicationGrant:grant,combatSha:pins.combat.sha
 });
 assert.equal(write.active.level,250);
 assert.equal(write.combatHpMultiplier,0.25,'GenSRPG emits a single game-wide HP rule');
 const loaded=readScopedAdventurePlayingPartyV1({
  storage:disk,sessionId:id,worldId,authorSha:pins.combat.sha,engineSha:pins.combat.sha,
  allowedCreatureIds:grant.allowedCreatureIds
 });
 assert.equal(loaded.active.level,250,'native Exploration reads authored instance level without clamp');
 assert.equal(loaded.active.hp,35.5,'exact persisted HP is never quartered again');
 assert.equal(loaded.combatHpMultiplier,0.25,'official Exploration accepts the native HP policy at level 250');
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:[species],opponentCreatureIds:['published.enemy'],
  creatureLevelsById:{[species]:loaded.active.level,'published.enemy':1}
 });
 assert.equal(levels.get(species),250,'official Combat receives exact Core level');
 assert.equal(levels.get('published.enemy'),1);
 const invalid={...snapshot,party:{active:{...snapshot.party.active,level:251}}};
 assert.throws(()=>writeAdventurePlayingPartyV1({
  storage:disk,session:invalid,world:{id:worldId},publicationGrant:grant,combatSha:pins.combat.sha
 }),/cap|level/i,'never write a party exceeding the creator configuration');
});

test('real GenSRPG wallet travels through official Exploration into official Combat per-instance stats',()=>{
 const sessionId='owned-wallet-game-1',worldId='authored-world-1',speciesId='lumilo';
 const statRegistry={schema:'capture-stat-registry-v1',stats:[
  {id:'health',label:'Santé',maxHpPerPoint:1},
  {id:'custom_focus',label:'Focus',outgoingDamagePctPerPoint:1.5}
 ]};
 const cards=[{id:speciesId,name:'Lumilo',skills:[{state:'ready'}]}];
 const initial=createAdventureSessionV1({
  bestiaryCards:cards,starterId:speciesId,rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId,instanceId:'owned-member-1'},now:'2026-11-05T14:00:00Z'
 });
 const session={...initial,status:'playing',world:{mapRef:worldId,position:null},
  party:{active:{...initial.party.active,level:2,xp:2000,
   statAllocations:{health:7,custom_focus:13}}}};
 const disk=new Map(),storage={getItem:key=>disk.get(key)??null,setItem:(k,v)=>disk.set(k,v)};
 const grant={schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
  sessionId,worldId,combatSha:pins.combat.sha,allowedCreatureIds:[speciesId]};
 const input=writeAdventurePlayingPartyV1({
  storage,session,world:{id:worldId},publicationGrant:grant,
  combatSha:pins.combat.sha,statRegistry
 });
 assert.deepEqual(input.active.statAllocations,{health:7,custom_focus:13});
 assert.equal(input.combatHpMultiplier,0.25);
 const loaded=readScopedAdventurePlayingPartyV1({
  storage,sessionId,worldId,authorSha:pins.combat.sha,engineSha:pins.combat.sha,
  allowedCreatureIds:grant.allowedCreatureIds
 });
 assert.deepEqual(loaded.active.statAllocations,input.active.statAllocations,
  'official Exploration preserves exact game wallet rather than computing stats');
 assert.equal(loaded.active.level,2);
 const authored={draft:{id:speciesId},statValues:{
  schema:'capture-creature-stat-values-v1',creatureId:speciesId,
  values:{health:100,custom_focus:4}
 }};
 const records=new Map([[speciesId,authored]]);
 const nativeRecords=projectCaptureEncounterOwnedStatsV1({
  configuredCreatures:records,statRegistry,speciesId:loaded.active.speciesId,
  statAllocations:loaded.active.statAllocations
 });
 assert.equal(nativeRecords.get(speciesId).statValues.values.health,107);
 assert.equal(nativeRecords.get(speciesId).statValues.values.custom_focus,17);
 assert.equal(records.get(speciesId).statValues.values.health,100,
  'official authored species values must never be overwritten');
});
