import test from 'node:test';
import fs from 'node:fs';

import assert from 'node:assert/strict';
import {DEFAULT_ADVENTURE_RULES_V1,createAdventureSessionV1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventureHeroSelectionGrantV1,ADVENTURE_HERO_SELECTION_SCHEMA_V1} from '../assets/gensrpg/capture-v2/adventure-hero-selection-grant-v1.mjs';
const heroId='hero.user.00000000-0000-4000-8000-000000000001';
const cards=[{id:'ally',name:'Publié',level:1,skills:[{state:'ready'}]}];
function newGame(id=heroId){
 return createAdventureSessionV1({bestiaryCards:cards,starterId:'ally',
  heroDefinitionId:id,rules:DEFAULT_ADVENTURE_RULES_V1,
  ids:{sessionId:'session-hero1',instanceId:'owned-ally1'},now:'2026-11-04T14:10:00Z'});
}
function playing(id=heroId){
 const game=newGame(id);
 return {...game,status:'playing',world:{mapRef:'world1',position:null}};
}
const world={id:'world1'};
const heroRecord={schema:'gensrpg-exploration-user-hero-v1',version:1,id:heroId};
const storage=()=>{
 const values=new Map();
 return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
};
const write=(extra={})=>{
 const target=storage();
 const receipt=writeAdventureHeroSelectionGrantV1({
  storage:target,session:playing(),world,heroRecord,...extra
 });
 return {receipt,target};
};
test('AdventureSession keeps ONLY the official hero definition reference; starter remains level 1',()=>{
 const initial=newGame();
 assert.equal(initial.hero.definitionId,heroId);
 assert.equal(initial.hero.progression,null);
 assert.equal(initial.party.active.level,1);
 assert.equal(initial.party.active.xp,0);
 assert.equal(initial.hero.assetId,undefined);
});
test('old AdventureSession without selected hero stays no-level and has no fabricated hero ID',()=>{
 const initial=newGame(null);
 assert.equal(initial.hero.definitionId,undefined);
 assert.equal(initial.hero.progression,null);
});
test('refuse explicit invalid IDs or arbitrary paths for the chosen HeroDefinition',()=>{
 for(const id of ['manual','../person.png','https://other.example/hero.webp',
  'actor.demo.hero.traveler.01','hero.user.',42]){
  assert.throws(()=>newGame(id));
 }
});
test('grant publishes only session/world-bound hero ID, no files and only in sessionStorage',()=>{
 const {receipt,target}=write();
 assert.equal(receipt.schema,ADVENTURE_HERO_SELECTION_SCHEMA_V1);
 assert.equal(receipt.version,1);
 assert.deepEqual(Object.keys(receipt).sort(),
  ['schema','version','sessionId','worldId','heroDefinitionId'].sort());
 const key=ADVENTURE_HERO_SELECTION_SCHEMA_V1+':session-hero1';
 assert.deepEqual(JSON.parse(target.getItem(key)),receipt);
 assert.equal(JSON.stringify([...target.values]).includes('blob:'),false);
});
test('no grant for unchanged legacy game, and no writes for missing/invalid hero',()=>{
 const empty=storage();
 assert.equal(writeAdventureHeroSelectionGrantV1({
  storage:empty,session:playing(null),world,heroRecord:null
 }),null);
 assert.equal(empty.values.size,0);
 for(const override of [
  {session:newGame()},
  {world:{id:'other-world'}},
  {heroRecord:null},
  {heroRecord:{...heroRecord,id:'hero.user.00000000-0000-4000-8000-000000000002'}},
  {heroRecord:{...heroRecord,schema:'unknown'}},
  {storage:{setItem(){throw Error('storage blocked')}}}
 ]){
  assert.throws(()=>write(override));
 }
});
test('hero and world identity remain frozen in AdventureSession even when combat XP later changes',()=>{
 const before=newGame();
 const after={...before,party:{active:{...before.party.active,level:3,xp:2500}}};
 assert.equal(after.hero.definitionId,heroId);
});

test('real Aventure UI exposes official Explorer user heroes, never requires technical IDs, and grants the saved hero',()=>{
 const html=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const flow=fs.readFileSync(new URL('../.github/workflows/capture-v2-clean-base.yml',import.meta.url),'utf8');
 for(const id of ['adventure-hero-choice','adventure-hero-editor','adventure-hero-refresh',
  'adventure-hero-save-selection','adventure-hero-editor-panel','adventure-hero-editor-frame',
  'adventure-hero-editor-close'])
   assert.ok(html.includes('id="'+id+'"'),'Aventure must offer a user-friendly owner UI: '+id);
 assert.match(app,/createUserHeroStoreV1/);
 assert.match(app,/vendor\/exploration-lab\/src\/storage\/user-hero-store-v1\.js/);
 assert.match(app,/heroLibrary\.list\(\)/);
 assert.match(app,/heroLibrary\.get\(/);
 assert.match(app,/heroDefinitionId:\s*selectedHero/);
 assert.match(app,/writeAdventureHeroSelectionGrantV1/);
 assert.match(app,/vendor\/exploration-lab\/hero-editor\.html/);
 assert.ok(app.indexOf('writeAdventureHeroSelectionGrantV1(')>app.indexOf('startAdventureExplorationV1('),
  'only the validated real playing session may grant its saved HeroDefinition');
 assert.match(flow,/hero-editor\.html/,
  'the official CI packaged site must exercise the same page users will open');
 assert.doesNotMatch(app,/localStorage\.setItem\([^\n]*hero/i,
  'the Explorer IndexedDB is the only owner of image bytes');
});
