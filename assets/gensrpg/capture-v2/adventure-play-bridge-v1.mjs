// The Capture-owned AdventureSession decides whether a game may start;
// ONLY the existing Exploration module owns the WorldDocument, navigation,
// collisions, camera and checkpoint. No alternative play engine or world save.
import {ADVENTURE_SAVE_SCHEMA_V1} from './adventure-contract-v1.mjs';

function requireService(value,methods,label){
 if(!value||methods.some(name=>typeof value[name]!=='function'))
  throw new TypeError('Official '+label+' adapter required');
 return value;
}
export function startAdventureExplorationV1({
 store,storage,navigation,world,now=new Date().toISOString()
}={}){
 requireService(store,['load','save'],'GenSRPG Core Adventure Storage');
 requireService(storage,['getItem','setItem'],'navigation storage');
 requireService(navigation,['readExplorationPlay','createNewExplorationPlay'],'Exploration');
 const session=store.load();
 if(!session||session.schema!==ADVENTURE_SAVE_SCHEMA_V1)
  throw new Error('Crée d’abord une véritable partie dans Aventure.');
 if(!world||typeof world.id!=='string'||!world.id||
    !Array.isArray(world.areas)||!world.areas.length)
  throw new Error('Aucun monde jouable : ouvre le World Builder officiel depuis GenSRPG, crée ou importe une carte, puis sauvegarde-la.');
 if(!session.sessionId||typeof session.sessionId!=='string')
  throw new Error('Identité de la sauvegarde Aventure absente');
 if(!session.world||typeof session.world!=='object')
  throw new Error('Référence de monde Aventure invalide');
 if(session.world.mapRef!==null&&session.world.mapRef!==world.id)
  throw new Error('Monde de partie incompatible : la sauvegarde est conservée, sans déplacement ni réinitialisation.');
 const scope=Object.freeze({sessionId:session.sessionId});
 // Exploration validates the true WorldDocument/Area/Spawn/fingerprint.
 // Do not try to repair a corrupted checkpoint by starting at spawn.
 const existing=navigation.readExplorationPlay(storage,world,scope);
 if(session.status==='playing'){
  if(!existing)
   throw new Error('Checkpoint Exploration de la partie introuvable : reprise bloquée, sauvegarde conservée.');
  if(existing.sessionId!==session.sessionId||existing.worldId!==world.id)
   throw new Error('Checkpoint Exploration appartenant à une autre session ou un autre monde');
  return Object.freeze({session,navigation:existing});
 }
 if(session.status!=='configured')
  throw new Error('Statut de partie Aventure incompatible');
 // A pre-existing checkpoint can be an interrupted Core Storage write.
 // Reuse it instead of resetting the actor to the initial Spawn.
 const checkpoint=existing??navigation.createNewExplorationPlay(storage,world,scope);
 if(checkpoint.sessionId!==session.sessionId||checkpoint.worldId!==world.id)
  throw new Error('Le checkpoint créé par Exploration ne correspond pas à cette partie');
 const next={
  ...session,status:'playing',updatedAt:now,
  world:{...session.world,mapRef:world.id,position:null}
 };
 // Core Storage owns the only Capture save. On failure, a retry will see
 // the same scoped Exploration checkpoint, never destroy its position.
 store.save(next);
 return Object.freeze({session:next,navigation:checkpoint});
}
