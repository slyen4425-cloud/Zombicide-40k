// Monster Capture online: scoped Supabase transport, isolated from Survival.
// Only public room metadata; no AdventureSave, localStorage, IndexedDB, or
// z40k_* methods are ever sent, inspected or modified here.
// Backend owns room membership/capacity; this client cannot authorize itself.
import {
 ADVENTURE_SAVE_SCHEMA_V1,normalizeAdventureSessionControlSettingsV1
} from './adventure-contract-v1.mjs';
import {
 capturePeerPositionFromOfficialNavigationV1,capturePeerPositionListV1
} from './adventure-peer-position-v1.mjs';

const ROOM_TABLE='gensrpg_capture_rooms';
const MEMBERS_TABLE='gensrpg_capture_room_members';
const ROOM_TOPIC='gensrpg-capture-room:';
const ROOM_CODE=/^[A-HJ-NP-Z2-9]{10}$/;
const ROOM_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const displayName=value=>{
 const name=typeof value==='string'?value.trim():'';
 if(name.length<1||name.length>48)
  throw new RangeError('Choisis un pseudo de 1 à 48 caractères.');
 return name;
};
const checkUuid=value=>{
 if(typeof value!=='string'||!ROOM_ID.test(value))
  throw new TypeError('Identifiant de salle Supabase invalide');
 return value;
};
const result=(answer,context)=>{
 if(answer?.error)throw new Error(context+' : '+answer.error.message);
 return answer?.data;
};
const roomResult=data=>{
 const value=Array.isArray(data)?data[0]:data;
 if(!value||!checkUuid(value.room_id)||!ROOM_CODE.test(value.room_code))
  throw new Error('Réponse du serveur Capture non reconnue');
 return Object.freeze({roomId:value.room_id,code:value.room_code});
};
function verifySession(session){
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||
   typeof session.sessionId!=='string'||!session.sessionControl)
  throw new TypeError('Une sauvegarde Monster Capture officielle est nécessaire pour héberger');
 const control=session.sessionControl;
 const settings=normalizeAdventureSessionControlSettingsV1({
  hostIsGameMaster:control.hostIsGameMaster,joinEnabled:control.joinEnabled,
  guestPermissions:control.guestPermissions
 });
 if(!settings.joinEnabled)
  throw new Error('Active « Autoriser l’arrivée d’autres joueurs » dans Créateur/MJ');
 return settings;
}
// Multiple clients on one origin must have distinct auth persistence keys;
// app boot supplies a Capture-only client rather than reusing z40k's session.
export function createCaptureRoomTransportV1({client}={}){
 if(!client?.auth?.getSession||!client?.auth?.signInAnonymously||
   !client?.rpc||!client?.from||!client?.channel||!client?.removeChannel)
  throw new TypeError('Client Supabase authentifié requis');
 let channel=null, activeRoomId=null;
 async function authenticatedUserId(){
  let session=result(await client.auth.getSession(),'Session Supabase')?.session;
  if(!session){
   session=result(await client.auth.signInAnonymously(),
    'Connexion anonyme Capture')?.session;
  }
  const id=session?.user?.id;
  return checkUuid(id);
 }
 async function inspectRoom(roomId){
  const id=checkUuid(roomId);
  const room=result(await client.from(ROOM_TABLE).select(
   'id,code,owner_id,adventure_session_id,max_players,join_enabled,host_is_game_master,guest_permissions,open,revision,world_id,world_fingerprint'
  ).eq('id',id).maybeSingle(),'Lecture salle Monster Capture');
  if(!room)return null;
  const members=result(await client.from(MEMBERS_TABLE).select(
   'user_id,display_name,role,joined_at'
  ).eq('room_id',id).order('joined_at',{ascending:true}),
   'Lecture participants Monster Capture');
  if(!Array.isArray(members))throw new Error('Liste de joueurs indisponible');
  return Object.freeze({roomId:id,code:room.code,ownerId:room.owner_id,
   sessionId:room.adventure_session_id,maxPlayers:room.max_players,
   worldId:room.world_id??null,worldFingerprint:room.world_fingerprint??null,
   open:room.open,revision:room.revision,joinEnabled:room.join_enabled,
   members:members.map(m=>Object.freeze({id:m.user_id,name:m.display_name,role:m.role}))});
 }
 async function create({session,name,maxPlayers=2}={}){
  const settings=verifySession(session);
  const label=displayName(name);
  if(!Number.isSafeInteger(maxPlayers)||maxPlayers<2||maxPlayers>32)
   throw new RangeError('Capacité autorisée : entre 2 et 32 joueurs.');
  const userId=await authenticatedUserId();
  const reply=roomResult(result(await client.rpc('gensrpg_capture_create_room',{
   p_session_id:session.sessionId,p_max_players:maxPlayers,
   p_host_is_gm:settings.hostIsGameMaster,
   p_permissions:settings.guestPermissions,p_display_name:label
  }),'Création du salon Capture'));
  return Object.freeze({...reply,userId,role:'host'});
 }
 async function join({code,name}={}){
  const invitation=typeof code==='string'?code.trim().toUpperCase():'';
  if(!ROOM_CODE.test(invitation))throw new RangeError('Code Monster Capture de 10 caractères requis.');
  const label=displayName(name);
  const userId=await authenticatedUserId();
  const reply=roomResult(result(await client.rpc('gensrpg_capture_join_room',{
   p_code:invitation,p_display_name:label
  }),'Rejoindre le salon Capture'));
  return Object.freeze({...reply,userId,role:'guest'});
 }
 // This operation is host-only on the server. It does not serialize the
 // WorldDocument, only its canonical identity/fingerprint from Exploration.
 async function bindWorld({roomId,navigation}={}){
  const id=checkUuid(roomId),room=await inspectRoom(id);
  if(!room||!room.open)throw new Error('Salon Monster Capture introuvable ou fermé');
  const userId=await authenticatedUserId();
  if(room.ownerId!==userId)throw new Error('Seul le créateur du salon fixe le monde');
  const position=capturePeerPositionFromOfficialNavigationV1({
   navigation,sessionId:room.sessionId,
   worldId:navigation?.worldId,worldFingerprint:navigation?.worldFingerprint
  });
  if(room.worldId&&(room.worldId!==position.worldId||
    room.worldFingerprint!==position.worldFingerprint))
   throw new Error('Un autre WorldDocument est déjà associé à ce salon');
  result(await client.rpc('gensrpg_capture_bind_world',{
   p_room:id,p_world_id:position.worldId,
   p_world_fingerprint:position.worldFingerprint
  }),'Associer le monde Exploration au salon');
  if(activeRoomId===id&&typeof channel?.send==='function'){
   try{await channel.send({type:'broadcast',
    event:'capture-room-refresh-v1',payload:{}});}
   catch{ /* Canonical server binding succeeded; notification is best-effort. */ }
  }
  return Object.freeze({roomId:id,
   worldId:position.worldId,worldFingerprint:position.worldFingerprint});
 }
 async function ownPositionSequence(roomId){
  const id=checkUuid(roomId),user=await authenticatedUserId();
  const position=result(await client.from('gensrpg_capture_peer_positions')
   .select('seq').eq('room_id',id).eq('user_id',user).maybeSingle(),
   'Lecture révision de la position du joueur');
  const seq=Number(position?.seq??0);
  if(!Number.isSafeInteger(seq)||seq<0)throw new Error('Révision serveur de position invalide');
  return seq;
 }
 // The only accepted position is read from the official Exploration
 // checkpoint/event. Actor identity is NOT sent: PostgreSQL uses auth.uid().
 async function reportPosition({roomId,navigation,expectedSeq}={}){
  const id=checkUuid(roomId);
  const previous=expectedSeq===undefined
   ?await ownPositionSequence(id):expectedSeq;
  if(!Number.isSafeInteger(previous)||previous<0)
   throw new RangeError('Compteur de position invalide');
  const room=await inspectRoom(id);
  if(!room?.open||!room.worldId||!room.worldFingerprint)
   throw new Error('Le monde du salon n’est pas encore défini');
  const position=capturePeerPositionFromOfficialNavigationV1({
   navigation,sessionId:navigation?.sessionId,
   worldId:room.worldId,worldFingerprint:room.worldFingerprint
  });
  const seq=Number(result(await client.rpc('gensrpg_capture_report_position',{
   p_room:id,p_world_id:position.worldId,
   p_world_fingerprint:position.worldFingerprint,
   p_area_id:position.areaId,p_x:position.x,p_y:position.y,
   p_expected_seq:previous
  }),'Publier la position officielle Exploration'));
  if(!Number.isSafeInteger(seq)||seq!==previous+1)
   throw new Error('Révision de position serveur inattendue');
  if(activeRoomId===id&&typeof channel?.send==='function'){
   try{await channel.send({type:'broadcast',
    event:'capture-peer-position-changed-v1',payload:{}});}
   catch{ /* No rollback: authenticated server position is already durable. */ }
  }
  return seq;
 }
 async function inspectPositions({roomId,ownActorId,previousSequences={}}={}){
  const id=checkUuid(roomId),user=checkUuid(ownActorId);
  const room=await inspectRoom(id);
  if(!room?.open||!room.worldId||!room.worldFingerprint)
   return Object.freeze({actors:Object.freeze([]),
    sequences:Object.freeze({...previousSequences})});
  const rows=result(await client.from('gensrpg_capture_peer_positions').select(
   'room_id,user_id,world_id,world_fingerprint,area_id,x,y,seq,updated_at'
  ).eq('room_id',id).order('updated_at',{ascending:true}),
   'Lecture des joueurs du même monde');
  return capturePeerPositionListV1({
   rows,roomId:id,worldId:room.worldId,
   worldFingerprint:room.worldFingerprint,
   participants:room.members.map(member=>member.id),
   ownActorId:user,previousSequences
  });
 }
 async function observe({roomId,userId,onChange,onStatus}={}){
  const id=checkUuid(roomId),user=checkUuid(userId);
  if(typeof onChange!=='function')throw new TypeError('Callback salle requis');
  await dispose();
  activeRoomId=id;
  const update=()=>{void inspectRoom(id).then(state=>{
   if(activeRoomId===id)onChange(state);
  }).catch(error=>onStatus?.('Erreur lecture salon : '+error.message));};
  const next=client.channel(ROOM_TOPIC+id,{
   config:{private:true,presence:{key:user}}
  });
  channel=next;
  next.on('presence',{event:'sync'},update);
  next.on('broadcast',{event:'capture-room-refresh-v1'},update);
  // Untrusted notification contains NO coordinates or player identities:
  // the only authority is the RLS-protected Capture peer table read.
  next.on('broadcast',{event:'capture-peer-position-changed-v1'},update);
  next.subscribe(status=>{
   if(activeRoomId!==id)return;
   if(status==='SUBSCRIBED'){
    onStatus?.('Salon connecté');
    update();
    void next.track({ready:true}).catch(error=>
     onStatus?.('Présence indisponible : '+error.message));
   }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
    onStatus?.('Connexion salon interrompue : '+status);
   }
  });
  update();
  return Object.freeze({roomId:id,topic:ROOM_TOPIC+id});
 }
 async function leave({roomId}={}){
  const id=checkUuid(roomId);
  try{result(await client.rpc('gensrpg_capture_leave_room',{p_room:id}),
    'Quitter le salon Capture');}
  finally{await dispose();}
 }
 async function dispose(){
  activeRoomId=null;
  const previous=channel;channel=null;
  if(previous)await client.removeChannel(previous);
 }
 return Object.freeze({authenticatedUserId,create,join,inspectRoom,
  bindWorld,ownPositionSequence,reportPosition,inspectPositions,observe,leave,dispose});
}
