// Read-only Capture merchant catalog for the official Exploration NPC editor.
// One owner: authoritative AdventureRules/AdventureSession and Core Storage.
import {createAdventureStoreV1} from './adventure-contract-v1.mjs';
import {createAdventurePortfolioStoreV1} from './adventure-portfolio-store-v1.mjs';
import {createAdventureRulesDraftStoreV1} from './adventure-rules-draft-v1.mjs';

export async function availableAdventureMerchantsForNpcV1({
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
 const rules=live?.rules??createAdventureRulesDraftStoreV1({storage,coreStorage}).load();
 if(!rules?.economy)return Object.freeze([]);
 return Object.freeze(rules.economy.merchants.map(merchant=>
  Object.freeze({id:merchant.id,name:merchant.name})));
}
