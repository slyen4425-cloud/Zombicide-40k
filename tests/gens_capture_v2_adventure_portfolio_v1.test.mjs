import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createAdventureSessionV1,createAdventureStoreV1,
 DEFAULT_ADVENTURE_RULES_V1,ADVENTURE_STORAGE_KEY_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {createAdventurePortfolioStoreV1,
 ADVENTURE_PORTFOLIO_KEY_V1,ADVENTURE_SLOT_PREFIX_V1}
 from '../assets/gensrpg/capture-v2/adventure-portfolio-store-v1.mjs';

const context={};
vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',
 import.meta.url),'utf8'),context);
const core=context.GensStorageV1;
const cards=[{id:'ready-creature',name:'Créature',level:1,
 skills:[{state:'ready',slot:'a',name:'Sort'}]}];
function memory(){
 const entries=new Map();
 const storage={getItem:key=>entries.get(key)??null,
  setItem:(key,v)=>entries.set(key,v),
  removeItem:key=>entries.delete(key),
  key:i=>Array.from(entries.keys())[i]??null,
  get length(){return entries.size}};
 return {storage,entries};
}
function game(id){
 return createAdventureSessionV1({
 bestiaryCards:cards,starterId:'ready-creature',
 rules:DEFAULT_ADVENTURE_RULES_V1,
 ids:{sessionId:id,instanceId:'unit-'+id,creatorId:'creator-'+id},
 now:'2026-11-06T19:00:00.000Z'
 });
}
function open(storage){
 const legacyStore=createAdventureStoreV1({storage,coreStorage:core});
 const portfolio=createAdventurePortfolioStoreV1({storage,coreStorage:core,legacyStore});
 return {legacyStore,portfolio};
}
test('a legacy save is available as one selectable game and remains byte-for-byte unchanged',()=>{
 const {storage,entries}=memory();
 const before=game('legacy-session');
 const {legacyStore}=open(storage);legacyStore.create(before);
 const original=entries.get(ADVENTURE_STORAGE_KEY_V1);
 const {portfolio}=open(storage);
 assert.equal(portfolio.load().sessionId,before.sessionId);
 assert.deepEqual(portfolio.list().map(x=>x.sessionId),['legacy-session']);
 assert.equal(entries.get(ADVENTURE_STORAGE_KEY_V1),original);
 assert.equal(entries.has(ADVENTURE_PORTFOLIO_KEY_V1),false,'reading must not migrate or overwrite');
});
test('create independent adventures while a first game is in progress, choose exact save, resume and persist',()=>{
 const {storage,entries}=memory();
 const {legacyStore,portfolio}=open(storage);
 const initial={...game('legacy-session'),status:'playing'};
 legacyStore.create(initial);
 const original=entries.get(ADVENTURE_STORAGE_KEY_V1);
 const a=game('adventure-a'),b=game('adventure-b');
 portfolio.create(a);
 assert.equal(portfolio.load().sessionId,'adventure-a');
 portfolio.create(b);
 assert.equal(portfolio.load().sessionId,'adventure-b');
 assert.equal(entries.get(ADVENTURE_STORAGE_KEY_V1),original);
 assert.equal(portfolio.list().length,3);
 assert.ok(entries.has(ADVENTURE_SLOT_PREFIX_V1+'adventure-a'));
 assert.ok(entries.has(ADVENTURE_SLOT_PREFIX_V1+'adventure-b'));
 portfolio.select('adventure-a');
 const old=portfolio.load();
 portfolio.save({...old,status:'playing',updatedAt:'2026-11-06T19:05:00.000Z'});
 assert.equal(portfolio.load().status,'playing');
 assert.equal(open(storage).portfolio.load().sessionId,'adventure-a');
 open(storage).portfolio.select('adventure-b');
 assert.equal(open(storage).portfolio.load().status,'configured');
 portfolio.select('legacy-session');
 assert.equal(portfolio.load().status,'playing');
 assert.equal(entries.get(ADVENTURE_STORAGE_KEY_V1),original);
});
test('never overwrite another save through selection, creation or another adventure session ID',()=>{
 const {storage}=memory(),{portfolio}=open(storage);
 portfolio.create(game('adventure-a'));
 portfolio.create(game('adventure-b'));
 assert.throws(()=>portfolio.create(game('adventure-a')),/existe|existant/i);
 assert.throws(()=>portfolio.select('unknown-session'),/introuvable|absente/i);
 assert.throws(()=>portfolio.save(game('adventure-a')),/autre|active|sélection/i);
 assert.equal(portfolio.load().sessionId,'adventure-b');
 portfolio.select('adventure-a');
 assert.equal(portfolio.load().sessionId,'adventure-a');
 assert.throws(()=>portfolio.save(game('adventure-b')),/autre|active|sélection/i);
});
test('corrupt legacy/index/slot never triggers reset or overwrite',()=>{
 const a=memory();const {portfolio}=open(a.storage);
 portfolio.create(game('adventure-a'));
 const key=ADVENTURE_SLOT_PREFIX_V1+'adventure-a';
 const original=a.entries.get(key);
 a.entries.set(key,'{corrupt');
 assert.throws(()=>portfolio.load(),/invalide|corrompue|invalid/i);
 assert.equal(a.entries.get(key),'{corrupt');
 a.entries.set(key,original);
 a.entries.set(ADVENTURE_PORTFOLIO_KEY_V1,'{broken');
 assert.throws(()=>open(a.storage).portfolio.list(),/corrompue|invalide|invalid/i);
 assert.equal(a.entries.get(ADVENTURE_PORTFOLIO_KEY_V1),'{broken');
});
test('the real Adventure UI chooses a saved adventure and never disables new-game creation because a save exists',()=>{
 const ui=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(ui,/createAdventurePortfolioStoreV1/);
 assert.match(ui,/portfolio\.select\(/);
 assert.match(ui,/portfolio\.list\(/);
 assert.match(html,/id="adventure-save-select"/);
 assert.match(html,/id="adventure-save-load"/);
 assert.match(ui,/createAdventureSessionV1/);
 assert.doesNotMatch(ui,/if\(store\.load\(\)\)\s*throw.*partie existe/i);
});
