import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1} from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';
const SHA='a'.repeat(40),cards=[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}];
const statRegistry={schema:'capture-stat-registry-v1',stats:[
 {id:'health',label:'Santé'}, {id:'custom_focus',label:'Concentration'}
]};
function fixture(rules=SHOWCASE_ADVENTURE_RULES_V1){
 const items=new Map(),storage={
  getItem:key=>items.get(key)??null,
  setItem:(key,value)=>items.set(key,String(value)),
  size:()=>items.size
 };
 const initial=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'lumilo',rules,
  ids:{sessionId:'capture-game-1',instanceId:'owned-1'},
  now:'2026-11-05T14:00:00Z'
 });
 const session={...initial,status:'playing',world:{mapRef:'world-1',position:null}};
 const world={id:'world-1'};
 const publicationGrant=writeAdventurePublishedEncounterGrantV1({
  storage,session,world,bestiaryCards:cards,combatSha:SHA
 });
 return {storage,session,world,publicationGrant,combatSha:SHA,statRegistry};
}
test('RED: 20 points distributed in Core are projected, not recomputed or added to authored species',()=>{
 const f=fixture();
 const withPoints={...f.session,party:{active:{
  ...f.session.party.active,level:2,xp:2000,
  statAllocations:{health:7,custom_focus:13}
 }}};
 const before=JSON.stringify(withPoints);
 const grant=writeAdventurePlayingPartyV1({...f,session:withPoints});
 assert.deepEqual(grant.active,{
  instanceId:'owned-1',speciesId:'lumilo',level:2,hp:null,
  statAllocations:{health:7,custom_focus:13}
 });
 assert.equal(grant.combatHpMultiplier,0.25);
 assert.equal(JSON.stringify(withPoints),before,'no mutation of AdventureSession');
 assert.equal(Object.isFrozen(grant.active.statAllocations),true);
 assert.equal(f.storage.size(),2);
 assert.deepEqual(JSON.parse(f.storage.getItem('gensrpg.capture.v2.active-party.v1:capture-game-1')),grant);
});
test('RED: old game without a stat wallet projects NO extra field and remains full-strength',()=>{
 const f=fixture(DEFAULT_ADVENTURE_RULES_V1);
 const grant=writeAdventurePlayingPartyV1(f);
 assert.equal(Object.hasOwn(grant.active,'statAllocations'),false);
 assert.equal(grant.combatHpMultiplier,0.25);
});
test('RED: forged budget, unknown official stat and missing registry are rejected BEFORE grant write',()=>{
 const badCases=[
  {allocations:{health:21},registry:statRegistry},
  {allocations:{health:-1},registry:statRegistry},
  {allocations:{health:1.5},registry:statRegistry},
  {allocations:{ghost:1},registry:statRegistry},
  {allocations:{health:1},registry:null}
 ];
 for(const {allocations,registry} of badCases){
  const f=fixture(),session={...f.session,party:{active:{
   ...f.session.party.active,level:2,xp:2000,statAllocations:allocations
  }}};
  assert.throws(()=>writeAdventurePlayingPartyV1({
   ...f,session,statRegistry:registry
  }),/stat|point|budget|registry|officiel/i);
  assert.equal(f.storage.getItem('gensrpg.capture.v2.active-party.v1:capture-game-1'),null);
 }
});
test('the GenSRPG UI passes only the official Combat registry to the single owned grant',()=>{
 const source=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(source,/writeAdventurePlayingPartyV1/);
 assert.match(source,/statRegistry:\s*officialStatRegistry/);
 assert.doesNotMatch(source,/damagePctPerPoint\s*[:=]|maxHpPerPoint\s*[:=]/,
  'UI may never own stat coefficients');
});
