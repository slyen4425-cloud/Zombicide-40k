import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SHOWCASE_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {createAdventureRulesDraftStoreV1,ADVENTURE_RULES_DRAFT_KEY_V1} from '../assets/gensrpg/capture-v2/adventure-rules-draft-v1.mjs';

// Inject the REAL GenSRPG Core Storage owner, not a reimplemented fake JSON API.
const source=fs.readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8');
const context={};
vm.runInNewContext(source,context);
const canonicalCoreStorage=context.GensStorageV1;
function fixture(){
 const db=new Map();
 const storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v))};
 return {storage,coreStorage:canonicalCoreStorage};
}
test('creator rules can be saved BEFORE creating a game, then read after browser reload',()=>{
 const {storage,coreStorage}=fixture();
 const first=createAdventureRulesDraftStoreV1({storage,coreStorage});
 assert.equal(first.load(),null);
 const changed={...SHOWCASE_ADVENTURE_RULES_V1,
  progression:{...SHOWCASE_ADVENTURE_RULES_V1.progression,maxLevel:150,
   xpBands:[...SHOWCASE_ADVENTURE_RULES_V1.progression.xpBands.slice(0,-1),
    {throughLevel:150,xpPerLevel:10000}]},
  loot:{...SHOWCASE_ADVENTURE_RULES_V1.loot,currencyPerVictory:42}};
 first.save(changed);
 const reloaded=createAdventureRulesDraftStoreV1({storage,coreStorage}).load();
 assert.equal(reloaded.progression.maxLevel,150);
 assert.equal(reloaded.loot.currencyPerVictory,42);
 assert.equal(reloaded.schema,SHOWCASE_ADVENTURE_RULES_V1.schema);
 assert.ok(storage.getItem(ADVENTURE_RULES_DRAFT_KEY_V1));
});
test('invalid draft must not be replaced silently by showcase defaults',()=>{
 const {storage,coreStorage}=fixture();
 storage.setItem(ADVENTURE_RULES_DRAFT_KEY_V1,'{');
 const store=createAdventureRulesDraftStoreV1({storage,coreStorage});
 assert.throws(()=>store.load());
 assert.equal(storage.getItem(ADVENTURE_RULES_DRAFT_KEY_V1),'{');
});
test('draft storage cannot use an alternate Core or mutate published game save',()=>{
 const {storage,coreStorage}=fixture();
 assert.throws(()=>createAdventureRulesDraftStoreV1({storage}),/Core Storage/);
 const oldSave='{"playing":true}';
 storage.setItem('gensrpg.capture.v2.adventure.save.v1',oldSave);
 createAdventureRulesDraftStoreV1({storage,coreStorage}).save(SHOWCASE_ADVENTURE_RULES_V1);
 assert.equal(storage.getItem('gensrpg.capture.v2.adventure.save.v1'),oldSave);
});

test('real Core Storage rejects malformed or incompatible draft without erasing it',()=>{
 const {storage,coreStorage}=fixture();
 const draft=createAdventureRulesDraftStoreV1({storage,coreStorage});
 storage.setItem(ADVENTURE_RULES_DRAFT_KEY_V1,'{');
 assert.throws(()=>draft.load(),/invalid|invalide/i);
 assert.equal(storage.getItem(ADVENTURE_RULES_DRAFT_KEY_V1),'{');
 const incompatible=JSON.stringify({...SHOWCASE_ADVENTURE_RULES_V1,version:99});
 storage.setItem(ADVENTURE_RULES_DRAFT_KEY_V1,incompatible);
 assert.throws(()=>draft.load(),/schema|version/i);
 assert.equal(storage.getItem(ADVENTURE_RULES_DRAFT_KEY_V1),incompatible);
});
