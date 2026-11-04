import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1} from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';

const SHA='a'.repeat(40),cards=[
 {id:'official-ready',name:'Prêt',skills:[{state:'ready'}]},
 {id:'official-unready',name:'Brouillon',skills:[{state:'unpublished'}]}
];
function fixture(){
 const entries=new Map(),storage={
  getItem:key=>entries.get(key)??null,
  setItem:(k,v)=>entries.set(k,String(v)),
  size:()=>entries.size
 };
 const created=createAdventureSessionV1({bestiaryCards:cards,
  starterId:'official-ready',rules:DEFAULT_ADVENTURE_RULES_V1,
  ids:{sessionId:'session-1',instanceId:'member-1'},now:'2026-11-04T10:00:00Z'});
 const world={id:'world-1',areas:[{id:'area-1'}]};
 const session={...created,status:'playing',world:{mapRef:world.id,position:null}};
 const publicationGrant=writeAdventurePublishedEncounterGrantV1({
  storage,session,world,bestiaryCards:cards,combatSha:SHA
 });
 return {storage,session,world,publicationGrant,combatSha:SHA};
}
test('only official real Adventure member instance, creature level and HP enter temporary playing-party grant',()=>{
 const f=fixture();
 const input={...f.session,party:{active:{...f.session.party.active,level:12,hp:73}}};
 const grant=writeAdventurePlayingPartyV1({...f,session:input});
 assert.deepEqual(grant,{
  schema:'gensrpg.capture.v2.active-party.v1',version:1,
  sessionId:'session-1',worldId:'world-1',combatSha:SHA,
  partyRef:'adventure-party:session-1',
  active:{instanceId:'member-1',speciesId:'official-ready',level:12,hp:73}
 });
 assert.equal(Object.isFrozen(grant.active),true);
 assert.deepEqual(JSON.parse(f.storage.getItem('gensrpg.capture.v2.active-party.v1:session-1')),grant);
 assert.equal(f.storage.getItem('gensrpg.capture.v2.active-party.v1:other'),null);
});
test('projects the exact fractional HP saved after native combat',()=>{
 const f=fixture(),hp=33.47000000000003;
 const session={...f.session,party:{active:{...f.session.party.active,hp}}};
 assert.equal(writeAdventurePlayingPartyV1({...f,session}).active.hp,hp);
});
test('refuses stale save, wrong WorldDocument and uncertified unpublished species before writing',()=>{
 const variants=[
  f=>({session:{...f.session,status:'configured'}}),
  f=>({session:{...f.session,world:{mapRef:'other-world',position:null}}}),
  f=>({session:{...f.session,party:{active:{...f.session.party.active,speciesId:'official-unready'}}}}),
  f=>({session:{...f.session,party:{active:{...f.session.party.active,level:0}}}}),
  f=>({session:{...f.session,party:{active:{...f.session.party.active,level:101}}}}),
  f=>({session:{...f.session,party:{active:{...f.session.party.active,hp:-1}}}}),
  f=>({session:{...f.session,party:{active:{...f.session.party.active,instanceId:'broken/path'}}}}),
  f=>({publicationGrant:{...f.publicationGrant,allowedCreatureIds:['official-unready']}}),
  f=>({publicationGrant:{...f.publicationGrant,sessionId:'other'}}),
  f=>({publicationGrant:{...f.publicationGrant,extra:['false-owner']}})
 ];
 for(const make of variants){
  const f=fixture();assert.throws(()=>writeAdventurePlayingPartyV1({...f,...make(f)}));
  assert.equal(f.storage.getItem('gensrpg.capture.v2.active-party.v1:session-1'),null);
 }
});
test('a valid but different Combat commit must not authorize the saved party',()=>{
 const f=fixture();
 const publicationGrant={...f.publicationGrant,combatSha:'f'.repeat(40)};
 assert.throws(()=>writeAdventurePlayingPartyV1({...f,publicationGrant}),/Combat SHA mismatch/);
 assert.equal(f.storage.getItem('gensrpg.capture.v2.active-party.v1:session-1'),null);
});
test('party revalidation after a creature level-up overwrites only scoped projection, never the save',()=>{
 const f=fixture(),before=JSON.stringify(f.session);
 writeAdventurePlayingPartyV1(f);
 const leveled={...f.session,party:{active:{...f.session.party.active,level:2}}};
 const next=writeAdventurePlayingPartyV1({...f,session:leveled});
 assert.equal(next.active.level,2);
 assert.equal(JSON.stringify(f.session),before);
 assert.equal(f.storage.size(),2,'one Bestiary grant and one true party projection only');
});
