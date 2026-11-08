import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {assertOfficialAdventureWorldIdV1,withSelectedAdventureWorldV1}
 from '../assets/gensrpg/capture-v2/adventure-world-choice-v1.mjs';
import {writeAdventureHeroSelectionGrantV1}
 from '../assets/gensrpg/capture-v2/adventure-hero-selection-grant-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1}
 from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1}
 from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';
import {createAdventureHpProjectorV1}
 from '../assets/gensrpg/capture-v2/adventure-hp-projection-v1.mjs';
import {adventurePlaySheetSnapshotV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';

const cards=[{id:'ally',name:'Créature 140 PV',skills:[{state:'ready'}],
 measures:[{key:'health',label:'Santé',value:140}]}];
const registry={schema:'capture-stat-registry-v1',stats:[
 {id:'health',label:'Santé / PV',maxHpPerPoint:1}]};
const heroId='hero.user.00000000-0000-4000-8000-000000000001';
const author=[{draft:{id:'ally'},statValues:{
 schema:'capture-creature-stat-values-v1',creatureId:'ally',values:{health:140}
}}];
const heroRecord={schema:'gensrpg-exploration-user-hero-v1',version:1,id:heroId};
const makeSession=({percent=25,hp=46,withHero=true}={})=>{
 const base=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'ally',rules:{...SHOWCASE_ADVENTURE_RULES_V1,
   combat:{...SHOWCASE_ADVENTURE_RULES_V1.combat,hpMultiplier:percent/100}},
  ids:{sessionId:'saved-ailevent',instanceId:'owned-1',creatorId:'host-1'},
  now:'2026-11-08T04:45:00.000Z',heroDefinitionId:withHero?heroId:null
 });
 const selected=withSelectedAdventureWorldV1(base,'Test 1');
 return {...selected,status:'playing',party:{...selected.party,
  active:{...selected.party.active,hp,statAllocations:{}}}};
};
const disk=()=>{const map=new Map();return {
 getItem:key=>map.get(key)??null,setItem:(key,val)=>map.set(key,String(val)),
 count:()=>map.size,snapshot:()=>[...map.entries()]
}};

test('WorldDocument Test 1 from official Exploration is not mistaken for a URL slug',()=>{
 for(const id of ['Test 1','Forêt 1','world-main'])assert.equal(assertOfficialAdventureWorldIdV1(id),id);
 for(const id of ['', ' ', '\n','bad\u007fworld','x'.repeat(131)])
  assert.throws(()=>assertOfficialAdventureWorldIdV1(id));
 const session=makeSession(),world={id:'Test 1'},storage=disk();
 const saved=JSON.stringify(session);
 const hero=writeAdventureHeroSelectionGrantV1({session,world,storage,heroRecord});
 const published=writeAdventurePublishedEncounterGrantV1({session,world,storage,
  bestiaryCards:cards,combatSha:'a'.repeat(40)});
 const party=writeAdventurePlayingPartyV1({session,world,storage,
  publicationGrant:published,combatSha:'a'.repeat(40)});
 assert.equal(hero.worldId,'Test 1');
 assert.equal(published.worldId,'Test 1');assert.equal(party.worldId,'Test 1');
 assert.equal(party.active.hp,46,'transport retains original Core HP without mutation');
 assert.equal(JSON.stringify(session),saved,'no mutation of old save');
 assert.equal(storage.count(),3,'no extra world authority or duplicate grant');
 assert.throws(()=>writeAdventureHeroSelectionGrantV1({...{session,storage,heroRecord},
  world:{id:'Test 2'}}),/world|monde|match/i);
});

test('game HP, stat points, and team use one provided Combat projection, preserving source save',()=>{
 const calls=[];
 const projector=createAdventureHpProjectorV1({
  creatureTransfers:author,statRegistry:registry,
  projectOwnedStats:({configuredCreatures,speciesId,statAllocations})=>{
   const rec=configuredCreatures.get(speciesId),old=rec.statValues.values;
   return new Map([[speciesId,{...rec,statValues:{...rec.statValues,
    values:{...old,health:old.health+(statAllocations?.health??0)}}}]]);
  },
  projectStatEffects:({statValues})=>({hasMaxHpProjection:true,maxHp:statValues.values.health}),
  projectMaxHp:(raw,multiplier)=>{calls.push([raw,multiplier]);return Math.max(1,Math.ceil(raw*multiplier));}
 });
 for(const [percent,hp,allocation,expected,shown] of [
  [25,46,0,35,35],[25,19,0,35,19],[25,0,0,35,0],
  [25,null,0,35,35],[25,46,5,37,37],[40,46,0,56,46],
  [100,46,0,140,46]]){
  const original=makeSession({percent,hp});
  const s={...original,party:{...original.party,
   active:{...original.party.active,level:allocation?2:1,
    statAllocations:allocation?{health:allocation}:{}}}};
  const before=JSON.stringify(s);
  const result=adventurePlaySheetSnapshotV1({
   session:s,bestiaryCards:cards,statRegistry:registry,
   projectCombatVitals:projector
  });
  assert.equal(result.creature.maxHp,expected);
  assert.equal(result.creature.hp,shown);
  assert.equal(result.creature.baseMaxHp,140+allocation);
  assert.equal(result.creature.labMaxHp,140);
  assert.equal(result.creature.stats[0].authoredBaseHp,140);
  assert.equal(result.creature.stats[0].baseValue,expected);
  assert.equal(result.creature.stats[0].allocated,allocation);
  assert.equal(result.creature.stats[0].gameHp,true);
  assert.equal(result.team[0].maxHp,expected);
  assert.equal(result.team[0].hp,shown);
  assert.equal(JSON.stringify(s),before,'view must never mutate saved HP');
 }
 assert.ok(calls.some(([raw,p])=>raw===145&&p===0.25));
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(view,/PV en jeu/);assert.match(view,/PV maximum au Labo/);
 assert.match(view,/Points Santé investis/);
 assert.match(app,/projectCaptureEncounterMaxHpV1/);
 assert.match(app,/projectCaptureStatEffectsV1/);
 assert.match(app,/projectCaptureEncounterOwnedStatsV1/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/);
});
