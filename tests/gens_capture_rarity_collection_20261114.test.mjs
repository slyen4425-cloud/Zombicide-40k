import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SHOWCASE_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,createAdventureSessionV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventurePlaySheetSnapshotV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';

const cards=[
 {id:'crea-r',name:'Herbor',rarity:'rare',description:'Une créature commune',
  elements:['nature'],skills:[{state:'ready',name:'Griffe',requiredLevel:1}]},
 {id:'crea-m',name:'Mythia',rarity:'mythic',description:'Mythique',
  elements:['spirit'],skills:[{state:'ready',name:'Onde',requiredLevel:5}]},
 {id:'crea-l',name:'Legendia',rarity:'legendary',description:'Légendaire',
  elements:['light'],skills:[{state:'ready',name:'Éclat',requiredLevel:10}]}
];
const ids={sessionId:'s-1',instanceId:'i-1',reserveInstanceIds:[],creatorId:'owner-1'};
const now='2026-11-14T15:00:00.000Z';
const create=(starterId,rules=SHOWCASE_ADVENTURE_RULES_V1)=>createAdventureSessionV1({
 bestiaryCards:cards,starterId,ids,now,rules
});

test('the public showcase permits Rare starters only, at the canonical game-state owner',()=>{
 assert.equal(normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1)
  .starterSelection.allowAllRarities,false);
 assert.equal(create('crea-r').party.active.speciesId,'crea-r');
 assert.throws(()=>create('crea-m'),/Seules les créatures Rare/);
 assert.throws(()=>create('crea-l'),/Seules les créatures Rare/);
});
test('creator opt-in permits all three official ranks, never alters existing sessions',()=>{
 const custom=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  starterSelection:{allowAllRarities:true}});
 assert.equal(create('crea-m',custom).party.active.speciesId,'crea-m');
 assert.equal(create('crea-l',custom).party.active.speciesId,'crea-l');
 assert.equal(normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  starterSelection:undefined}).starterSelection.allowAllRarities,false);
 assert.throws(()=>normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  starterSelection:{allowAllRarities:'yes'}}),/boolean/);
});
test('collection shows only possessed official cards with actual levels (team and storage)',()=>{
 const session={...create('crea-r'),status:'playing',
  storedCreatures:[{instanceId:'stored-1',speciesId:'crea-m',level:7,xp:0,hp:null}]};
 const snapshot=adventurePlaySheetSnapshotV1({session,bestiaryCards:cards,
  statRegistry:{schema:'capture-stat-registry-v1',stats:[]}});
 assert.equal(snapshot.collection.length,3);
 assert.deepEqual(snapshot.collection.find(c=>c.id==='crea-r').levels,[1]);
 assert.deepEqual(snapshot.collection.find(c=>c.id==='crea-m').levels,[7]);
 const unknown=snapshot.collection.find(c=>c.id==='crea-l');
 assert.equal(unknown.owned,false);
 assert.equal(Object.hasOwn(unknown,'skills'),false);
 assert.equal(Object.hasOwn(unknown,'description'),false);
 assert.equal(Object.hasOwn(unknown,'elements'),false);
});
test('the official collection UI greys locked species and blocks their detail',()=>{
 const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
 const html=readFileSync(new URL('adventure.html',root),'utf8');
 const view=readFileSync(new URL('adventure-play-sheet-view-v1.mjs',root),'utf8');
 const css=readFileSync(new URL('adventure-style-v1.css',root),'utf8');
 const app=readFileSync(new URL('adventure-app-v1.mjs',root),'utf8');
 assert.match(html,/data-adventure-sheet-tab="collection"/);
 assert.match(html,/id="adventure-starter-allow-all"/);
 assert.match(view,/entry\.owned\?'button':'div'/);
 assert.match(view,/sheet-collection-locked/);
 assert.match(view,/entry\.owned\)[\s\S]*?onInspectCollectionCreature/);
 assert.match(css,/filter:grayscale\(1\)/);
 assert.match(app,/record\.id\+'\.portrait'/);
 assert.match(app,/starterSelection:\{allowAllRarities:/);
});
