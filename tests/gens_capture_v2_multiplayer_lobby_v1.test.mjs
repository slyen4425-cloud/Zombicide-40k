import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createAdventureSessionV1,updateAdventureSessionControlV1,SHOWCASE_ADVENTURE_RULES_V1,
 DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {
 createCaptureInviteCodeV1,createCaptureLobbyV1,joinCaptureLobbyV1,
 leaveCaptureLobbyV1,updateCaptureLobbyV1,authorizeCaptureLobbyActionV1
} from '../assets/gensrpg/capture-v2/adventure-multiplayer-lobby-v1.mjs';

const when='2026-11-06T17:00:00.000Z';
const participant=(id,name)=>({id,name});
const host=participant('auth-host-a','Créateur');
const guest=participant('guest-b','Invité B');
const guest2=participant('guest-c','Invité C');
const makeSession=({joinEnabled=true,editRewards=false}={})=>{
 const base=createAdventureSessionV1({
  bestiaryCards:[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}],
  starterId:'lumilo',rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId:'capture-game-a',instanceId:'creature-a',creatorId:'local-game-creator'},
  now:when
 });
 return updateAdventureSessionControlV1({session:base,now:when,settings:{
  hostIsGameMaster:true,joinEnabled,
  guestPermissions:{...DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1,editRewards}
 }});
};
const setup=(maxPlayers=2)=>createCaptureLobbyV1({
 session:makeSession(),host,maxPlayers,inviteCode:'ABC234XY',now:when
});
const join=(lobby,actor=guest,code='ABC234XY')=>joinCaptureLobbyV1({
 lobby,authenticatedActor:actor,inviteCode:code,expectedRevision:lobby.revision,now:when
});

test('invite generated from injected cryptographic random, never Math.random or manual IDs',()=>{
 const cryptoProvider={getRandomValues(bytes){bytes.set([0,1,2,3,4,5,6,7]);return bytes;}};
 assert.equal(createCaptureInviteCodeV1({cryptoProvider}), 'ABCDEFGH');
 assert.throws(()=>createCaptureInviteCodeV1({cryptoProvider:{}}),/crypto|getRandomValues/i);
});

test('two actual identities join one Capture lobby; only references, never a second saved game',()=>{
 const lobby=setup();
 assert.equal(lobby.schema,'gensrpg-capture-multiplayer-lobby-v1');
 assert.equal(lobby.sessionId,'capture-game-a');
 assert.equal(lobby.ownerId,'auth-host-a','authenticated network identity is distinct from the locally generated save creatorId');
 assert.equal(lobby.maxPlayers,2);
 assert.deepEqual(lobby.participants.map(p=>p.id),['auth-host-a']);
 const second=join(lobby);
 assert.equal(second.revision,1);
 assert.deepEqual(second.participants.map(p=>p.id),['auth-host-a','guest-b']);
 assert.equal(second.participants[1].role,'guest');
 assert.equal(Object.hasOwn(second,'party'),false);
 assert.equal(Object.hasOwn(second,'inventory'),false);
 assert.equal(Object.hasOwn(second,'rules'),false);
 assert.equal(Object.hasOwn(second,'world'),false);
 assert.equal(Object.hasOwn(second,'hero'),false);
 assert.equal(Object.hasOwn(second,'save'),false);
 assert.deepEqual(lobby.participants.map(p=>p.id),['auth-host-a'],'original immutable');
 assert.ok(Object.isFrozen(second));
 assert.ok(Object.isFrozen(second.participants));
});

test('closed invites, wrong code, duplicate identities and full room all fail closed',()=>{
 const denied=makeSession({joinEnabled:false});
 assert.throws(()=>createCaptureLobbyV1({session:denied,host,maxPlayers:2,inviteCode:'ABC234XY',now:when}),/invit|rejoind|désactiv|join/i);
 assert.throws(()=>createCaptureLobbyV1({session:makeSession(),host:{id:'',name:'Anonyme'},maxPlayers:2,inviteCode:'ABC234XY',now:when}),/authenticat|identity/i);
 const lobby=setup();
 assert.throws(()=>join(lobby,guest,'BADCODE'),/code|invit/i);
 assert.throws(()=>join(lobby,host),/déjà|already|présent/i);
 const full=join(lobby);
 assert.throws(()=>join(full,guest2),/plein|full|capacit/i);
 assert.throws(()=>join(full,guest),/déjà|already|présent/i);
});

test('configurable lobby size supports more than 2, but cannot shrink under presence',()=>{
 const a=setup(12);
 const b=join(a);
 const c=joinCaptureLobbyV1({lobby:b,authenticatedActor:guest2,inviteCode:'ABC234XY',expectedRevision:b.revision,now:when});
 assert.equal(c.participants.length,3);
 assert.equal(c.maxPlayers,12);
 assert.throws(()=>updateCaptureLobbyV1({lobby:c,authenticatedActorId:host.id,
  expectedRevision:c.revision,maxPlayers:2,now:when}),/capacit|présent|connected/i);
 const d=updateCaptureLobbyV1({lobby:c,authenticatedActorId:host.id,
  expectedRevision:c.revision,maxPlayers:8,now:when});
 assert.equal(d.maxPlayers,8);
});

test('only the real owner can change policy or close; replay and stale revisions fail',()=>{
 const lobby=setup(3);
 assert.throws(()=>updateCaptureLobbyV1({lobby,authenticatedActorId:guest.id,
  expectedRevision:0,open:false,now:when}),/creator|propriétaire|owner/i);
 const b=join(lobby);
 assert.throws(()=>joinCaptureLobbyV1({lobby:b,authenticatedActor:guest2,
  inviteCode:'ABC234XY',expectedRevision:0,now:when}),/revision|périmé|stale/i);
 const closed=updateCaptureLobbyV1({lobby:b,authenticatedActorId:host.id,
  expectedRevision:b.revision,open:false,now:when});
 assert.equal(closed.open,false);
 assert.throws(()=>join(closed,guest2),/ferm|closed/i);
 assert.throws(()=>leaveCaptureLobbyV1({lobby:closed,authenticatedActorId:guest.id,
  expectedRevision:0,now:when}),/revision|périmé|stale/i);
});

test('guest permissions are projected from the real AdventureSession and scoped to own creature',()=>{
 const lobby=createCaptureLobbyV1({session:makeSession({editRewards:true}),
  host,maxPlayers:2,inviteCode:'ABC234XY',now:when});
 const withGuest=join(lobby);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:guest.id,
  action:'editRewards'}),true);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:guest.id,
  action:'editWorld'}),false);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:guest.id,
  action:'allocateOwnCreatureStats',targetParticipantId:guest.id}),true);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:guest.id,
  action:'allocateOwnCreatureStats',targetParticipantId:host.id}),false);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:guest2.id,
  action:'editRewards'}),false);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:host.id,
  action:'editWorld'}),true);
 assert.equal(authorizeCaptureLobbyActionV1({lobby:withGuest,authenticatedActorId:guest.id,
  action:'startPvP'}),false,'unknown and cross-module operations are never authorized');
});

test('leaving room removes one guest only; host departure closes room without writing saves',()=>{
 const lobby=join(setup());
 const after=leaveCaptureLobbyV1({lobby,authenticatedActorId:guest.id,
  expectedRevision:lobby.revision,now:when});
 assert.deepEqual(after.participants.map(p=>p.id),[host.id]);
 assert.equal(after.open,true);
 const closed=leaveCaptureLobbyV1({lobby:after,authenticatedActorId:host.id,
  expectedRevision:after.revision,now:when});
 assert.equal(closed.open,false);
 assert.deepEqual(closed.participants,[]);
 assert.throws(()=>join(closed),/ferm|closed/i);
});

test('lobby transport rejects injected save fields and tampered participants before projecting anything',()=>{
 const lobby=setup(3);
 const forged={...lobby,inventory:{currency:999},world:{mapRef:'secret'}};
 assert.throws(()=>joinCaptureLobbyV1({lobby:forged,authenticatedActor:guest,
  inviteCode:'ABC234XY',expectedRevision:0,now:when}),/unexpected|inconnu|field|schema/i);
 const fakeMember={...lobby,participants:[...lobby.participants,
  {id:guest.id,name:guest.name,role:'host',joinedAt:when}]};
 assert.throws(()=>joinCaptureLobbyV1({lobby:fakeMember,authenticatedActor:guest2,
  inviteCode:'ABC234XY',expectedRevision:0,now:when}),/role|host|propriétaire/i);
 const forgedSettings={...lobby,permissions:{...lobby.permissions,editWorld:'yes'}};
 assert.equal(authorizeCaptureLobbyActionV1({lobby:forgedSettings,authenticatedActorId:guest.id,
  action:'editWorld'}),false,'invalid persisted permission must never grant access');
});
