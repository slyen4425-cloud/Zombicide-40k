// Capture V2 creator-only rules draft, not an AdventureSession or gameplay authority.
// Persist through the existing injected Core Storage, never overwrite a running game.
import {normalizeAdventureRulesV1} from './adventure-contract-v1.mjs';

export const ADVENTURE_RULES_DRAFT_KEY_V1='gensrpg.capture.v2.adventure.rules-draft.v1';
export function createAdventureRulesDraftStoreV1({storage,coreStorage}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
  !coreStorage||typeof coreStorage.readJson!=='function'||typeof coreStorage.writeJson!=='function')
  throw new TypeError('The existing injected Core Storage service is required');
 const key=ADVENTURE_RULES_DRAFT_KEY_V1;
 return Object.freeze({
  key,
  load(){
   if(storage.getItem(key)===null)return null;
   // Malformed or outdated authoring data must remain visible and recoverable.
   const input=coreStorage.readJson(storage,key,null);
   if(input===null)throw new Error('Brouillon de réglages Aventure invalide : données conservées');
   return normalizeAdventureRulesV1(input);
  },
  save(rules){
   const validated=normalizeAdventureRulesV1(rules);
   coreStorage.writeJson(storage,key,validated);
   return validated;
  }
 });
}
