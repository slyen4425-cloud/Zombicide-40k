// Capture online: a read-only, immutable projection of the host's ONLY
// AdventureSession rules. Guests own their Hero/Party progress, not game rules.
// The server keeps a temporary scoped snapshot; no second rules editor exists.
import {ADVENTURE_SAVE_SCHEMA_V1,normalizeAdventureRulesV1,
 normalizeAdventureCameraPolicyV1} from './adventure-contract-v1.mjs';

export function captureHostSetupFromSessionV1(session){
 if(session?.schema!==ADVENTURE_SAVE_SCHEMA_V1||typeof session.sessionId!=='string')
  throw new TypeError('Sauvegarde hôte officielle requise');
 const members=[session.party?.active,...(session.party?.reserve??[])];
 if(members.some(member=>!member)||members.length<1||members.length>6)
  throw new RangeError('Équipe hôte invalide (1 à 6 créatures)');
 return Object.freeze({
  sessionId:session.sessionId,
  rules:normalizeAdventureRulesV1(session.rules),
  starterCount:members.length,
  cameraPolicy:normalizeAdventureCameraPolicyV1(session.cameraPolicy??{angleDeg:55,zoomPercent:175})
 });
}
export function captureRoomSetupFromServerV1({room,row}={}){
 if(!room?.open||!row||row.room_id!==room.roomId||
    row.host_session_id!==room.sessionId)
  throw new Error('La configuration du créateur ne correspond pas à ce salon');
 const count=Number(row.starter_count);
 if(!Number.isInteger(count)||count<1||count>6)
  throw new RangeError('Nombre de créatures initiales du créateur invalide');
 const rules=normalizeAdventureRulesV1(row.rules);
 const cameraPolicy=normalizeAdventureCameraPolicyV1(row.camera_policy);
 return Object.freeze({
  sessionId:row.host_session_id,rules,starterCount:count,cameraPolicy
 });
}
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(
  Object.entries(value).sort(([a],[b])=>a.localeCompare(b))
   .map(([key,child])=>[key,canonical(child)]));
 return value;
}
export function captureGuestSessionMatchesHostSetupV1({session,setup,room}={}){
 if(!session||!setup||!room?.open||setup.sessionId!==room.sessionId||
    session.world?.mapRef!==room.worldId||session.status==='finished')return false;
 try{
  const members=[session.party?.active,...(session.party?.reserve??[])];
  // Starter count is enforced at creation; captures later legitimately
  // change the team size without making this saved hero ineligible to return.
  return members.length>=1&&members.length<=6&&members.every(Boolean)&&
   JSON.stringify(canonical(normalizeAdventureRulesV1(session.rules)))===
    JSON.stringify(canonical(setup.rules));
 }catch{return false;}
}
