import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1,
 DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {prepareCaptureHostSessionV1} from '../assets/gensrpg/capture-v2/adventure-room-host-flow-v1.mjs';
const now='2026-11-07T16:15:00.000Z';
const session=()=>createAdventureSessionV1({
 bestiaryCards:[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}],
 starterId:'lumilo',rules:SHOWCASE_ADVENTURE_RULES_V1,
 ids:{sessionId:'host-test-session',instanceId:'host-test-creature',creatorId:'owner-local'},now
});
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('RED: héberger une partie autorise ses invités en un clic, via le seul propriétaire AdventureSession',()=>{
 const source=session();
 assert.equal(source.sessionControl.joinEnabled,false);
 const prepared=prepareCaptureHostSessionV1({session:source,now});
 assert.equal(prepared.sessionControl.joinEnabled,true);
 assert.equal(prepared.sessionControl.hostIsGameMaster,false);
 assert.equal(prepared.sessionControl.creatorId,source.sessionControl.creatorId);
 assert.deepEqual(prepared.sessionControl.guestPermissions,DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1);
 assert.equal(source.sessionControl.joinEnabled,false,'no mutation of existing save before Core commit');
 assert.equal(prepareCaptureHostSessionV1({session:prepared,now}),prepared,'already open => no new save');
 assert.throws(()=>prepareCaptureHostSessionV1({session:null,now}),/partie|session/i);
});
test('RED: héberger est visible, sans réglage préalable caché; erreurs réseau sont présentées dans la salle',()=>{
 const html=read('assets/gensrpg/capture-v2/adventure.html');
 const app=read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 assert.match(html,/id="adventure-room-host" type="button">Créer un salon/);
 assert.match(html,/id="adventure-player-alias"[^>]+value="Joueur"/);
 assert.match(html,/id="adventure-room-status" role="status"/);
 assert.match(app,/\$\('adventure-room-host'\)\.disabled=!!activeCaptureRoom\|\|!state;/);
 assert.match(app,/prepareCaptureHostSessionV1\(\{session,now/);
 assert.match(app,/onlineRoomStatus\('Création du salon Monster Capture/);
 assert.match(app,/onlineRoomStatus\(error\.message,true\)/);
 assert.match(app,/store\.save\(prepared\)/);
});
