// A thin handoff between GenSRPG Capture online room metadata and
// the ORIGINAL Exploration checkpoint. No movement, rendering or save owner.
import {capturePeerPositionFromOfficialNavigationV1} from './adventure-peer-position-v1.mjs';

function requiredContext({room,transport,world,officialFingerprint}={}){
 if(!room||!['host','guest'].includes(room.role)||typeof room.roomId!=='string'||
  typeof room.userId!=='string'||typeof transport?.inspectRoom!=='function'||
  typeof world?.id!=='string'||!world.id||typeof officialFingerprint!=='function')
  throw new TypeError('Invalid canonical Capture online play context');
 return {room,transport,world,officialFingerprint};
}
export async function preflightCaptureOnlineWorldV1(input={}){
 if(!input.room)return null; // true offline play is unchanged
 const {room,transport,world,officialFingerprint}=requiredContext(input);
 const fingerprint=officialFingerprint(world);
 if(typeof fingerprint!=='string'||!fingerprint)
  throw new Error('Identité du monde Exploration officielle indisponible');
 const server=await transport.inspectRoom(room.roomId);
 if(!server?.open||!server.members?.some(m=>m.id===room.userId))
  throw new Error('Le joueur ne fait plus partie du salon Monster Capture');
 if(room.role==='host'&&(server.ownerId!==room.userId||server.sessionId!==input.sessionId))
  throw new Error('La sauvegarde hébergée ne correspond plus au salon.');
 if(room.role==='guest'&&(!server.worldId||!server.worldFingerprint))
  throw new Error('L’hôte doit entrer dans le monde avant les invités.');
 if(server.worldId&&(server.worldId!==world.id||
  server.worldFingerprint!==fingerprint))
  throw new Error('Ce salon utilise une autre carte. Importe le monde du créateur avant de rejoindre.');
 return Object.freeze({room,worldId:world.id,worldFingerprint:fingerprint,
  sessionId:input.sessionId});
}
export async function publishCaptureInitialPositionV1({
 context,transport,navigation,world,serializeOfficialWorld,onProgress=()=>{}
}={}){
 if(context===null)return null;
 if(!context?.room||typeof transport?.reportPosition!=='function'||
  typeof navigation!=='object')
  throw new TypeError('Missing canonical Exploration to Capture position bridge');
 const {room,worldId,worldFingerprint,sessionId}=context;
 // Only a real Exploration checkpoint, after collision/spawn validation.
 const position=capturePeerPositionFromOfficialNavigationV1({
  navigation,sessionId,worldId,worldFingerprint
 });
 if(room.role==='host'){
  if(typeof transport.bindWorld!=='function')
   throw new TypeError('Capture server world-binding RPC is unavailable');
  if(typeof transport.publishWorldDocument!=='function'||
     typeof serializeOfficialWorld!=='function'||world?.id!==worldId)
   throw new Error('Le partage du WorldDocument officiel est indisponible');
  // The host's canonical document is validated by Exploration before ANY
  // network publication. The room's bound identity remains authoritative.
  onProgress('Préparation de la carte officielle…');
  const serializedDocument=serializeOfficialWorld(world);
  if(new TextEncoder().encode(serializedDocument).byteLength>8388608)
   throw new Error('La carte dépasse 8 Mio. Réduis-la dans le World Builder avant de la partager.');
  onProgress('Association du salon à ta carte…');
  await transport.bindWorld({roomId:room.roomId,navigation});
  onProgress('Transmission de la carte à tes invités…');
  await transport.publishWorldDocument({roomId:room.roomId,
   worldId,worldFingerprint,serializedDocument});
 }
 onProgress('Synchronisation des positions des joueurs…');
 return transport.reportPosition({roomId:room.roomId,navigation});
}
