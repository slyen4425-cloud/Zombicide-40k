import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createAdventureSessionV1,chooseAdventureActiveCreatureV1,
 SHOWCASE_ADVENTURE_RULES_V1,createAdventureStoreV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
const cards=[
 {id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]},
 {id:'gorice',name:'Gorice',skills:[{state:'ready'}]},
 {id:'nope',name:'Not published skill',skills:[{state:'draft'}]}
];
const now='2026-11-07T16:25:00.000Z';
const ids=n=>({sessionId:'party-1to6',instanceId:'fighter-1',
 reserveInstanceIds:Array.from({length:n-1},(_,i)=>'fighter-'+(i+2)),
 creatorId:'creator-party'});
const session=(species)=>createAdventureSessionV1({
 bestiaryCards:cards,starterId:species[0],starterIds:species,ids:ids(species.length),
 now,rules:SHOWCASE_ADVENTURE_RULES_V1
});
test('RED: Capture Aventure owns 1 to 6 real published creature instances from the same Bestiary',()=>{
 for(let n=1;n<=6;n++){
  const chosen=Array.from({length:n},(_,i)=>i%2===0?'lumilo':'gorice');
  const created=session(chosen);
  assert.equal(created.party.active.speciesId,chosen[0]);
  assert.equal(created.party.reserve.length,n-1);
  const actors=[created.party.active,...created.party.reserve];
  assert.equal(new Set(actors.map(a=>a.instanceId)).size,n);
  assert.deepEqual(actors.map(a=>a.speciesId),chosen);
  assert.ok(actors.every(a=>a.level===1&&a.xp===0&&a.hp===null));
 }
});
test('RED: reject zero, seven, unpublished and duplicate-instance teams before saving',()=>{
 for(const n of [0,7])assert.throws(()=>session(Array.from({length:n},()=> 'lumilo')),/1.*6|équipe|starter/i);
 assert.throws(()=>session(['lumilo','nope']),/jouable|compétence|publiée/i);
 assert.throws(()=>createAdventureSessionV1({
  bestiaryCards:cards,starterId:'lumilo',starterIds:['lumilo','gorice'],
  ids:{...ids(2),reserveInstanceIds:['fighter-1']},now,rules:SHOWCASE_ADVENTURE_RULES_V1
 }),/duplicate|distinct|instance/i);
});
test('RED: selecting another owned, non-KO creature preserves the reserve and the same session',()=>{
 const original=session(['lumilo','gorice','lumilo']);
 const next=chooseAdventureActiveCreatureV1({session:original,instanceId:'fighter-2',now});
 assert.equal(next.sessionId,original.sessionId);
 assert.equal(next.party.active.speciesId,'gorice');
 assert.deepEqual(next.party.reserve.map(x=>x.instanceId),['fighter-1','fighter-3']);
 assert.equal(original.party.active.instanceId,'fighter-1');
 assert.throws(()=>chooseAdventureActiveCreatureV1({session:original,instanceId:'unknown',now}),/équipe|instance/i);
});
test('RED: real Jouer UI offers 1..6 choices from the official Bestiary, no fake creature factory',()=>{
 const ui=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(html,/id="adventure-starter-count"/);
 assert.match(html,/id="adventure-starter-reserve"/);
 assert.match(ui,/getStarterSpeciesIds/);
 assert.match(ui,/reserveInstanceIds/);
 assert.match(ui,/chooseAdventureActiveCreatureV1/);
 assert.doesNotMatch(ui,/Math\.random\(\).*creature/);
});
