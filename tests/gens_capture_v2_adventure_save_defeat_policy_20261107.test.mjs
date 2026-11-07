import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
 DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,applyAdventureCombatResultV1,
 recoverAdventureDefeatedPartyV1,createAdventureStoreV1,
 ADVENTURE_STORAGE_KEY_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {
 createAdventurePortfolioStoreV1,ADVENTURE_SLOT_PREFIX_V1,
 ADVENTURE_PORTFOLIO_KEY_V1
} from '../assets/gensrpg/capture-v2/adventure-portfolio-store-v1.mjs';

const services={};
vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/storage-v1.js',import.meta.url),'utf8'),services);
vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8'),services);
const cards=[{id:'creature-a',name:'Créature A',level:1,skills:[{state:'ready'}]},
 {id:'creature-b',name:'Créature B',level:1,skills:[{state:'ready'}]}];
const ids=id=>({sessionId:id,instanceId:'member-'+id,creatorId:'author-'+id});
function session(id,rules=DEFAULT_ADVENTURE_RULES_V1){
 return createAdventureSessionV1({bestiaryCards:cards,starterId:'creature-a',
  rules,ids:ids(id),now:'2026-11-07T06:00:00Z'});
}
function defeat(id='combat-1'){
 return {version:1,snapshot:{schema:'capture-encounter-snapshot-v1',version:1,
  encounterId:id,returnToken:'return-1',opponents:[{creatureId:'creature-b'}]},
  result:{schema:'capture-combat-result-v1',version:1,encounterId:id,
   returnToken:'return-1',outcome:'defeat',partyState:{activeCreatureId:'creature-a',hp:0},rewards:[]}};
}
function result(state,envelope=defeat()){
 return applyAdventureCombatResultV1({session:state,envelope,bestiaryCards:cards,
  progressionCore:services.GensProgressionV1,random:()=>0.5,now:'2026-11-07T07:00:00Z'});
}
function memory(){
 const entries=new Map();
 return {entries,storage:{getItem:k=>entries.get(k)??null,
  setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k),
  key:i=>Array.from(entries.keys())[i]??null,
  get length(){return entries.size;}}};
}
function portfolio(storage){
 const legacyStore=createAdventureStoreV1({storage,coreStorage:services.GensStorageV1});
 return {legacyStore,book:createAdventurePortfolioStoreV1({
  storage,coreStorage:services.GensStorageV1,legacyStore})};
}
test('showcase restores a KO creature by policy without erasing the defeat or giving rewards',()=>{
 assert.equal(normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1).combat.defeatPolicy,'restore');
 const before={...session('game-1'),status:'playing'};
 const first=result(before);
 assert.equal(first.award.outcome,'defeat');
 assert.equal(first.award.xp,0);
 assert.equal(first.session.party.active.hp,null,'null tells the official Combat to initialize full HP for the next encounter');
 assert.equal(first.session.status,'playing');
 assert.equal(first.session.processedEncounterKeys.length,1);
 assert.equal(first.session.party.active.xp,0);
 assert.equal(first.session.lastAward.outcome,'defeat');
 assert.equal(result(first.session).applied,false,'the same official result cannot be processed twice');
});
test('a previously saved KO session is repaired only after real defeat with recovery policy',()=>{
 const before={...session('old-game'),status:'playing',
  party:{active:{...session('old-game').party.active,hp:0}},
  lastAward:{outcome:'defeat',xp:0}};
 const healed=recoverAdventureDefeatedPartyV1({session:before,now:'2026-11-07T07:30:00Z'});
 assert.equal(healed.party.active.hp,null);
 assert.equal(healed.lastAward.outcome,'defeat');
 assert.equal(before.party.active.hp,0);
 assert.equal(recoverAdventureDefeatedPartyV1({session:healed}),healed);
 const noDefeat={...before,lastAward:{outcome:'victory'}};
 assert.equal(recoverAdventureDefeatedPartyV1({session:noDefeat}),noDefeat);
});
test('keep-ko persists 0 HP without auto healing, preserving later item recovery',()=>{
 const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  combat:{hpMultiplier:0.25,defeatPolicy:'keep-ko'}});
 const state={...session('keep-ko',rules),status:'playing'};
 const ko=result(state);
 assert.equal(ko.session.party.active.hp,0);
 assert.equal(ko.session.status,'playing');
 assert.equal(ko.award.outcome,'defeat');
 assert.equal(ko.session.lastAward.outcome,'defeat');
 assert.equal(ko.session.party.active.xp,0);
 assert.equal(recoverAdventureDefeatedPartyV1({session:ko.session}),ko.session);
});
test('an individual 0 HP is NOT a game over without an official team defeat',()=>{
 const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  combat:{hpMultiplier:0.25,defeatPolicy:'game-over'}});
 const base={...session('team-continue',rules),status:'playing'};
 const envelope=defeat('team-encounter');
 envelope.result.outcome='fled'; // Combat team did not report defeat.
 const outcome=result(base,envelope);
 assert.equal(outcome.session.party.active.hp,0);
 assert.equal(outcome.session.status,'playing');
 assert.equal(outcome.award.outcome,'fled');
 assert.equal(outcome.award.xp,0);
 // Future multi-creature roster handling stays in official Combat, never
 // guessed from the first actor HP in GenSRPG.
});
test('creator can choose an explicit terminal game over, and old rules remain recoverable',()=>{
 const custom=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  combat:{hpMultiplier:0.25,defeatPolicy:'game-over'}});
 const over=result({...session('game-over',custom),status:'playing'});
 assert.equal(over.session.status,'finished');
 assert.equal(over.session.party.active.hp,0);
 assert.equal(over.session.lastAward.outcome,'defeat');
 const historic=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,combat:{hpMultiplier:1}});
 assert.equal(historic.combat.defeatPolicy,'restore');
 assert.throws(()=>normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  combat:{hpMultiplier:0.25,defeatPolicy:'surprise'}}),/defeatPolicy/);
});
test('deleting only a chosen save is explicit, leaves worlds and other sessions intact, and updates selection',()=>{
 const {entries,storage}=memory(),{book,legacyStore}=portfolio(storage);
 legacyStore.create(session('legacy'));
 book.create(session('slot-a'));
 book.create(session('slot-b'));
 storage.setItem('exploration.world-library.author','untouched');
 const a=entries.get(ADVENTURE_SLOT_PREFIX_V1+'slot-a');
 const legacy=entries.get(ADVENTURE_STORAGE_KEY_V1);
 assert.throws(()=>book.delete('nonexistent'),/introuvable|absente/i);
 assert.ok(entries.has(ADVENTURE_SLOT_PREFIX_V1+'slot-b'));
 book.delete('slot-b');
 assert.equal(book.load().sessionId,'legacy');
 assert.equal(entries.has(ADVENTURE_SLOT_PREFIX_V1+'slot-b'),false);
 assert.equal(entries.get(ADVENTURE_SLOT_PREFIX_V1+'slot-a'),a);
 assert.equal(entries.get(ADVENTURE_STORAGE_KEY_V1),legacy);
 assert.equal(entries.get('exploration.world-library.author'),'untouched');
 assert.deepEqual(book.list().map(x=>x.sessionId),['legacy','slot-a']);
 book.select('slot-a');
 book.delete('legacy');
 assert.equal(book.load().sessionId,'slot-a');
 assert.equal(entries.has(ADVENTURE_STORAGE_KEY_V1),false);
 assert.equal(entries.get(ADVENTURE_SLOT_PREFIX_V1+'slot-a'),a);
 book.delete('slot-a');
 assert.equal(book.load(),null);
 assert.deepEqual(book.list(),[]);
 assert.equal(JSON.parse(entries.get(ADVENTURE_PORTFOLIO_KEY_V1)).slotIds.length,0);
});
test('UI offers only a confirmed Capture-only delete action and explicit defeat options',()=>{
 const ui=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(html,/id="adventure-save-delete"/);
 assert.match(html,/id="adventure-defeat-policy"/);
 assert.match(ui,/window\.confirm\(/);
 assert.match(ui,/portfolio\.delete\(/);
 assert.match(ui,/status==='finished'/);
});
