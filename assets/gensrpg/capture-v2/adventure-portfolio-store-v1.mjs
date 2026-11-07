// Capture-only portfolio selector around the EXISTING AdventureStore + Core
// Storage serializer. Not a second save engine, no AdventureSave conversion.
// The historical one-save key is never moved, renamed or copied.
// Deletion requires an explicit user action targeting this exact session.
import {createAdventureStoreV1,ADVENTURE_STORAGE_KEY_V1}
 from './adventure-contract-v1.mjs';
export const ADVENTURE_PORTFOLIO_KEY_V1=
 'gensrpg.capture.v2.adventure.portfolio.v1';
export const ADVENTURE_SLOT_PREFIX_V1=
 'gensrpg.capture.v2.adventure.slot.v1:';
const SCHEMA='gensrpg.capture.v2.adventure.portfolio.v1';
const validId=id=>typeof id==='string'&&
 /^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(id);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const keys=(value,fields)=>object(value)&&
 Object.keys(value).length===fields.length&&
 Object.keys(value).every(key=>fields.includes(key));
export function createAdventurePortfolioStoreV1({storage,coreStorage,legacyStore}={}){
 if(!storage||typeof storage.getItem!=='function'||
    typeof storage.setItem!=='function'||
    typeof coreStorage?.readJson!=='function'||
    typeof coreStorage?.writeJson!=='function'||
    typeof legacyStore?.load!=='function'||
    legacyStore.key!==ADVENTURE_STORAGE_KEY_V1)
  throw new TypeError('Core Storage et magasin Adventure historique requis');
 const legacy=()=>legacyStore.load();
 const slot=id=>createAdventureStoreV1({
  storage,coreStorage,key:ADVENTURE_SLOT_PREFIX_V1+id
 });
 const legacyId=()=>legacy()?.sessionId??null;
 function readIndex(){
  if(storage.getItem(ADVENTURE_PORTFOLIO_KEY_V1)===null)
   return {schema:SCHEMA,version:1,selectedSessionId:legacyId(),slotIds:[]};
  const data=coreStorage.readJson(storage,ADVENTURE_PORTFOLIO_KEY_V1,null);
  if(!keys(data,['schema','version','selectedSessionId','slotIds'])||
     data.schema!==SCHEMA||data.version!==1||
     !Array.isArray(data.slotIds)||
     data.slotIds.some(id=>!validId(id))||
     new Set(data.slotIds).size!==data.slotIds.length||
     (data.selectedSessionId!==null&&!validId(data.selectedSessionId)))
   throw new Error('Liste des sauvegardes Monster Capture corrompue : aucune réinitialisation automatique');
  return data;
 }
 function writeIndex(value){
  coreStorage.writeJson(storage,ADVENTURE_PORTFOLIO_KEY_V1,value);
 }
 function indexedIds(index){
  const ids=new Set(index.slotIds);
  // Recover a newly written slot after an interrupted index write. Never
  // overwrite it simply because the index did not commit.
  if(Number.isSafeInteger(storage.length)&&typeof storage.key==='function'){
   for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(typeof key!=='string'||!key.startsWith(ADVENTURE_SLOT_PREFIX_V1))continue;
    const id=key.slice(ADVENTURE_SLOT_PREFIX_V1.length);
    if(!validId(id))throw new Error('Clé de sauvegarde Capture invalide');
    ids.add(id);
   }
  }
  return [...ids];
 }
 function selectedId(index){
  return index.selectedSessionId??legacyId();
 }
 function byId(id,index){
  if(!validId(id))throw new RangeError('Identifiant de partie invalide');
  const old=legacyId();
  if(id===old)return legacy();
  if(!indexedIds(index).includes(id))
   throw new Error('Partie Monster Capture introuvable : aucune sauvegarde remplacée');
  const value=slot(id).load();
  if(!value||value.sessionId!==id)
   throw new Error('Sauvegarde sélectionnée absente ou incompatible : aucune réinitialisation');
  return value;
 }
 function list(){
  const index=readIndex(),items=[];
  const saved=legacy();
  if(saved)items.push(saved);
  for(const id of indexedIds(index)){
   if(saved?.sessionId===id)
    throw new Error('Collision entre identifiants de sauvegarde historiques et nouveaux');
   items.push(byId(id,index));
  }
  return Object.freeze(items.map(state=>Object.freeze({
   sessionId:state.sessionId,createdAt:state.createdAt,
   updatedAt:state.updatedAt,status:state.status,
   speciesId:state.party.active.speciesId,level:state.party.active.level,
   selected:state.sessionId===selectedId(index)
  })));
 }
 function load(){
  const index=readIndex(),id=selectedId(index);
  return id===null?null:byId(id,index);
 }
 function select(id){
  const index=readIndex();
  byId(id,index);
  writeIndex({...index,selectedSessionId:id,
   slotIds:indexedIds(index)});
  return load();
 }
 function create(value){
  if(!validId(value?.sessionId))throw new TypeError('Identifiant de nouvelle partie invalide');
  const index=readIndex(),id=value.sessionId,old=legacy();
  if(old?.sessionId===id||indexedIds(index).includes(id)||
     storage.getItem(ADVENTURE_SLOT_PREFIX_V1+id)!==null)
   throw new Error('Cette partie existe déjà : refus de remplacer une sauvegarde existante');
  // The original owner validates the complete save and refuses an occupied
  // slot. Persist it BEFORE the index: if the second write fails the slot is
  // discoverable and untouched, not lost or overwritten.
  slot(id).create(value);
  // indexedIds() already discovers the just-written slot: do not append
  // it a second time or the strict schema correctly rejects the index.
  writeIndex({...index,selectedSessionId:id,
   slotIds:indexedIds(index)});
  return value;
 }
 function save(value){
  const index=readIndex(),id=selectedId(index);
  if(!id||value?.sessionId!==id)
   throw new Error('Impossible de modifier une autre partie que la sauvegarde sélectionnée');
  if(id===legacyId())return legacyStore.save(value);
  return slot(id).save(value);
 }
 function deleteSave(id){
  // Explicitly selected Capture-only save. Never delete a WorldDocument,
  // other module data, or a different session's checkpoint.
  if(typeof storage.removeItem!=='function')
   throw new Error('Suppression des sauvegardes indisponible dans ce stockage');
  const index=readIndex();
  byId(id,index); // Reject unknown/corrupt saves BEFORE any mutation.
  const remaining=list().filter(entry=>entry.sessionId!==id);
  const selected=selectedId(index);
  const fallback=selected===id?(remaining[0]?.sessionId??null):selected;
  // Index first: if the removal is interrupted, the original slot survives
  // and indexedIds rediscovers it. Never silently erase an orphaned save.
  writeIndex({...index,selectedSessionId:fallback,
   slotIds:indexedIds(index).filter(entry=>entry!==id)});
  storage.removeItem(id===legacyId()?ADVENTURE_STORAGE_KEY_V1:ADVENTURE_SLOT_PREFIX_V1+id);
  return load();
 }
 return Object.freeze({
  key:ADVENTURE_PORTFOLIO_KEY_V1,load,save,create,list,select,delete:deleteSave,
  activeId:()=>selectedId(readIndex())
 });
}
