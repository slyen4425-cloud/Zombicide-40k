import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureRoomEntryPresentationV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-entry-presentation-v1.mjs';

const textFile=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const host={roomId:'r1',userId:'u1',role:'host'};
const guest={roomId:'r1',userId:'u2',role:'guest'};
const room={open:true,sessionId:'s1',worldId:null,worldFingerprint:null,
 members:[{id:'u1',role:'host'},{id:'u2',role:'guest'}]};
const session=(id='s1',world=null)=>({sessionId:id,world:{mapRef:world},status:'configured'});

test('one host session only: mismatched save cannot enter, original save can',()=>{
 const blocked=captureRoomEntryPresentationV1({connection:host,room,session:session('s2')});
 assert.equal(blocked.enabled,false);assert.match(blocked.hint,/sauvegarde/i);
 const ready=captureRoomEntryPresentationV1({connection:host,room,session:session()});
 assert.equal(ready.action,'enter');assert.equal(ready.enabled,true);
});
test('invited newcomer gets a real preparation action instead of dead-end lobby',()=>{
 const invited=captureRoomEntryPresentationV1({connection:guest,room,session:null});
 assert.equal(invited.action,'prepare');assert.equal(invited.enabled,true);
 assert.match(invited.hint,/propre aventure/i);
 const waiting=captureRoomEntryPresentationV1({connection:guest,room,session:session('g1','world-one')});
 assert.equal(waiting.enabled,false);assert.match(waiting.hint,/créateur doit/i);
});
test('guest can enter only when host world is bound and local map agrees',()=>{
 const bound={...room,worldId:'world-one',worldFingerprint:'official-fingerprint'};
 const wrong=captureRoomEntryPresentationV1({connection:guest,room:bound,session:session('g1','world-two')});
 assert.equal(wrong.enabled,false);assert.match(wrong.hint,/WorldDocument/i);
 const same=captureRoomEntryPresentationV1({connection:guest,room:bound,session:session('g1','world-one')});
 assert.equal(same.action,'enter');assert.equal(same.enabled,true);
 assert.match(same.hint,/empreinte exacte/i);
});
test('unknown room, unknown member and disconnected player never obtain entry',()=>{
 assert.equal(captureRoomEntryPresentationV1({connection:guest,room:{...room,open:false},session:session()}).enabled,false);
 assert.equal(captureRoomEntryPresentationV1({connection:{...guest,userId:'other'},room,session:session()}).enabled,false);
 assert.equal(captureRoomEntryPresentationV1({connection:null}).visible,false);
});
test('real Capture app guards host before a new save write and delegates guest launch to ONE play owner',()=>{
 const src=textFile('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const html=textFile('assets/gensrpg/capture-v2/adventure.html');
 for(const id of ['adventure-room-enter','adventure-room-entry-hint'])
  assert.ok(html.includes('id="'+id+'"'),'missing lobby affordance '+id);
 const begin=src.indexOf("('adventure-create').addEventListener('click'");
 const end=src.indexOf("('adventure-world-builder').addEventListener",begin);
 assert.ok(begin>=0&&end>begin,'must find canonical create handler');
 const code=src.slice(begin,end);
 assert.ok(code.indexOf("activeCaptureRoom?.role==='host'")>=0,'host session cannot drift');
 assert.ok(code.indexOf("activeCaptureRoom?.role==='host'")<code.indexOf('portfolio.create(created)'),
   'guard must run before save creation');
 assert.match(src,/newlyCreatedAdventureId!==session\.sessionId/);
 assert.match(src,/captureRoomEntryPresentationV1/);
 assert.match(src,/if\(response\.role==='guest'\)/);
 assert.match(src,/\$\('adventure-play'\)\.click\(\)/);
 assert.doesNotMatch(textFile('assets/gensrpg/capture-v2/adventure-multiplayer-entry-presentation-v1.mjs'),
   /localStorage|indexedDB|createNewExplorationPlay|\.rpc\(/i);
});
