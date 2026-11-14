import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importCaptureSharedWorldV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-world-transfer-v1.mjs';
import {captureRoomEntryPresentationV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-entry-presentation-v1.mjs';

const get=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const guest={userId:'u2',role:'guest',roomId:'r1'};
const room={open:true,worldId:'forest-world',worldFingerprint:'world:42',
 members:[{id:'u1',role:'host'},{id:'u2',role:'guest'}]};
const original={id:'forest-world',signature:42,areas:[{id:'area-1'}]};
const packet={worldId:room.worldId,worldFingerprint:room.worldFingerprint,
 serializedDocument:JSON.stringify(original)};
function official(){
 const rows=new Map(),logs=[];
 return {
  logs,
  library:{
   list:()=>[...rows.keys()].map(id=>({id})),
   load:id=>{if(!rows.has(id))throw Error('not stored');return rows.get(id);},
   save:(world,{replace}={})=>{
    logs.push({id:world.id,replace});
    if(rows.has(world.id))throw Error('Cannot overwrite');
    rows.set(world.id,world);
   }
  },
  parse:s=>JSON.parse(s),
  fingerprint:world=>'world:'+world.signature,
  rows
 };
}
const ingest=(source,opts={})=>importCaptureSharedWorldV1({
 connection:guest,room,packet,library:source.library,importOfficial:source.parse,
 fingerprintOfficial:source.fingerprint,...opts
});
test('authenticated guest imports official world once, never overwrites archived map',()=>{
 const source=official();
 const first=ingest(source);
 assert.deepEqual(first,{worldId:'forest-world',alreadyAvailable:false});
 assert.equal(source.logs.length,1);assert.equal(source.logs[0].replace,false);
 assert.equal(source.library.load('forest-world').signature,42);
 const repeated=ingest(source);
 assert.equal(repeated.alreadyAvailable,true);
 assert.equal(source.logs.length,1,'second import is read-only');
});
test('host, outsiders, closed room, foreign or modified WorldDocument are all rejected before save',()=>{
 const source=official();
 for(const connection of [{userId:'u1',role:'host'},{userId:'intruder',role:'guest'}])
  assert.throws(()=>ingest(source,{connection}),/invité|authentifié/);
 assert.throws(()=>ingest(source,{room:{...room,open:false}}),/invité|authentifié/);
 assert.throws(()=>ingest(source,{packet:{...packet,worldId:'foreign'}}),/ne correspond pas/i);
 assert.throws(()=>ingest(source,{packet:{...packet,serializedDocument:
  JSON.stringify({...original,signature:7})}}),/Empreinte/i);
 assert.equal(source.logs.length,0,'no write on invalid input');
});
test('existing official WorldDocument with same id but different content is kept intact',()=>{
 const source=official();
 source.rows.set('forest-world',{...original,signature:99});
 assert.throws(()=>ingest(source),/nom mais son contenu diffère/i);
 assert.equal(source.rows.get('forest-world').signature,99);
 assert.equal(source.logs.length,0);
});
test('guest choice depends on verified official fingerprint, not merely the map ID',()=>{
 const session={sessionId:'guest-save',status:'configured',
  world:{mapRef:'forest-world'}};
 const need=captureRoomEntryPresentationV1({
  connection:guest,room,session,selectedWorldId:'forest-world',localWorldFingerprint:'other'});
 assert.equal(need.action,'import');
 const ready=captureRoomEntryPresentationV1({
  connection:guest,room,session,selectedWorldId:'forest-world',localWorldFingerprint:'world:42'});
 assert.equal(ready.action,'enter');
 assert.equal(ready.enabled,true);
});
test('migration restricts read to members, uploads to host, keeps room binding sole owner and closes cleanly',()=>{
 const sql=get('supabase/migrations/20261114193500_gensrpg_capture_room_world_document_v1.sql');
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/i);
 assert.match(sql,/REVOKE ALL ON public\.gensrpg_capture_room_world_documents FROM PUBLIC, anon, authenticated/i);
 assert.match(sql,/USING \(gensrpg_capture_private\.is_member\(room_id\)\)/);
 assert.match(sql,/v_room\.owner_id<>v_user/i);
 assert.match(sql,/v_room\.world_fingerprint IS DISTINCT FROM p_world_fingerprint/i);
 assert.match(sql,/Only the authenticated Capture host/i);
 assert.match(sql,/DELETE FROM public\.gensrpg_capture_room_world_documents/i);
 assert.doesNotMatch(sql,/\bz40k_[a-z_]+\b/i);
});
test('UI and scoped transport call the REAL Exploration importer/library, not copy game data',()=>{
 const app=get('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const bridge=get('assets/gensrpg/capture-v2/adventure-multiplayer-play-bridge-v1.mjs');
 const transport=get('assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs');
 assert.match(app,/importWorldBuilderDocument/);
 assert.match(app,/serializeWorldBuilderDraft/);
 assert.match(app,/importCaptureSharedWorldV1/);
 assert.match(app,/fetchWorldDocument/);
 assert.match(app,/refreshWorldChoices/);
 assert.match(bridge,/publishWorldDocument/);
 assert.ok(bridge.indexOf('await transport.bindWorld')<bridge.indexOf('await transport.publishWorldDocument'));
 assert.match(transport,/gensrpg_capture_publish_world_document/);
 assert.match(transport,/gensrpg_capture_room_world_documents/);
 assert.doesNotMatch(transport,/z40k_|\.from\(['"]gensrpg\.capture\.v2\.adventure/i);
});
