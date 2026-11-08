import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
 createAdventureSessionV1,createAdventureStoreV1,chooseAdventureActiveCreatureV1,
 SHOWCASE_ADVENTURE_RULES_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {createAdventurePortfolioStoreV1}
 from '../assets/gensrpg/capture-v2/adventure-portfolio-store-v1.mjs';
import {writeAdventurePlayingPartyV1} from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';
const context={};
vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8'),context);
const core=context.GensStorageV1;
const cards=['a','b','c'].map(id=>({id,name:'Creature '+id,skills:[{state:'ready'}]}));
const now='2026-11-08T21:40:00Z',combatSha='a'.repeat(40),world={id:'world-1',areas:[{id:'area-1'}]};
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,
 setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),
 key:i=>Array.from(data.keys())[i]??null,get length(){return data.size}};}
function reopen(storage){
 const legacyStore=createAdventureStoreV1({storage,coreStorage:core});
 return createAdventurePortfolioStoreV1({storage,coreStorage:core,legacyStore});
}
test('restarting an actual scoped save preserves the whole 1-to-6 roster and chosen first fighter',()=>{
 for(const size of [1,2,3,6]){
  const storage=memory(),ids=Array.from({length:size},(_,i)=>['a','b','c'][i%3]);
  const saved=createAdventureSessionV1({
   bestiaryCards:cards,starterId:ids[0],starterIds:ids,
   rules:SHOWCASE_ADVENTURE_RULES_V1,now,
   ids:{sessionId:'game-'+size,instanceId:'creature-1',creatorId:'creator',
    reserveInstanceIds:ids.slice(1).map((_,i)=>'creature-'+(i+2))}
  });
  const portfolio=reopen(storage);
  portfolio.create({...saved,status:'playing',world:{...saved.world,mapRef:world.id}});
  const originalIds=[saved.party.active,...saved.party.reserve].map(m=>m.instanceId);
  if(size>1){
   const loaded=portfolio.load();
   portfolio.save(chooseAdventureActiveCreatureV1({
    session:loaded,instanceId:'creature-'+size,now
   }));
  }
  const firstRaw=storage.getItem('gensrpg.capture.v2.adventure.slot.v1:game-'+size);
  const restarted=reopen(storage).load();
  assert.ok(firstRaw,'the real Core Storage slot must exist before reload');
  assert.equal(restarted.party.reserve.length,size-1);
  const members=[restarted.party.active,...restarted.party.reserve];
  assert.deepEqual(members.map(m=>m.instanceId).sort(),originalIds.sort());
  assert.equal(restarted.party.active.instanceId,'creature-'+(size>1?size:1));
  assert.equal(restarted.status,'playing');
  const grantStorage=memory();
  const publicationGrant=writeAdventurePublishedEncounterGrantV1({
   storage:grantStorage,session:restarted,world,bestiaryCards:cards,combatSha
  });
  const projected=writeAdventurePlayingPartyV1({
   storage:grantStorage,session:restarted,world,publicationGrant,combatSha
  });
  assert.equal(1+(projected.reserve?.length??0),size,
   'native Exploration must receive every SAVED creature after restart');
  assert.equal(projected.active.instanceId,restarted.party.active.instanceId);
  assert.equal(storage.getItem('gensrpg.capture.v2.adventure.slot.v1:game-'+size),firstRaw,
   'reading or projecting a saved party must never mutate the owned slot');
 }
});
test('a new-game selector may reset but a saved 6-party is always rendered from Core Storage',()=>{
 const ui=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(ui,/function renderSavedAdventureRosterV1\(state\)/);
 assert.match(ui,/renderSavedAdventureRosterV1\(state\)/);
 assert.match(ui,/\[state\.party\.active,\.\.\.\(state\.party\.reserve\?\?\[\]\)\]/);
 assert.match(html,/id="adventure-saved-roster-members"/);
 assert.match(html,/nouvelle.*partie/);
 assert.match(html,/class="adventure-loading-brand"[^>]*>GenSRPG</);
});
test('native Play is never shown before a source-authenticated first-frame ready message',()=>{
 const ui=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(ui,/showJourneyLoading\('Chargement du monde et des sauvegardes…'\)/);
 assert.match(ui,/event\.source!==frame\.contentWindow/);
 assert.match(ui,/schema==='gensrpg\.exploration\.play\.ready\.v1'/);
 assert.match(ui,/sessionId!==activePlayingSheet\?\.sessionId/);
 assert.match(ui,/dismissJourneyLoading\(\)/);
 assert.match(ui,/cancelPendingAdventureLaunch/);
 assert.match(ui,/frame\.src=url\.href/);
 assert.match(ui,/document\.querySelector\('\[data-adventure-app\]'\)\.hidden=true/);
});
