import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCaptureUniverseProjectStoreV1,CAPTURE_UNIVERSE_INDEX_KEY_V1}
 from '../assets/gensrpg/capture-v2/universe-project-store-v1.mjs';
import {createCaptureUniverseAdventureStorageV1}
 from '../assets/gensrpg/capture-v2/universe-adventure-storage-v1.mjs';
import {createAdventureRulesDraftStoreV1} from '../assets/gensrpg/capture-v2/adventure-rules-draft-v1.mjs';
import {SHOWCASE_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
const core={
 readJson:(s,k,f)=>{try{const raw=s.getItem(k);return raw===null?f:JSON.parse(raw)}catch{return f}},
 writeJson:(s,k,v)=>(s.setItem(k,JSON.stringify(v)),v)
};
function memory(initial={}){
 const data=new Map(Object.entries(initial));
 return {get length(){return data.size},key:n=>[...data.keys()][n]??null,
  getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k),all:()=>Object.fromEntries(data)};
}
test('existing Monster InvoC is a read-only default; no legacy save migrated',()=>{
 const s=memory({'gensrpg.capture.v2.adventure.save.v1':'{"valuable":true}',
  'gensrpg.exploration.world-library.index.v1':'{"protected":true}'});
 const old=JSON.stringify(s.all());
 const lib=createCaptureUniverseProjectStoreV1({storage:s,coreStorage:core,makeId:()=> 'abc12345'});
 assert.deepEqual(lib.list().map(p=>p.name),['Monster InvoC']);
 assert.equal(lib.selected().id,'monster-invoc');
 assert.equal(JSON.stringify(s.all()),old,'read-only initial boot never touches user data');
 assert.equal(createCaptureUniverseAdventureStorageV1(s,'monster-invoc'),s);
});
test('independent universes have generated IDs, rename changes label only',()=>{
 const s=memory(),lib=createCaptureUniverseProjectStoreV1({
  storage:s,coreStorage:core,makeId:(()=>{let i=0;return()=>String(++i).padStart(8,'0')})()
 });
 const a=lib.create('Manga'),b=lib.create('Héros');
 assert.notEqual(a.id,b.id);assert.equal(lib.selected().id,b.id);
 assert.equal(lib.rename(a.id,'Manga aventure').id,a.id);
 assert.equal(lib.get(b.id).name,'Héros');
 assert.throws(()=>lib.create('Héros'),/déjà ce nom/);
 assert.throws(()=>lib.select('unv_notfound'),/introuvable/);
 assert.equal(s.getItem('gensrpg.capture.v2.adventure.save.v1'),null);
});
test('unfinished content cannot enter native editors, worlds, combat or save',()=>{
 const s=memory(),lib=createCaptureUniverseProjectStoreV1({
  storage:s,coreStorage:core,makeId:()=> '0000000a'
 });
 const p=lib.create('Univers vierge');
 assert.throws(()=>lib.requireReady(p.id),/non initialisé/);
 assert.throws(()=>lib.provision(p.id,{combatProjectId:p.id}),/propriétaires/);
 const refs={combatProjectId:'unv_a1234567',heroProjectId:'unv_b1234567',
  worldProjectId:'unv_c1234567',rulesProjectId:'unv_d1234567'};
 assert.throws(()=>lib.provision(p.id,refs),/Validation officielle/);
 const verifyOwners=Object.fromEntries(Object.keys(refs).map(role=>[role,
  (id,universe)=>id===refs[role]&&universe===p.id]));
 assert.equal(lib.provision(p.id,refs,verifyOwners).status,'ready');
 assert.equal(lib.requireReady(p.id).content.combatProjectId,refs.combatProjectId);
 assert.throws(()=>lib.provision(p.id,refs),/propriétaires/);
});
test('Adventure storage is genuinely partitioned, with no WorldDocument or Combat writes',()=>{
 const s=memory({'gensrpg.capture.v2.adventure.save.v1':'legacy','other':'keep'});
 const a=createCaptureUniverseAdventureStorageV1(s,'unv_00000001');
 const b=createCaptureUniverseAdventureStorageV1(s,'unv_00000002');
 const key='gensrpg.capture.v2.adventure.save.v1';
 a.setItem(key,'session-A');b.setItem(key,'session-B');
 assert.equal(a.getItem(key),'session-A');assert.equal(b.getItem(key),'session-B');
 assert.equal(s.getItem(key),'legacy');assert.equal(s.getItem('other'),'keep');
 assert.equal(a.length,1);assert.equal(a.key(0),key);
 assert.throws(()=>a.setItem('gensrpg.exploration.world-assembler.draft.v1','bad'),/autre propriétaire/);
 assert.throws(()=>a.setItem('gensrpg.capture.v2.universes.index.v1','bad'),/autre propriétaire/);
 a.removeItem(key);assert.equal(a.getItem(key),null);
 assert.equal(b.getItem(key),'session-B');assert.equal(s.getItem(key),'legacy');
});
test('corrupt or unknown-version universe index fails closed, never auto-clears',()=>{
 const s=memory({[CAPTURE_UNIVERSE_INDEX_KEY_V1]:'not json'});
 const lib=createCaptureUniverseProjectStoreV1({storage:s,coreStorage:core,makeId:()=> '12345678'});
 assert.throws(()=>lib.list(),/corrompue/);
 assert.equal(s.getItem(CAPTURE_UNIVERSE_INDEX_KEY_V1),'not json');
 assert.throws(()=>lib.create('Test'),/corrompue/);
});
test('Shell stays presentation-only; no new world or save owner is silently installed',()=>{
 const shell=readFileSync(new URL('../assets/gensrpg/capture-v2/shell-entry-v1.js',import.meta.url),'utf8');
 assert.doesNotMatch(shell,/localStorage|indexedDB|new WorldDocument|createAdventureStore/);
});

test('REAL Capture AdventureRules draft owner persists independently across project A and B',()=>{
 const s=memory();
 const a=createCaptureUniverseAdventureStorageV1(s,'unv_00000001');
 const b=createCaptureUniverseAdventureStorageV1(s,'unv_00000002');
 const aRules=createAdventureRulesDraftStoreV1({storage:a,coreStorage:core});
 const bRules=createAdventureRulesDraftStoreV1({storage:b,coreStorage:core});
 assert.equal(aRules.load(),null);assert.equal(bRules.load(),null);
 const saved=aRules.save(SHOWCASE_ADVENTURE_RULES_V1);
 assert.equal(bRules.load(),null,'different universe has no inherited authoring rules');
 assert.deepEqual(aRules.load(),saved,'original official rules serializer is still the writer');
 assert.equal(s.getItem(aRules.key),null,'global legacy draft remains untouched');
});
test('real Adventure startup refuses missing native owner projects, but preserves legacy URL',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(app,/projects\.requireReady\(universeId\)/);
 assert.match(app,/createCaptureUniverseAdventureStorageV1\(window\.localStorage,universeId\)/);
 assert.match(app,/if\(universeId!==null\)/);
 assert.match(app,/storage:adventureStorage,coreStorage:window\.GensStorageV1/);
});
