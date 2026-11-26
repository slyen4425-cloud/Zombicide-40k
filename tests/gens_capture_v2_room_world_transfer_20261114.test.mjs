import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importCaptureSharedWorldV1,preserveCaptureGuestDraftV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-world-transfer-v1.mjs';
import {captureRoomEntryPresentationV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-entry-presentation-v1.mjs';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const get=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const guest={userId:'u2',role:'guest',roomId:'r1'};
const room={open:true,sessionId:'host-session',worldId:'forest-world',worldFingerprint:'world:42',
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
test('authenticated guest imports official world once, never overwrites archived map',async()=>{
 const source=official();
 const first=await ingest(source);
 assert.deepEqual(first,{worldId:'forest-world',alreadyAvailable:false});
 assert.equal(source.logs.length,1);assert.equal(source.logs[0].replace,false);
 assert.equal(source.library.load('forest-world').signature,42);
 const repeated=await ingest(source);
 assert.equal(repeated.alreadyAvailable,true);
 assert.equal(source.logs.length,1,'second import is read-only');
});
test('host, outsiders, closed room, foreign or modified WorldDocument are all rejected before save',async()=>{
 const source=official();
 for(const connection of [{userId:'u1',role:'host'},{userId:'intruder',role:'guest'}])
  await assert.rejects(()=>ingest(source,{connection}),/invité|authentifié/);
 await assert.rejects(()=>ingest(source,{room:{...room,open:false}}),/invité|authentifié/);
 await assert.rejects(()=>ingest(source,{packet:{...packet,worldId:'foreign'}}),/ne correspond pas/i);
 await assert.rejects(()=>ingest(source,{packet:{...packet,serializedDocument:
  JSON.stringify({...original,signature:7})}}),/Empreinte/i);
 assert.equal(source.logs.length,0,'no write on invalid input');
});
test('existing official WorldDocument with same id but different content is kept intact',async()=>{
 const source=official();
 source.rows.set('forest-world',{...original,signature:99});
 await assert.rejects(()=>ingest(source),/nom mais son contenu diffère/i);
 assert.equal(source.rows.get('forest-world').signature,99);
 assert.equal(source.logs.length,0);
});
test('guest choice depends on verified fingerprint AND the host rules',()=>{
 const hostSetup={sessionId:'host-session',rules:SHOWCASE_ADVENTURE_RULES_V1,
  starterCount:1,cameraPolicy:{angleDeg:45,zoomPercent:175}};
 const newGuest=createAdventureSessionV1({
  bestiaryCards:[{id:'creature-a',name:'Moussado',rarity:'rare',
   skills:[{slot:'a',name:'Coup',state:'ready'}]}],
  starterId:'creature-a',starterIds:['creature-a'],rules:hostSetup.rules,
  ids:{sessionId:'guest-save',instanceId:'guest-creature-1',creatorId:'guest-creator'},
  now:'2026-11-14T20:30:00Z'
 });
 const session={...newGuest,world:{mapRef:'forest-world',position:null}};
 const need=captureRoomEntryPresentationV1({
  connection:guest,room,session,hostSetup,selectedWorldId:'forest-world',
  localWorldFingerprint:'other'});
 assert.equal(need.action,'import');
 const ready=captureRoomEntryPresentationV1({
  connection:guest,room,session,hostSetup,selectedWorldId:'forest-world',
  localWorldFingerprint:'world:42'});
 assert.equal(ready.action,'enter');
 assert.equal(ready.enabled,true);
 const noHost=captureRoomEntryPresentationV1({
  connection:guest,room,session,selectedWorldId:'forest-world',
  localWorldFingerprint:'world:42'});
 assert.equal(noHost.enabled,false,'guest cannot enter without host rules');
});
test('migration restricts read to members, uploads to host, keeps room binding sole owner and closes cleanly',()=>{
 const sql=get('supabase/migrations/20261114192645_gensrpg_capture_room_world_document_v1.sql');
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

test('guest local draft is archived additively, collision and unarchived edits never overwritten',async()=>{
 const source=official();
 const old={id:'my-local-draft',signature:99,areas:[{id:'local'}]};
 const result=await preserveCaptureGuestDraftV1({activeDraft:old,room,
  library:source.library,fingerprintOfficial:source.fingerprint});
 assert.equal(result.archived,true);
 assert.equal(source.library.load('my-local-draft'),old);
 assert.equal((await preserveCaptureGuestDraftV1({activeDraft:old,room,
  library:source.library,fingerprintOfficial:source.fingerprint})).archived,false);
 const unexpected={...old,signature:98};
 await assert.rejects(()=>preserveCaptureGuestDraftV1({activeDraft:unexpected,room,
  library:source.library,fingerprintOfficial:source.fingerprint}),/modifications/i);
 assert.equal(source.library.load('my-local-draft').signature,99);
 const sameId={...old,id:'forest-world'};
 await assert.rejects(()=>preserveCaptureGuestDraftV1({activeDraft:sameId,room,
  library:source.library,fingerprintOfficial:source.fingerprint}),/même nom/i);
 assert.ok(!source.rows.has('forest-world'));
});

test('host can copy or native-share the actual server invitation code; no fabricated URLs',()=>{
 const html=get('assets/gensrpg/capture-v2/adventure.html');
 const app=get('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 for(const id of ['adventure-room-share-actions','adventure-room-code-label',
  'adventure-room-copy','adventure-room-share'])
  assert.ok(html.includes('id="'+id+'"'),'missing server-code UI '+id);
 assert.match(app,/navigator\.clipboard\?\.writeText/);
 assert.match(app,/navigator\.share/);
 assert.match(app,/activeCaptureRoom\.code/);
 assert.match(app,/adventure-room-share-actions'\)\.hidden=response\.role!=='host'/);
 assert.doesNotMatch(app,/inviteUrl=|joinUrl=|\/\?room=/);
});

test('guest import waits for durable commit, then verifies stored fingerprint; rejected commit never acknowledges',async()=>{
 const source=official();let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const owner={...source.library,list:async()=>source.library.list(),load:async id=>source.library.load(id),save:async(...args)=>{await gate;source.library.save(...args);}};
 let done=false;
 const pending=ingest(source,{library:owner}).then(result=>{done=true;return result;});
 await Promise.resolve();await Promise.resolve();assert.equal(done,false);assert.equal(source.logs.length,0);
 release();assert.equal((await pending).worldId,room.worldId);assert.equal(source.logs.length,1);
 const rejected=official();const failed={...rejected.library,save:async()=>{throw Error('Quota exceeded');}};
 await assert.rejects(()=>ingest(rejected,{library:failed}),/Quota exceeded/);assert.equal(rejected.rows.size,0);
 const draft={id:'local-draft',signature:3};
 await assert.rejects(()=>preserveCaptureGuestDraftV1({activeDraft:draft,room,library:failed,fingerprintOfficial:rejected.fingerprint}),/Quota exceeded/);
 assert.equal(rejected.rows.size,0);
});
