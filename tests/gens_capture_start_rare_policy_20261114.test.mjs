import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const cards=[
 {id:'rare',name:'Rare',skills:[{state:'ready'}]},
 {id:'mythic',name:'Mythique',rarity:'mythic',skills:[{state:'ready'}]},
 {id:'legendary',name:'Légendaire',rarity:'legendary',skills:[{state:'ready'}]}
];
const ids={sessionId:'session-rarity',instanceId:'owned-rarity',creatorId:'creator-rarity'};
const create=(starterId,rules=DEFAULT_ADVENTURE_RULES_V1)=>
 createAdventureSessionV1({bestiaryCards:cards,starterId,rules,ids,now:'2026-11-14T12:00:00Z'});
test('showcase and historical rules default to Rare without changing old saves',()=>{
 const older=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(older.starterSelection,undefined);
 assert.equal(create('rare').party.active.speciesId,'rare');
 assert.throws(()=>create('mythic'),/Mythique|Légendaire/);
 assert.throws(()=>create('legendary'),/Mythique|Légendaire/);
});
test('opt-in creator rule permits all published ranks and survives normalisation',()=>{
 const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  starterSelection:{allowAllRarities:true}});
 assert.equal(rules.starterSelection.allowAllRarities,true);
 assert.equal(create('mythic',rules).party.active.speciesId,'mythic');
 assert.equal(create('legendary',rules).party.active.speciesId,'legendary');
 assert.throws(()=>normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  starterSelection:{allowAllRarities:'yes'}}),/boolean/);
});
test('rarity policy is in advanced creator UI and canonical game contract',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(html,/id="adventure-starter-rarity-options"/);
 assert.match(html,/id="adventure-starter-all-rarities"/);
 assert.match(app,/starterSelection:\{allowAllRarities:/);
 assert.match(app,/function eligibleForNewGame\(card\)/);
 assert.match(app,/fillPublicSpecies\(\);updatePreview\(\);/);
});
