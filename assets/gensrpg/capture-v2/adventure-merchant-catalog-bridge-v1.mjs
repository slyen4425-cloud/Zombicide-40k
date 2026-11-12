// Read-only Capture merchant catalog for the official Exploration NPC editor.
// One owner: authoritative AdventureRules/AdventureSession and Core Storage.
import {createAdventureStoreV1} from './adventure-contract-v1.mjs';
import {createAdventurePortfolioStoreV1} from './adventure-portfolio-store-v1.mjs';
import {createAdventureRulesDraftStoreV1} from './adventure-rules-draft-v1.mjs';

async function npcRulesFromOfficialCaptureV1({
 storage=globalThis.localStorage,coreStorage=globalThis.GensStorageV1
}={}){
 // The Capture owner initializes its EXISTING Core Storage service.
 // The outer Shell only transports names; it never opens the wallet.
 if(!coreStorage){
  await import('../core/storage-v1.js');
  coreStorage=globalThis.GensStorageV1;
 }
 const legacyStore=createAdventureStoreV1({storage,coreStorage});
 const portfolio=createAdventurePortfolioStoreV1({storage,coreStorage,legacyStore});
 const live=portfolio.load();
 return live?.rules??createAdventureRulesDraftStoreV1({storage,coreStorage}).load();
}
export async function availableAdventureMerchantsForNpcV1(options={}){
 const rules=await npcRulesFromOfficialCaptureV1(options);
 if(!rules?.economy)return Object.freeze([]);
 return Object.freeze(rules.economy.merchants.map(merchant=>
  Object.freeze({id:merchant.id,name:merchant.name})));
}
// The NPC editor sees item NAMES and IDs for references only. Currency and
// inventory still belong exclusively to AdventureRules / AdventureSession.
export async function availableAdventureItemsForNpcRewardV1(options={}){
 const rules=await npcRulesFromOfficialCaptureV1(options);
 return Object.freeze({
  currencyLabel:rules?.economy?.currency?.plural??'pièces',
  items:Object.freeze((rules?.loot?.items??[]).map(item=>
   Object.freeze({id:item.id,name:item.name})))
 });
}
