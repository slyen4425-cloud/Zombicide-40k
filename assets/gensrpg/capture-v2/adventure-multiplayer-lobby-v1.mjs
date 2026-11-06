// Monster Capture — ephemeral multiplayer lobby contract, NOT a save or network service.
// Transport MUST provide authenticated identity and serialize writes server-side.
// Core Storage remains the only owner of AdventureSave and its world/inventory;
// official Exploration/Combat are the only owners of movement/combat gameplay.
import {
 ADVENTURE_SAVE_SCHEMA_V1,normalizeAdventureSessionControlSettingsV1
} from './adventure-contract-v1.mjs';

export const CAPTURE_LOBBY_SCHEMA_V1='gensrpg-capture-multiplayer-lobby-v1';
const INVITE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 unambiguous glyphs
const INVITE_FORMAT=/^[A-HJ-NP-Z2-9]{8,12}$/;
const ACTIONS=Object.freeze(new Set([
 'editProgression','editRewards','editWorld','allocateOwnCreatureStats'
]));
const freeze=value=>{
 if(value&&typeof value==='object'){
  for(const child of Object.values(value))freeze(child);
  Object.freeze(value);
 }
 return value;
};
const identity=(id,field)=>{
 if(typeof id!=='string'||!/^[A-Za-z0-9._:-]{1,128}$/.test(id))
  throw new TypeError(field+' must come from the authenticated identity provider');
 return id;
};
const timestamp=now=>{
 if(typeof now!=='string'||!Number.isFinite(Date.parse(now))||
   new Date(now).toISOString()!==now)
  throw new TypeError('Valid ISO timestamp required');
 return now;
};
const capacity=value=>{
 if(!Number.isSafeInteger(value)||value<2)
  throw new RangeError('Room capacity must be an editable integer of at least 2');
 return value;
};
const revision=value=>{
 if(!Number.isSafeInteger(value)||value<0)
  throw new RangeError('Room revision must be a nonnegative integer');
 return value;
};
const code=value=>{
 if(typeof value!=='string'||!INVITE_FORMAT.test(value))
  throw new RangeError('Invalid invitation code');
 return value;
};
const member=actor=>{
 if(!actor||typeof actor!=='object'||Array.isArray(actor))
  throw new TypeError('Authenticated actor required');
 const id=identity(actor.id,'authenticated actor id');
 const name=actor.name;
 if(typeof name!=='string'||name.trim().length<1||name.trim().length>48)
  throw new RangeError('Participant display name must have 1 to 48 characters');
 return {id,name:name.trim()};
};
function currentLobby(raw){
 if(!raw||typeof raw!=='object'||raw.schema!==CAPTURE_LOBBY_SCHEMA_V1||
   raw.version!==1)
  throw new TypeError('Unknown Capture lobby schema/version');
 identity(raw.ownerId,'room owner id');
 identity(raw.sessionId,'room session id');
 code(raw.inviteCode);capacity(raw.maxPlayers);revision(raw.revision);
 if(typeof raw.open!=='boolean'||!Array.isArray(raw.participants))
  throw new TypeError('Invalid room status or member list');
 if(raw.participants.length>raw.maxPlayers)
  throw new RangeError('Room capacity exceeded');
 const ids=new Set();
 for(const p of raw.participants){
  const m=member(p);
  if(ids.has(m.id))throw new Error('Duplicate participant');
  ids.add(m.id);
  if(p.role!==(m.id===raw.ownerId?'host':'guest'))
   throw new TypeError('Room participant role mismatch');
 }
 if(raw.open&&!ids.has(raw.ownerId))
  throw new TypeError('Active room must retain its creator');
 if(!raw.permissions||typeof raw.permissions!=='object')
  throw new TypeError('Missing canonical session policy');
 normalizeAdventureSessionControlSettingsV1({
  hostIsGameMaster:raw.hostIsGameMaster,joinEnabled:raw.joinEnabled,
  guestPermissions:raw.permissions
 });
 return raw;
}
function nextRoom(room,changes,now){
 const nextRevision=revision(room.revision+1);
 return freeze({...room,...changes,revision:nextRevision,updatedAt:timestamp(now)});
}
function expected(room,value){
 if(revision(value)!==room.revision)
  throw new Error('Stale room revision; refresh before applying an operation');
}
function creator(room,authenticatedActorId){
 if(identity(authenticatedActorId,'authenticated actor id')!==room.ownerId)
  throw new Error('Only the creator/owner may change this room');
}
function sessionPolicy(session){
 if(!session||session.schema!==ADVENTURE_SAVE_SCHEMA_V1||session.version!==1||
   !session.sessionControl)
  throw new TypeError('Existing canonical AdventureSession with creator policy required');
 const policy=session.sessionControl;
 const settings=normalizeAdventureSessionControlSettingsV1({
  hostIsGameMaster:policy.hostIsGameMaster,joinEnabled:policy.joinEnabled,
  guestPermissions:policy.guestPermissions
 });
 identity(policy.creatorId,'local session creator id');
 return {sessionId:identity(session.sessionId,'session id'),settings};
}
// Cryptographic randomness is obligatory. No Math.random fallback, no generated
// IDs in the UI. The authenticated backend must enforce code uniqueness.
export function createCaptureInviteCodeV1({cryptoProvider=globalThis.crypto,length=8}={}){
 if(!Number.isSafeInteger(length)||length<8||length>12)
  throw new RangeError('Invitation code length must be 8–12');
 if(!cryptoProvider||typeof cryptoProvider.getRandomValues!=='function')
  throw new TypeError('Cryptographic getRandomValues provider required');
 const bytes=new Uint8Array(length);
 cryptoProvider.getRandomValues(bytes);
 return [...bytes].map(byte=>INVITE_ALPHABET[byte%INVITE_ALPHABET.length]).join('');
}
// The lobby is a *minimal projection*: it never carries a hero, creature,
// inventory, world map, rule set, results, or the full AdventureSave.
export function createCaptureLobbyV1({session,host,maxPlayers,inviteCode,now}={}){
 const source=sessionPolicy(session);
 const person=member(host);
 // creatorId in a saved AdventureSession is LOCAL and randomly generated.
 // The online host identity is supplied by server-verified authentication;
 // never assume those two different identity namespaces match.
 if(!source.settings.joinEnabled)
  throw new Error('Joining this AdventureSession is disabled by its creator');
 return freeze({
  schema:CAPTURE_LOBBY_SCHEMA_V1,version:1,
  sessionId:source.sessionId,ownerId:person.id,
  inviteCode:code(inviteCode),maxPlayers:capacity(maxPlayers),
  revision:0,open:true,
  hostIsGameMaster:source.settings.hostIsGameMaster,joinEnabled:true,
  permissions:{...source.settings.guestPermissions},
  participants:[{...person,role:'host',joinedAt:timestamp(now)}],
  createdAt:now,updatedAt:now
 });
}
// authenticatedActor MUST be taken from the server's verified auth context,
// not from a payload submitted by a remote participant. Client-side use alone
// cannot authorize network joins.
export function joinCaptureLobbyV1({
 lobby,authenticatedActor,inviteCode,expectedRevision,now
}={}){
 const room=currentLobby(lobby);
 expected(room,expectedRevision);
 if(!room.open||!room.joinEnabled)throw new Error('Room is closed to guests');
 if(code(inviteCode)!==room.inviteCode)throw new Error('Wrong invitation code');
 const person=member(authenticatedActor);
 if(room.participants.some(p=>p.id===person.id))
  throw new Error('Participant already present in this room');
 if(room.participants.length>=room.maxPlayers)
  throw new Error('Room is full; capacity reached');
 return nextRoom(room,{participants:[
  ...room.participants,{...person,role:'guest',joinedAt:timestamp(now)}
 ]},now);
}
export function updateCaptureLobbyV1({
 lobby,authenticatedActorId,expectedRevision,open,maxPlayers,now
}={}){
 const room=currentLobby(lobby);
 expected(room,expectedRevision);creator(room,authenticatedActorId);
 if(!room.open)throw new Error('A closed room cannot be reopened');
 const nextOpen=open===undefined?room.open:open;
 if(typeof nextOpen!=='boolean')throw new TypeError('Room open flag must be boolean');
 const max=maxPlayers===undefined?room.maxPlayers:capacity(maxPlayers);
 if(max<room.participants.length)
  throw new RangeError('Room capacity cannot shrink below connected participants');
 return nextRoom(room,{open:nextOpen,maxPlayers:max},now);
}
export function leaveCaptureLobbyV1({
 lobby,authenticatedActorId,expectedRevision,now
}={}){
 const room=currentLobby(lobby);
 expected(room,expectedRevision);
 const id=identity(authenticatedActorId,'authenticated actor id');
 if(!room.participants.some(p=>p.id===id))
  throw new Error('Participant is not in this room');
 if(id===room.ownerId)
  return nextRoom(room,{open:false,participants:[]},now);
 return nextRoom(room,{participants:room.participants.filter(p=>p.id!==id)},now);
}
// This is a preliminary allow-list for commands. Authorized gameplay actions
// still need the canonical session, Combat/Exploration ownership and a server
// authorization check at commit. The lobby itself never writes those states.
export function authorizeCaptureLobbyActionV1({
 lobby,authenticatedActorId,action,targetParticipantId
}={}){
 let room;
 try{room=currentLobby(lobby);}catch{return false;}
 if(!room.open||!ACTIONS.has(action))return false;
 if(typeof authenticatedActorId!=='string')return false;
 const present=room.participants.some(p=>p.id===authenticatedActorId);
 if(!present)return false;
 if(authenticatedActorId===room.ownerId)return true;
 if(!room.permissions[action])return false;
 if(action==='allocateOwnCreatureStats')
  return targetParticipantId===authenticatedActorId;
 return true;
}
