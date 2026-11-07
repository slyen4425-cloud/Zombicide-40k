import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectAdventureCombatAwardV1} from '../assets/gensrpg/capture-v2/adventure-result-presentation-v1.mjs';
import {checkAdventureWorldArchiveV1} from '../assets/gensrpg/capture-v2/adventure-world-choice-v1.mjs';

const rules={loot:{items:[{id:'plume',name:'Plume',saleValue:2}]}};
const award={encounterId:'wild-1',enemyId:'creature-b',outcome:'victory',xp:1300,
 levelBefore:1,levelAfter:2,currency:12,drops:[{itemId:'plume',quantity:2}],heroXp:650};
test('result view shows exactly the persisted combat award, with no XP computation',()=>{
 const session={lastAward:award,rules,party:{active:{speciesId:'creature-a'}}};
 const v=projectAdventureCombatAwardV1({session,award,
  bestiaryCards:[{id:'creature-a',name:'Alliée'},{id:'creature-b',name:'Adversaire'}]});
 assert.equal(v.title,'Victoire');
 assert.deepEqual(v.rows.map(x=>x.value),[
  'Adversaire','+1300 XP pour Alliée','Niveau 1 → 2',
  '+650 XP','+12','Plume ×2']);
 assert.equal(session.lastAward,award);
 assert.equal(award.xp,1300);
});
test('a defeat is visible with zero rewards, and mismatched outcomes are never shown',()=>{
 const fail={...award,outcome:'defeat',xp:0,heroXp:0,currency:0,drops:[],
  levelAfter:1};
 const session={lastAward:fail,rules,party:{active:{speciesId:'creature-a'}}};
 const v=projectAdventureCombatAwardV1({session,award:fail,
  bestiaryCards:[{id:'creature-a',name:'Alliée'}]});
 assert.equal(v.title,'Défaite');
 assert.ok(v.rows.some(x=>x.label==='XP créature'&&x.value.includes('0 XP')));
 assert.throws(()=>projectAdventureCombatAwardV1({session,award}),/concordance|identique|persisté/i);
});
test('an archived world with stale portal links is detected without replacing either source',()=>{
 const active={id:'forest',areas:[{id:'area-a'}],portals:[{id:'portal-a'}]};
 const archived={id:'forest',areas:[{id:'area-a'}],portals:[]};
 const fingerprint=doc=>JSON.stringify(doc);
 assert.equal(checkAdventureWorldArchiveV1({
  activeWorld:active,archivedWorld:archived,selectedWorldId:'forest',fingerprint
 }).stale,true);
 assert.equal(checkAdventureWorldArchiveV1({
  activeWorld:active,archivedWorld:active,selectedWorldId:'forest',fingerprint
 }).stale,false);
 assert.equal(checkAdventureWorldArchiveV1({
  activeWorld:{...active,id:'another'},archivedWorld:archived,
  selectedWorldId:'forest',fingerprint
 }).stale,false);
 assert.equal(archived.portals.length,0);
});
test('Jouer displays an official saved result modal and checks archived world before replacing the draft',()=>{
 const ui=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const host=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-combat-host-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(ui,/checkAdventureWorldArchiveV1/);
 assert.match(ui,/projectAdventureCombatAwardV1/);
 assert.match(ui,/onCombatResult:/);
 assert.match(host,/onCombatResult/);
 assert.match(html,/id="adventure-result-dialog"/);
 assert.match(html,/id="adventure-result-close"/);
});
