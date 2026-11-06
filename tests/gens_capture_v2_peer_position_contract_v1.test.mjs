import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 capturePeerPositionFromOfficialNavigationV1,
 capturePeerPositionFromServerRowV1,
 capturePeerPositionListV1
} from '../assets/gensrpg/capture-v2/adventure-peer-position-v1.mjs';

const fakeNavigation={
 schema:'gensrpg.exploration.play-navigation.v1',version:1,
 sessionId:'adventure-hello-1',worldId:'forest-1',
 worldFingerprint:'543:j82w5:e71zm',
 currentAreaId:'area-1',x:12.75,y:8.5
};
const scoped={
 sessionId:'adventure-hello-1',worldId:'forest-1',
 worldFingerprint:'543:j82w5:e71zm'
};
const mkRow=(changes={})=>({
 room_id:'c65266b0-c5e6-4414-b9c4-f3ea17239f23',
 user_id:'b55f72d4-1861-42f7-9804-d5ee774fc539',
 world_id:'forest-1',world_fingerprint:'543:j82w5:e71zm',
 area_id:'area-1',x:12.75,y:8.5,seq:1,
 updated_at:'2026-11-06T20:10:00.000Z',...changes
});
test('only canonical Exploration navigation can issue peer coordinates',()=>{
 const position=capturePeerPositionFromOfficialNavigationV1({
  navigation:fakeNavigation,...scoped
 });
 assert.deepEqual(position,{worldId:'forest-1',worldFingerprint:'543:j82w5:e71zm',
  areaId:'area-1',x:12.75,y:8.5});
 assert.ok(Object.isFrozen(position));
 assert.equal('userId' in position,false,'server must derive actor from JWT');
 assert.equal('save' in position,false,'no AdventureSave in network');
 for(const bad of [
  {schema:'other-navigation-v1'},
  {version:2},{sessionId:'another-adventure'},
  {worldId:'another-world'},{worldFingerprint:'999:other:other'},
  {x:NaN},{x:Infinity},{x:-1},{y:-2},{currentAreaId:''},
  {inventory:{currency:99}},{hero:{name:'Forged'}}
 ]) {
  const nav={...fakeNavigation,...bad};
  assert.throws(()=>capturePeerPositionFromOfficialNavigationV1({
   navigation:nav,...scoped
  }),/invalid|invalide|navigation|position|scope|world|metadata|unexpected|Exploration/i);
 }
});
test('position from server rejects foreign room/world, unknown members, replay and malformed data',()=>{
 const room=mkRow();
 const expected={roomId:room.room_id,worldId:scoped.worldId,
  worldFingerprint:scoped.worldFingerprint,
  participants:[room.user_id,'a77671ac-18f3-4d4e-bfa4-c54a7f84b5c3']};
 assert.deepEqual(capturePeerPositionFromServerRowV1({
  raw:room,...expected,lastSeq:0
 }),{
  actorId:room.user_id,areaId:'area-1',x:12.75,y:8.5,
  seq:1,updatedAt:'2026-11-06T20:10:00.000Z'
 });
 for(const invalid of [
  {room_id:'a1237e45-c28a-4ad3-8e2a-7536846dc1c4'},
  {user_id:'f123b428-0604-4cb6-a52d-818f6fe86c5e'},
  {world_id:'dungeon-save'}, {world_fingerprint:'555:other:bad'},
  {x:-2},{y:Infinity},{seq:0},{role:'host'}, {inventory:{items:[]}}
 ]){
  assert.throws(()=>capturePeerPositionFromServerRowV1({
   raw:mkRow(invalid),...expected,lastSeq:0
  }),/invalid|position|scope|world|room|participant|unexpected|replay|stale|foreign/i);
 }
 assert.throws(()=>capturePeerPositionFromServerRowV1({
  raw:room,...expected,lastSeq:1
 }),/stale|replay/i);
});
test('peer list never includes self nor unrelated world and tracks revisions by owner',()=>{
 const self='a77671ac-18f3-4d4e-bfa4-c54a7f84b5c3';
 const record=mkRow();
 const {actors,sequences}=capturePeerPositionListV1({
  rows:[record],roomId:record.room_id,worldId:scoped.worldId,
  worldFingerprint:scoped.worldFingerprint,
  participants:[self,record.user_id],ownActorId:self,previousSequences:{}
 });
 assert.deepEqual(actors,[{actorId:record.user_id,areaId:'area-1',
  x:12.75,y:8.5,seq:1,updatedAt:'2026-11-06T20:10:00.000Z'}]);
 assert.equal(sequences[record.user_id],1);
 const ignored=capturePeerPositionListV1({
  rows:[record],roomId:record.room_id,worldId:scoped.worldId,
  worldFingerprint:scoped.worldFingerprint,
  participants:[self,record.user_id],ownActorId:self,previousSequences:sequences
 });
 assert.equal(ignored.actors.length,0);
 assert.ok(Object.isFrozen(actors));assert.ok(Object.isFrozen(sequences));
});
test('server migration is additive to Capture and never touches Survival tables or legacy global storage',()=>{
 const sql=readFileSync(new URL(
 '../supabase/migrations/20261106195000_gensrpg_capture_peer_presence_v1.sql',
 import.meta.url),'utf8');
 assert.match(sql,/gensrpg_capture_peer_positions/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/security definer/i);
 assert.match(sql,/enable row level security/i);
 assert.doesNotMatch(sql,/\b(?:alter|update|insert|delete|drop|truncate)\s+(?:table\s+)?(?:public\.)?z40k_/i);
 assert.doesNotMatch(sql,/localStorage|AdventureSave|Storage\.prototype/);
});
