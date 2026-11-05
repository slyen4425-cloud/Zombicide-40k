import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventurePlaySheetSnapshotV1} from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';
const published=[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}];
const registry={schema:'capture-stat-registry-v1',stats:[
  {id:'health',label:'Santé'}, {id:'speed',label:'Vitesse'}
]};
const save=()=>{
 const basic=createAdventureSessionV1({
  bestiaryCards:published,starterId:'lumilo',rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId:'session-play-1',instanceId:'owned-1',creatorId:'creator-1'},
  now:'2026-11-05T14:00:00Z'
 });
 return {...basic,status:'playing',world:{mapRef:'world-1',position:[1,2]},
  inventory:{currency:12,items:{'item-plume':3}},
  rules:{...basic.rules,loot:{...basic.rules.loot,
   items:[{id:'item-plume',name:'Plume',saleValue:4}],drops:[]}},
  party:{active:{...basic.party.active,level:2,xp:2000,statAllocations:{health:3}}}
 };
};
test('active character sheet is only a projection of canonical current Capture session and published registry',()=>{
 const snapshot=adventurePlaySheetSnapshotV1({session:save(),bestiaryCards:published,statRegistry:registry});
 assert.equal(snapshot.hero.level,null,'hero has no level unless creator enables it');
 assert.equal(snapshot.creature.speciesId,'lumilo');
 assert.equal(snapshot.creature.name,'Lumilo');
 assert.equal(snapshot.creature.level,2);
 assert.equal(snapshot.creature.xp,2000);
 assert.equal(snapshot.creature.availablePoints,17);
 assert.equal(snapshot.creature.stats[0].id,'health');
 assert.equal(snapshot.creature.stats[0].allocated,3);
 assert.equal(snapshot.inventory.currency,12);
 assert.equal(snapshot.inventory.items[0].name,'Plume');
 assert.equal(snapshot.inventory.items[0].quantity,3);
 assert.equal(snapshot.team.length,1);
 assert.equal(snapshot.team[0].instanceId,'owned-1');
 assert.equal(Object.hasOwn(snapshot,'reserve'),false,'never invent reserve party state');
});
test('unsupported or missing official stat registry fails closed',()=>{
 assert.throws(()=>adventurePlaySheetSnapshotV1({session:save(),bestiaryCards:published,statRegistry:null}),
  /registry|officiel|stat/i);
 assert.throws(()=>adventurePlaySheetSnapshotV1({session:{...save(),status:'configured'},bestiaryCards:published,statRegistry:registry}),
  /playing|partie|jeu/i);
});
test('the actual play view has one accessible sheet overlay, and no rival exploration engine',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 for(const id of ['adventure-play-sheet','adventure-open-sheet','adventure-close-sheet',
  'adventure-sheet-content','adventure-play-hud'])
  assert.ok(html.includes('id="'+id+'"'),'missing live play sheet control '+id);
 assert.match(html,/<dialog[^>]*id="adventure-play-sheet"/);
 assert.match(app,/adventurePlaySheetSnapshotV1/);
 assert.match(app,/allocateAdventureStatPointsV1/);
 assert.match(app,/refreshParty/,'must reproject the canonical party after allocation');
 assert.doesNotMatch(app,/location\.reload\(/);
});
