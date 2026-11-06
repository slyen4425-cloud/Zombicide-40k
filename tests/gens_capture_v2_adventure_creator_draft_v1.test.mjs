import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1,
  normalizeAdventureSessionControlSettingsV1,
  createAdventureSessionV1,createAdventureStoreV1,SHOWCASE_ADVENTURE_RULES_V1,
  updateAdventureSessionControlV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {
  createAdventureCreatorDraftStoreV1,ADVENTURE_CREATOR_DRAFT_KEY_V1
} from '../assets/gensrpg/capture-v2/adventure-creator-draft-v1.mjs';
const source=fs.readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);
const coreStorage=context.GensStorageV1;
const fixture=()=>{
 const m=new Map();
 return {storage:{getItem:key=>m.get(key)??null,setItem:(key,val)=>m.set(key,String(val))},m};
};
const settings={
 hostIsGameMaster:true,joinEnabled:true,
 guestPermissions:{...DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1,
   editProgression:true,editRewards:true,editWorld:false,allocateOwnCreatureStats:false}
};
test('creator/MJ choices before any game survive Core Storage reload and use canonical policy validator',()=>{
 const {storage}=fixture();
 const owner=createAdventureCreatorDraftStoreV1({storage,coreStorage});
 assert.equal(owner.load(),null);
 const saved=owner.save(settings);
 assert.deepEqual(saved,normalizeAdventureSessionControlSettingsV1(settings));
 const again=createAdventureCreatorDraftStoreV1({storage,coreStorage}).load();
 assert.deepEqual(again,normalizeAdventureSessionControlSettingsV1(settings));
 assert.equal(again.joinEnabled,true);
 assert.equal(again.guestPermissions.allocateOwnCreatureStats,false);
 assert.equal(Object.hasOwn(again,'creatorId'),false);
 assert.ok(storage.getItem(ADVENTURE_CREATOR_DRAFT_KEY_V1));
});
test('saved creator draft remains distinct from actual AdventureSession, and enters session only on new-game creation',()=>{
 const {storage}=fixture();
 const first=createAdventureCreatorDraftStoreV1({storage,coreStorage});
 first.save(settings);
 assert.equal(storage.getItem('gensrpg.capture.v2.adventure.save.v1'),null);
 const cards=[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}];
 const created=createAdventureSessionV1({bestiaryCards:cards,starterId:'lumilo',
  rules:SHOWCASE_ADVENTURE_RULES_V1,ids:{sessionId:'session-1',instanceId:'member-1',creatorId:'creator-1'},
  now:'2026-11-05T16:00:00Z'});
 const configured=updateAdventureSessionControlV1({session:created,settings:first.load(),now:created.updatedAt});
 const canonical=createAdventureStoreV1({storage,coreStorage});
 canonical.create(configured);
 assert.equal(canonical.load().sessionControl.guestPermissions.editRewards,true);
 first.save({...settings,joinEnabled:false});
 assert.equal(canonical.load().sessionControl.joinEnabled,true,
  'creator draft changes cannot silently modify an existing session');
});
test('malformed drafts fail closed and are never erased; schema and bool validation come from Adventure owner',()=>{
 const {storage}=fixture();
 const owner=createAdventureCreatorDraftStoreV1({storage,coreStorage});
 storage.setItem(ADVENTURE_CREATOR_DRAFT_KEY_V1,'{');
 assert.throws(()=>owner.load(),/invalid|invalide/i);
 assert.equal(storage.getItem(ADVENTURE_CREATOR_DRAFT_KEY_V1),'{');
 const invalid={...settings,guestPermissions:{...settings.guestPermissions,editWorld:'yes'}};
 assert.throws(()=>owner.save(invalid),/boolean/i);
 assert.equal(storage.getItem(ADVENTURE_CREATOR_DRAFT_KEY_V1),'{');
 const future=JSON.stringify({schema:'gensrpg-capture-adventure-creator-draft-v1',version:2,settings});
 storage.setItem(ADVENTURE_CREATOR_DRAFT_KEY_V1,future);
 assert.throws(()=>owner.load(),/version/i);
 assert.equal(storage.getItem(ADVENTURE_CREATOR_DRAFT_KEY_V1),future);
});
