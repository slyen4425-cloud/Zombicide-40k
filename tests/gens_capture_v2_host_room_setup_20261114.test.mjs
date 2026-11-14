import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {captureHostSetupFromSessionV1,captureRoomSetupFromServerV1,
 captureGuestSessionMatchesHostSetupV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-host-setup-v1.mjs';
import {captureRoomEntryPresentationV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-entry-presentation-v1.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const cards=[{id:'root-a',name:'Moussado',rarity:'rare',
 skills:[{slot:'s1',name:'Coup',state:'ready'}]}];
function newSession(id='host-session',count=2,rules=SHOWCASE_ADVENTURE_RULES_V1){
 const starterIds=Array(count).fill('root-a');
 return createAdventureSessionV1({
  bestiaryCards:cards,starterId:starterIds[0],starterIds,rules,
  now:'2026-11-14T21:00:00Z',
  ids:{sessionId:id,instanceId:id+'-member-0',creatorId:id+'-creator',
   reserveInstanceIds:starterIds.slice(1).map((_,i)=>id+'-member-'+(i+1))},
  cameraAngle:45,cameraZoomPercent:175
 });
}
function room(){return {roomId:'12345678-1234-4234-8234-123456789000',
 sessionId:'host-session',open:true,worldId:'foret',
 worldFingerprint:'abc',members:[{id:'host-id'},{id:'guest-id'}]};}
test('host saves exact official rules, camera and team size, never full save',()=>{
 const source=newSession('host-session',4);
 const setup=captureHostSetupFromSessionV1(source);
 assert.equal(setup.starterCount,4);
 assert.deepEqual(setup.rules,source.rules);
 assert.deepEqual(setup.cameraPolicy,source.cameraPolicy);
 assert.equal('inventory' in setup,false);
 assert.equal('party' in setup,false);
 assert.equal('hero' in setup,false);
});
test('guest receives room-authenticated host rules despite JSONB field ordering',()=>{
 const host=captureHostSetupFromSessionV1(newSession('host-session',3));
 const row={room_id:room().roomId,host_session_id:host.sessionId,
  starter_count:3,camera_policy:JSON.parse(JSON.stringify(host.cameraPolicy)),
  rules:JSON.parse(JSON.stringify(host.rules))};
 const setup=captureRoomSetupFromServerV1({room:room(),row});
 assert.equal(setup.starterCount,3);
 const guest={...newSession('guest-session',3,setup.rules),
  world:{mapRef:'foret',position:null}};
 assert.equal(captureGuestSessionMatchesHostSetupV1({room:room(),setup,session:guest}),true);
 const reversed=Object.fromEntries(Object.entries(setup.rules).reverse());
 assert.equal(captureGuestSessionMatchesHostSetupV1({
  room:room(),setup:{...setup,rules:reversed},session:guest}),true);
 assert.equal(captureGuestSessionMatchesHostSetupV1({
  room:room(),setup,session:{...guest,party:{...guest.party,reserve:[]}}}),true,
  'later team changes do not erase the saved character’s eligibility');
 assert.equal(captureGuestSessionMatchesHostSetupV1({
  room:room(),setup,session:{...guest,rules:SHOWCASE_ADVENTURE_RULES_V1,
   world:{mapRef:'other',position:null}}}),false);
});
test('guest cannot enter without host snapshot or canonical map',()=>{
 const connection={role:'guest',userId:'guest-id'};
 const setup=captureHostSetupFromSessionV1(newSession());
 const r=room();
 assert.equal(captureRoomEntryPresentationV1({connection,room:r,hostSetup:null}).enabled,false);
 assert.equal(captureRoomEntryPresentationV1({connection,
  room:{...r,worldId:null,worldFingerprint:null},hostSetup:setup}).enabled,false);
 assert.equal(captureRoomEntryPresentationV1({connection,room:r,hostSetup:setup}).action,'import');
 const after=captureRoomEntryPresentationV1({
  connection,room:r,hostSetup:setup,localWorldFingerprint:'abc'});
 assert.equal(after.action,'prepare');
 assert.match(after.hint,/règles de l’hôte|règles de l.hôte/i);
});
test('server snapshot is only visible to RLS members and immutable after host publish',()=>{
 const sql=read('supabase/migrations/20261114211230_gensrpg_capture_host_room_setup_v1.sql');
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/is_member\(room_id\)/);
 assert.match(sql,/REVOKE ALL ON public\.gensrpg_capture_room_setups/);
 assert.match(sql,/v_room\.owner_id IS DISTINCT FROM v_user/);
 assert.match(sql,/v_room\.adventure_session_id IS DISTINCT FROM p_session/);
 assert.match(sql,/The host room setup is immutable/);
 assert.match(sql,/DELETE FROM public\.gensrpg_capture_room_setups/);
 assert.doesNotMatch(sql,/\bz40k_[a-z_]+\b|DROP TABLE/i);
});
test('UI follows host rules and never blocks native world loading on network world upload',()=>{
 const app=read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const transport=read('assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs');
 const html=read('assets/gensrpg/capture-v2/adventure.html');
 assert.match(transport,/gensrpg_capture_publish_host_room_setup/);
 assert.match(transport,/gensrpg_capture_room_setups/);
 assert.match(app,/rules=guest\?setup\.rules:fromFields\(\)/);
 assert.match(app,/setup\.starterCount/);
 assert.match(app,/captureGuestSessionMatchesHostSetupV1/);
 assert.match(app,/pendingCaptureHostShare=shareForRoom/);
 assert.match(app,/void publishPendingCaptureWorld\(\)/);
 assert.ok(app.indexOf('frame.src=url.href')<app.indexOf('pendingCaptureHostShare=shareForRoom'),
  'The native frame must start before uploading the room WorldDocument');
 assert.match(html,/id="adventure-room-retry-share"/);
});
