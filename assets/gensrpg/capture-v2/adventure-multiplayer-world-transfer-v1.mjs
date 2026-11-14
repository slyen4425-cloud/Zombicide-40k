// Capture C4: ingest a host WorldDocument ONLY through the official
// Exploration importer and archived WorldDocument library. This module
// NEVER stores WorldDocuments, builds maps or modifies AdventureSave.
export function importCaptureSharedWorldV1({
 connection,room,packet,library,importOfficial,fingerprintOfficial
}={}){
 if(connection?.role!=='guest'||typeof connection.userId!=='string'||
    !room?.open||!room.members?.some(m=>m.id===connection.userId))
  throw new Error('Tu dois être invité authentifié dans un salon ouvert');
 if(!room.worldId||!room.worldFingerprint)
  throw new Error('Le créateur doit d’abord entrer dans son monde');
 if(!packet||packet.worldId!==room.worldId||
    packet.worldFingerprint!==room.worldFingerprint||
    typeof packet.serializedDocument!=='string')
  throw new Error('Le monde reçu ne correspond pas au salon authentifié');
 if(typeof importOfficial!=='function'||typeof fingerprintOfficial!=='function'||
    typeof library?.save!=='function'||typeof library?.list!=='function'||
    typeof library?.load!=='function')
  throw new TypeError('Importeur et bibliothèque WorldDocument officiels nécessaires');
 const official=importOfficial(packet.serializedDocument);
 if(official?.id!==room.worldId||fingerprintOfficial(official)!==room.worldFingerprint)
  throw new Error('Empreinte du monde reçu invalide : importation refusée');
 const exists=library.list().some(entry=>entry.id===official.id);
 if(exists){
  const existing=library.load(official.id);
  if(fingerprintOfficial(existing)!==room.worldFingerprint)
   throw new Error('Une carte locale porte déjà ce nom mais son contenu diffère. Exporte ou renomme-la dans Exploration avant d’importer la carte du salon.');
  return Object.freeze({worldId:official.id,alreadyAvailable:true});
 }
 // Official library.save refuses any unconfirmed overwrite; no second codec.
 library.save(official,{replace:false});
 const verified=library.load(official.id);
 if(fingerprintOfficial(verified)!==room.worldFingerprint)
  throw new Error('Archive Exploration non conforme après importation');
 return Object.freeze({worldId:official.id,alreadyAvailable:false});
}

// Before switching to the guest's imported room world, the Exploration
// library requires the current author draft to be archived unchanged.
// Preserve it additively, using ONLY the official WorldDocument archive.
// Never overwrite a map with the same ID but different authored content.
export function preserveCaptureGuestDraftV1({
 activeDraft,room,library,fingerprintOfficial
}={}){
 if(!activeDraft)return Object.freeze({archived:false});
 if(!room?.worldId||!room?.worldFingerprint||
    typeof library?.save!=='function'||typeof library?.list!=='function'||
    typeof library?.load!=='function'||typeof fingerprintOfficial!=='function')
  throw new TypeError('Bibliothèque et monde officiel indisponibles');
 const currentFingerprint=fingerprintOfficial(activeDraft);
 if(activeDraft.id===room.worldId&&currentFingerprint!==room.worldFingerprint)
  throw new Error('Ta carte active a le même nom que celle du créateur mais un contenu différent. Enregistre-la sous un autre nom dans Exploration avant de recevoir le monde.');
 const archived=library.list().some(entry=>entry.id===activeDraft.id);
 if(archived){
  if(fingerprintOfficial(library.load(activeDraft.id))!==currentFingerprint)
   throw new Error('Enregistre les modifications de ta carte active dans le World Builder avant de rejoindre. Aucune modification écrasée.');
  return Object.freeze({archived:false});
 }
 library.save(activeDraft,{replace:false});
 if(fingerprintOfficial(library.load(activeDraft.id))!==currentFingerprint)
  throw new Error('Sauvegarde du monde actif non conforme, changement de monde refusé');
 return Object.freeze({archived:true});
}
