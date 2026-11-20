// Monster Capture online: scoped Supabase transport, isolated from Survival.
// Only public room metadata; no AdventureSave, localStorage, IndexedDB, or
// cross-module Survival methods are ever sent, inspected or modified here.
// Backend owns room membership/capacity; this client cannot authorize itself.
import {
 ADVENTURE_SAVE_SCHEMA_V1,normalizeAdventureSessionControlSettingsV1
} from './adventure-contract-v1.mjs';
import {
 capturePeerPositionFromOfficialNavigationV1,capturePeerPositionListV1
} from './adventure-peer-position-v1.mjs';
import {captureHostSetupFromSessionV1,captureRoomSetupFromServerV1}
 from './adventure-multiplayer-host-setup-v1.mjs';

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
 let channel=null, activeRoomId=null,subscriptionGeneration=0;
 // Only a read-through cache. Server RLS / sequenced RPC stays authoritative.
 let observedRoom=null;
 const confirmedPositionSequences=new Map();
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
  const setup=captureHostSetupFromSessionV1(session);
  const label=displayName(name);
  if(!Number.isSafeInteger(maxPlayers)||maxPlayers<2||maxPlayers>32)
   throw new RangeError('Capacité autorisée : entre 2 et 32 joueurs.');
  const userId=await authenticatedUserId();
  const reply=roomResult(result(await client.rpc('gensrpg_capture_create_room',{
   p_session_id:session.sessionId,p_max_players:maxPlayers,
   p_host_is_gm:settings.hostIsGameMaster,
   p_permissions:settings.guestPermissions,p_display_name:label
  }),'Création du salon Capture'));
  // The host is the ONLY rules owner. Keep an immutable projection in the
  // room before accepting guests; abort a partial room on upload failure.
  try{
   result(await client.rpc('gensrpg_capture_publish_host_room_setup',{
    p_room:reply.roomId,p_session:setup.sessionId,p_rules:setup.rules,
    p_count:setup.starterCount,p_camera:setup.cameraPolicy
   }),'Publier les règles du créateur');
  }catch(error){
   try{await client.rpc('gensrpg_capture_leave_room',{p_room:reply.roomId});}
   catch{ /* Original upload error remains authoritative. */ }
   throw error;
  }
  return Object.freeze({...reply,userId,role:'host'});
 }
 async function fetchRoomSetup({roomId}={}){
  const id=checkUuid(roomId),room=await inspectRoom(id);
  if(!room?.open)throw new Error('Salon fermé : aucune configuration disponible');
  const row=result(await client.from('gensrpg_capture_room_setups')
   .select('room_id,host_session_id,rules,starter_count,camera_policy')
   .eq('room_id',id).maybeSingle(),'Lire les règles du créateur');
  return row?captureRoomSetupFromServerV1({room,row}):null;
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
 // The existing bound room identity is authoritative. This Snapshot uses
 // the official Exploration serializer and never carries AdventureSave.
 async function publishWorldDocument({roomId,worldId,worldFingerprint,serializedDocument}={}){
  const id=checkUuid(roomId);
  if(typeof worldId!=='string'||!worldId||
     typeof worldFingerprint!=='string'||!worldFingerprint||
     typeof serializedDocument!=='string'||serializedDocument.length<16)
   throw new TypeError('WorldDocument Exploration officiel requis');
  result(await client.rpc('gensrpg_capture_publish_world_document',{
   p_room:id,p_world_id:worldId,p_world_fingerprint:worldFingerprint,
   p_document:serializedDocument
  }),'Partager le monde Exploration officiel');
  if(activeRoomId===id&&typeof channel?.send==='function'){
   try{await channel.send({type:'broadcast',
    event:'capture-room-refresh-v1',payload:{}});}
   catch{ /* Server upload already committed; broadcast is best-effort. */ }
  }
  return true;
 }
 async function fetchWorldDocument({roomId}={}){
  const id=checkUuid(roomId);
  const row=result(await client.from('gensrpg_capture_room_world_documents')
   .select('world_id,world_fingerprint,document_text')
   .eq('room_id',id).maybeSingle(),'Recevoir le WorldDocument du salon');
  if(!row)return null;
  if(typeof row.world_id!=='string'||typeof row.world_fingerprint!=='string'||
     typeof row.document_text!=='string')
   throw new Error('WorldDocument du créateur incomplet');
  return Object.freeze({worldId:row.world_id,
   worldFingerprint:row.world_fingerprint,serializedDocument:row.document_text});
 }
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
  if(activeRoomId===id&&observedRoom?.roomId===id)
   observedRoom=Object.freeze({...observedRoom,
    worldId:position.worldId,worldFingerprint:position.worldFingerprint});
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
  confirmedPositionSequences.set(id,seq);
  return seq;
 }
 // The only accepted position is read from the official Exploration
 // checkpoint/event. Actor identity is NOT sent: PostgreSQL uses auth.uid().
 async function reportPosition({roomId,navigation,expectedSeq}={}){
  const id=checkUuid(roomId);
  const previous=expectedSeq===undefined
   ?(confirmedPositionSequences.get(id)??await ownPositionSequence(id)):expectedSeq;
  if(!Number.isSafeInteger(previous)||previous<0)
   throw new RangeError('Compteur de position invalide');
  // Avoid three REST roundtrips per online pose. Every write remains checked
  // server-side for membership, world/fingerprint, open room and expected seq.
  const known=activeRoomId===id&&observedRoom?.roomId===id&&
   observedRoom.worldId&&observedRoom.worldFingerprint?observedRoom:null;
  const room=known??await inspectRoom(id);
  if(!room?.open||!room.worldId||!room.worldFingerprint)
   throw new Error('Le monde du salon n’est pas encore défini');
  const position=capturePeerPositionFromOfficialNavigationV1({
   navigation,sessionId:navigation?.sessionId,
   worldId:room.worldId,worldFingerprint:room.worldFingerprint
  });
  let seq;
  try{
   seq=Number(result(await client.rpc('gensrpg_capture_report_position',{
   p_room:id,p_world_id:position.worldId,
   p_world_fingerprint:position.worldFingerprint,
   p_area_id:position.areaId,p_x:position.x,p_y:position.y,
   p_expected_seq:previous
  }),'Publier la position officielle Exploration'));
  }catch(error){
   confirmedPositionSequences.delete(id);
   throw error;
  }
  if(!Number.isSafeInteger(seq)||seq!==previous+1){
   confirmedPositionSequences.delete(id);
   throw new Error('Révision de position serveur inattendue');
  }
  confirmedPositionSequences.set(id,seq);
  if(activeRoomId===id&&typeof channel?.send==='function'){
   try{await channel.send({type:'broadcast',
    event:'capture-peer-position-changed-v1',payload:{}});}
   catch{ /* No rollback: authenticated server position is already durable. */ }
  }
  return seq;
 }
 // RLS SELECT is still the only source of peer coordinates.
 async function readScopedPeerPositions(id,user,room,previousSequences){
  if(!room?.open||!room.worldId||!room.worldFingerprint||
    !room.members?.some(member=>member.id===user))
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
 async function inspectPositions({roomId,ownActorId,previousSequences={}}={}){
  const id=checkUuid(roomId),user=checkUuid(ownActorId);
  return readScopedPeerPositions(id,user,await inspectRoom(id),previousSequences);
 }
 async function observe({roomId,userId,onChange,onStatus,onPositions,onGreeting}={}){
  const id=checkUuid(roomId),user=checkUuid(userId);
  if(typeof onChange!=='function')throw new TypeError('Callback salle requis');
  if(onPositions!==undefined&&typeof onPositions!=='function')
   throw new TypeError('Le lecteur des positions doit être un callback');
  if(onGreeting!==undefined&&typeof onGreeting!=='function')
   throw new TypeError('Le destinataire du salut doit être un callback');
  await dispose();
  activeRoomId=id;
  const generation=subscriptionGeneration;
  const current=()=>activeRoomId===id&&subscriptionGeneration===generation;
  let sequences=Object.create(null),dirty=false,running=false;
  let verifiedRoom=null;
  const update=()=>{void inspectRoom(id).then(state=>{
   if(!current())return;
   verifiedRoom=state;observedRoom=state;
   onChange(state);
  }).catch(error=>{
   if(current()){
    verifiedRoom=null;observedRoom=null;
    onStatus?.('Erreur lecture salon : '+error.message);
   }
  });};
  // Realtime is only a wake-up signal. Every coordinate is fetched via
  // authenticated RLS and accepted only if its server revision advanced.
  // Coalesce overlapping signals without losing the latest notification.
  async function flushPositions(){
   if(running||!current()||typeof onPositions!=='function')return;
   running=true;
   try{
    while(dirty&&current()){
     dirty=false;
     try{
      const room=verifiedRoom??await inspectRoom(id);
      if(!current())return;
      const update=await readScopedPeerPositions(id,user,room,sequences);
      if(!current())return;
      sequences=update.sequences;
      if(update.actors.length)onPositions(update);
     }catch(error){
      if(current())onStatus?.('Lecture des positions refusée : '+error.message);
     }
    }
   }finally{running=false;}
  }
  const updatePositions=()=>{
   if(!current()||typeof onPositions!=='function')return;
   dirty=true;
   void flushPositions();
  };
  const next=client.channel(ROOM_TOPIC+id,{
   config:{private:true,presence:{key:user}}
  });
  channel=next;
  next.on('presence',{event:'sync'},()=>{
   if(!current())return;
   update();updatePositions();
  });
  next.on('broadcast',{event:'capture-room-refresh-v1'},()=>{
   if(!current())return;
   update();updatePositions();
  });
  // Never trust positions in Broadcast payloads. The room member's RLS
  // SELECT is the ONLY source of received coordinates, area and revision.
  next.on('broadcast',{event:'capture-peer-position-changed-v1'},updatePositions);
  // Cosmetic peer greeting. The sender's identity is never trusted from the
  // broadcast payload; only a private member may send, and only the
  // addressed actor receives this short-lived, non-persistent notification.
  next.on('broadcast',{event:'capture-peer-greeting-v1'},event=>{
   if(current()&&event?.payload?.targetActorId===user)onGreeting?.();
  });
  next.subscribe(status=>{
   if(!current())return;
   if(status==='SUBSCRIBED'){
    onStatus?.('Salon connecté');
    update();updatePositions();
    void next.track({ready:true}).catch(error=>{
     if(current())onStatus?.('Présence indisponible : '+error.message);
    });
   }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
    onStatus?.('Connexion salon interrompue : '+status);
   }
  });
  update();updatePositions();
  return Object.freeze({roomId:id,topic:ROOM_TOPIC+id});
 }
 async function greet({roomId,targetActorId}={}){
  const id=checkUuid(roomId),target=checkUuid(targetActorId);
  const user=await authenticatedUserId();
  if(target===user)throw new Error('Tu ne peux pas te saluer toi-même');
  if(activeRoomId!==id||!channel)throw new Error('Salon non connecté');
  const room=await inspectRoom(id);
  if(!room?.open||!room.members.some(m=>m.id===user)||
     !room.members.some(m=>m.id===target))
   throw new Error('Le destinataire ne fait plus partie du salon');
  const response=await channel.send({type:'broadcast',
   event:'capture-peer-greeting-v1',payload:{targetActorId:target}});
  if(response!=='ok')throw new Error('Salutation non transmise');
  return true;
 }
 async function leave({roomId}={}){
  const id=checkUuid(roomId);
  try{result(await client.rpc('gensrpg_capture_leave_room',{p_room:id}),
    'Quitter le salon Capture');}
  finally{await dispose();}
 }
 async function dispose(){
  ++subscriptionGeneration;
  activeRoomId=null;
  observedRoom=null;confirmedPositionSequences.clear();
  const previous=channel;channel=null;
  if(previous)await client.removeChannel(previous);
 }
 return Object.freeze({authenticatedUserId,create,join,inspectRoom,fetchRoomSetup,
  bindWorld,publishWorldDocument,fetchWorldDocument,
  ownPositionSequence,reportPosition,inspectPositions,observe,greet,leave,dispose});
}
