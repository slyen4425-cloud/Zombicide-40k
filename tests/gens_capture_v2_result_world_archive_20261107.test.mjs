import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectAdventureCombatAwardV1} from '../assets/gensrpg/capture-v2/adventure-result-presentation-v1.mjs';
import {checkAdventureWorldArchiveV1} from '../assets/gensrpg/capture-v2/adventure-world-choice-v1.mjs';
import {connectAdventureCombatHostV1,ADVENTURE_COMBAT_REQUEST_V1} from '../assets/gensrpg/capture-v2/adventure-combat-host-v1.mjs';

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

test('every re-entry can dispose the previous CombatResult listener without touching unrelated frames',()=>{
 const listeners=new Map();
 const playUrl='https://capture.invalid/vendor/exploration-lab/sculpt-lab.html?play=1&adventureSession=game-1';
 const frame={isConnected:true,contentWindow:{location:{href:playUrl}},
  addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},
  removeEventListener:(name,fn)=>listeners.get(name)?.delete(fn)};
 const store={load:()=>({schema:'gensrpg-capture-adventure-save-v1',
  status:'playing',sessionId:'game-1',world:{mapRef:'world-one'}})};
 const options={frame,playUrl,sessionId:'game-1',worldId:'world-one',
  store,locks:{request:()=>{}},readPending:()=>null,refreshParty:()=>{},
  bestiaryCards:[],progressionCore:null};
 const first=connectAdventureCombatHostV1(options);
 assert.equal(listeners.get(ADVENTURE_COMBAT_REQUEST_V1).size,1);
 first.dispose();
 assert.equal(listeners.get(ADVENTURE_COMBAT_REQUEST_V1).size,0);
 const second=connectAdventureCombatHostV1(options);
 assert.equal(listeners.get(ADVENTURE_COMBAT_REQUEST_V1).size,1);
 second.dispose();
 assert.equal(listeners.get(ADVENTURE_COMBAT_REQUEST_V1).size,0);
});

test('native READY request is acknowledged verbatim before any encounter can arm',async()=>{
 const listeners=new Map();
 const playUrl='https://capture.invalid/vendor/exploration-lab/sculpt-lab.html?play=1&adventureSession=game-1';
 const frame={isConnected:true,contentWindow:{location:{href:playUrl}},
  addEventListener:(name,fn)=>listeners.set(name,fn),
  removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)}};
 const store={load:()=>({status:'playing',sessionId:'game-1',world:{mapRef:'world-one'}})};
 const host=connectAdventureCombatHostV1({
  frame,playUrl,sessionId:'game-1',worldId:'world-one',store,locks:{request:()=>{}},
  readPending:()=>{throw Error('No battle should have been read before READY');},
  refreshParty:()=>{},bestiaryCards:[],progressionCore:null
 });
 const acknowledged=await new Promise((resolve,reject)=>{
  let claimed=false;
  listeners.get(ADVENTURE_COMBAT_REQUEST_V1)({
   target:frame,detail:{kind:'ready',sessionId:'game-1',respond:resolve},
   preventDefault(){claimed=true;}
  });
  queueMicrotask(()=>{if(!claimed)reject(Error('Native READY handshake was not claimed'));});
 });
 assert.deepEqual(acknowledged,{ready:true},
  'Exploration must receive exact READY before arming its native EncounterController');
 host.dispose();
 assert.equal(listeners.size,0);
});
