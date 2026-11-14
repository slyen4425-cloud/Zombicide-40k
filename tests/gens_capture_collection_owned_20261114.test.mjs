import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adventureOwnedCollectionV1} from '../assets/gensrpg/capture-v2/adventure-collection-v1.mjs';

const cards=[
 {id:'r',name:'Planta',portrait:{assetId:'official:planta'},rarity:'rare',
  skills:[{name:'Ronce',state:'ready'}]},
 {id:'m',name:'Esprit',rarity:'mythic',skills:[]},
 {id:'l',name:'Oiseau',rarity:'legendary',skills:[]}
];
const session={status:'playing',party:{
 active:{speciesId:'r',instanceId:'one',level:8},
 reserve:[{speciesId:'r',instanceId:'two',level:3}]
},storedCreatures:[{speciesId:'l',instanceId:'three',level:14}]};
test('Collection uses team and storage without another species ownership authority',()=>{
 const result=adventureOwnedCollectionV1({session,bestiaryCards:cards});
 assert.equal(result.totalCount,3);
 assert.equal(result.ownedCount,2);
 assert.equal(result.entries[0].owned,true);
 assert.deepEqual(result.entries[0].members.map(x=>x.level),[8,3]);
 assert.equal(result.entries[1].owned,false);
 assert.equal(result.entries[1].members.length,0);
 assert.equal(result.entries[2].members[0].place,'stockage');
 assert.equal(result.entries[2].members[0].level,14);
 assert.equal(result.entries[2].card,cards[2],'published Bestiary card is not duplicated');
 assert.equal(Object.isFrozen(result),true);
 assert.equal(Object.hasOwn(session,'collection'),false);
});
test('newly acquired species appears after the canonical party changes',()=>{
 const later={...session,party:{...session.party,reserve:[...session.party.reserve,
  {speciesId:'m',instanceId:'new',level:1}]}};
 assert.equal(adventureOwnedCollectionV1({session:later,bestiaryCards:cards}).ownedCount,3);
 assert.equal(adventureOwnedCollectionV1({session,bestiaryCards:cards}).ownedCount,2);
});
test('unowned cards stay disabled and only owned cards can show their fiche',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 assert.match(html,/data-adventure-sheet-tab="collection"/);
 assert.match(view,/tile\.disabled=!entry\.owned/);
 assert.match(view,/if\(!entry\.owned\)return/);
 assert.match(view,/onOpenOwnedCreature\(member\.instanceId\)/);
});
