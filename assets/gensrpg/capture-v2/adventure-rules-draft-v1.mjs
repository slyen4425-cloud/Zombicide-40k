// Capture V2 creator-only rules draft, not an AdventureSession or gameplay authority.
// Persist through the existing injected Core Storage, never overwrite a running game.
import {normalizeAdventureRulesV1} from './adventure-contract-v1.mjs';
import {DEFAULT_ADVENTURE_ECONOMY_V1} from './adventure-economy-v1.mjs';

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

// A PNJ is authored for a world, not just the last selected save. The draft
// remains the existing owner of new-game rules; the saved session keeps its
// own gameplay snapshot and consumed stocks. Project just the edited shop.
export function projectAdventureMerchantDraftV1({draftRules,sourceRules,merchantId}={}){
 const draft=normalizeAdventureRulesV1(draftRules);
 const source=normalizeAdventureRulesV1(sourceRules);
 const merchant=source.economy?.merchants.find(m=>m.id===merchantId);
 if(!merchant)throw Error('Marchand à enregistrer introuvable.');
 const economy=draft.economy??DEFAULT_ADVENTURE_ECONOMY_V1;
 const refs=new Set(Array.isArray(merchant.itemIds)?merchant.itemIds:
  merchant.offers.flatMap(offer=>[offer.itemId,...offer.resourceCosts.map(cost=>cost.itemId)]));
 const known=new Set(draft.loot.items.map(item=>item.id));
 // Only canonical referenced definitions absent from the future-game catalog
 // are carried over. Preserve all existing draft definitions, drops and rules.
 const missing=source.loot.items.filter(item=>refs.has(item.id)&&!known.has(item.id));
 const merchants=economy.merchants.some(m=>m.id===merchantId)
  ?economy.merchants.map(m=>m.id===merchantId?merchant:m)
  :[...economy.merchants,merchant];
 return normalizeAdventureRulesV1({...draft,
  loot:{...draft.loot,items:[...draft.loot.items,...missing]},
  economy:{...economy,merchants}});
}


// Repair ONLY an explicitly-authored NPC shop missing from a running save.
// The player has just requested this merchant via the authenticated Explorer.
// No global rule migration, no stock reset, no synthetic merchant or wallet.
export function reconcileAuthoredMerchantForSessionV1({session,draftRules,merchantId}={}){
 if(session?.status!=='playing'||!session.rules)
  throw new TypeError('A playing AdventureSession is required');
 if(typeof merchantId!=='string'||!merchantId)
  throw new TypeError('A real NPC merchant reference is required');
 if(session.rules.economy?.merchants?.some(m=>m.id===merchantId))return session;
 if(!draftRules)return session;
 const authored=normalizeAdventureRulesV1(draftRules);
 if(!authored.economy?.merchants.some(m=>m.id===merchantId))return session;
 const rules=projectAdventureMerchantDraftV1({
  draftRules:session.rules,sourceRules:authored,merchantId
 });
 return {...session,rules};
}
