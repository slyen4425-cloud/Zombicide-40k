// Capture V2 creator policy draft prior to first game.
// Core Storage remains the only serialization owner; a live AdventureSession
// always overrides this temporary authoring document.
import {normalizeAdventureSessionControlSettingsV1}
 from './adventure-contract-v1.mjs';

export const ADVENTURE_CREATOR_DRAFT_KEY_V1='gensrpg.capture.v2.adventure.creator-draft.v1';
const SCHEMA='gensrpg-capture-adventure-creator-draft-v1';
export function createAdventureCreatorDraftStoreV1({storage,coreStorage}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
    !coreStorage||typeof coreStorage.readJson!=='function'||typeof coreStorage.writeJson!=='function')
   throw new TypeError('The existing injected Core Storage service is required');
 return Object.freeze({
  key:ADVENTURE_CREATOR_DRAFT_KEY_V1,
  load(){
   if(storage.getItem(ADVENTURE_CREATOR_DRAFT_KEY_V1)===null)return null;
   const value=coreStorage.readJson(storage,ADVENTURE_CREATOR_DRAFT_KEY_V1,null);
   if(!value||typeof value!=='object'||Array.isArray(value))
     throw new Error('Brouillon créateur invalide ; données conservées');
   if(value.schema!==SCHEMA||value.version!==1)
     throw new RangeError('Unknown Adventure creator draft schema/version');
   const keys=Object.keys(value);
   if(keys.length!==3||!keys.includes('settings'))
     throw new TypeError('Invalid creator draft envelope');
   return normalizeAdventureSessionControlSettingsV1(value.settings);
  },
  save(settings){
   const valid=normalizeAdventureSessionControlSettingsV1(settings);
   coreStorage.writeJson(storage,ADVENTURE_CREATOR_DRAFT_KEY_V1,{
    schema:SCHEMA,version:1,settings:valid
   });
   return valid;
  }
 });
}
