import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';

const SHA='a'.repeat(40);
const cards=[
 {id:'official-ready-fire',name:'Feu',skills:[{state:'ready'}]},
 {id:'official-no-skill',name:'Non prêt',skills:[{state:'unpublished'}]},
 {id:'official-ready-water',name:'Eau',skills:[{state:'ready'}]}
];
const now='2026-11-04T08:00:00.000Z';
function scenario(){
 const entries=new Map();
 const storage={
   getItem:k=>entries.get(k)??null,
   setItem:(k,v)=>entries.set(k,String(v)),
   size:()=>entries.size
 };
 const created=createAdventureSessionV1({
   bestiaryCards:cards,starterId:'official-ready-fire',
   rules:DEFAULT_ADVENTURE_RULES_V1,
   ids:{sessionId:'session-a',instanceId:'owned-a'},now
 });
 return {storage,session:{...created,status:'playing',world:{mapRef:'world-a',position:null}},
  world:{id:'world-a',areas:[{id:'area-a'}]}};
}
function grant(args={}){
 const s=scenario();
 return {s,invoke:(changes={})=>writeAdventurePublishedEncounterGrantV1({
  storage:s.storage,session:s.session,world:s.world,
  bestiaryCards:cards,combatSha:SHA,...args,...changes
 })};
}
test('only actual Combat Bestiary ready species enter immutable same-origin scoped grant',()=>{
 const {s,invoke}=grant();
 const result=invoke();
 assert.deepEqual(result.allowedCreatureIds,['official-ready-fire','official-ready-water']);
 assert.equal(result.schema,'gensrpg.capture.v2.published-encounters.v1');
 assert.equal(result.version,1);
 assert.equal(result.combatSha,SHA);
 assert.equal(result.sessionId,'session-a');
 assert.equal(result.worldId,'world-a');
 assert.equal(s.storage.size(),1);
 assert.deepEqual(JSON.parse(s.storage.getItem('gensrpg.capture.v2.published-encounters.v1:session-a')),result);
 assert.ok(Object.isFrozen(result.allowedCreatureIds));
 assert.equal(result.allowedCreatureIds.includes('official-no-skill'),false);
});
test('fail closed before writing when session, world, version or selected starter are stale',()=>{
 for(const bad of [
  {session:{...scenario().session,status:'configured'}},
  {session:{...scenario().session,world:{mapRef:'different-world',position:null}}},
  {session:{...scenario().session,sessionId:'bad/path'}},
  {session:{...scenario().session,party:{active:{speciesId:'removed',instanceId:'old'}}}},
  {session:{...scenario().session,schema:'unrecognized-save'}},
  {world:{id:'other-world',areas:[]}},
  {combatSha:'incorrect'}
 ]){
  const {s,invoke}=grant();
  assert.throws(()=>invoke(bad));
  assert.equal(s.storage.size(),0,'invalid state must never create or modify publication key');
 }
});
test('no unpublished species may be smuggled into a new grant by a duplicate or missing Bestiary',()=>{
 for(const candidate of [
  null,[],[cards[0],cards[0]],
  [{id:'official-no-skill',name:'Non prêt',skills:[{state:'unpublished'}]}],
  [{id:'unlisted',name:'Unknown',skills:[{state:'ready'}]}]
 ]){
  const {s,invoke}=grant();
  assert.throws(()=>invoke({bestiaryCards:candidate}));
  assert.equal(s.storage.size(),0);
 }
});
test('replaying the same session renews only its transient projection, never other sessions or saved game',()=>{
 const {s,invoke}=grant();
 const original=JSON.stringify(s.session);
 const initial=invoke();
 assert.equal(initial.sessionId,'session-a');
 const second=invoke({bestiaryCards:[cards[0],cards[2]]});
 assert.deepEqual(second.allowedCreatureIds,['official-ready-fire','official-ready-water']);
 assert.equal(JSON.stringify(s.session),original);
 assert.equal(s.storage.size(),1);
 assert.equal(s.storage.getItem('gensrpg.capture.v2.published-encounters.v1:other-session'),null);
});
