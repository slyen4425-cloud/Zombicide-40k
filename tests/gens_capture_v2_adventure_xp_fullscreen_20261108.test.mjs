import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createAdventureSessionV1,applyAdventureCombatResultV1,
 SHOWCASE_ADVENTURE_RULES_V1,DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {projectAdventureCombatAwardV1}
 from '../assets/gensrpg/capture-v2/adventure-result-presentation-v1.mjs';

const vmContext={};
vm.runInNewContext(readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8'),vmContext);
const progressionCore=vmContext.GensProgressionV1;
const cards=['a','b','enemy'].map(id=>({id,name:id,level:1,skills:[{state:'ready'}]}));
const now='2026-11-08T19:50:00Z';
const rules=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
 xp:{...SHOWCASE_ADVENTURE_RULES_V1.xp,baseVictoryXp:1001}});
function game(size,rule=rules){
 const species=Array.from({length:size},(_,i)=>i%2?'b':'a');
 const base=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'a',starterIds:species,rules:rule,
  ids:{sessionId:'game-1',instanceId:'owned-1',creatorId:'creator-1',
   reserveInstanceIds:species.slice(1).map((_,i)=>'owned-'+(i+2))},now});
 return {...base,status:'playing'};
}
function encounter(s,hpByIndex=null,outcome='victory'){
 const members=[s.party.active,...s.party.reserve];
 return {version:1,snapshot:{schema:'capture-encounter-snapshot-v1',version:1,
  encounterId:'battle-1',returnToken:'return-1',opponents:[{creatureId:'enemy'}]},
  result:{schema:'capture-combat-result-v1',version:1,
   encounterId:'battle-1',returnToken:'return-1',outcome,rewards:[],partyState:{
    activeCreatureId:'a',activeInstanceId:'owned-1',hp:hpByIndex?.[0]??20,
    members:members.map((m,i)=>({instanceId:m.instanceId,speciesId:m.speciesId,
     hp:hpByIndex?.[i]??20}))
  }}};
}
const commit=(s,e)=>applyAdventureCombatResultV1({session:s,envelope:e,bestiaryCards:cards,
 progressionCore,random:()=>0.5,now});

test('new showcase rules share XP, legacy saved rules keep active-only behavior',()=>{
 assert.equal(SHOWCASE_ADVENTURE_RULES_V1.xp.distribution,'all');
 assert.equal(DEFAULT_ADVENTURE_RULES_V1.xp.distribution,'active');
 assert.equal(normalizeAdventureRulesV1(game(2).rules).xp.distribution,'all');
 assert.equal(normalizeAdventureRulesV1(game(2,DEFAULT_ADVENTURE_RULES_V1).rules).xp.distribution,'active');
 assert.throws(()=>normalizeAdventureRulesV1({...rules,
  xp:{...rules.xp,distribution:'unknown'}}),/distribution/);
});
for(const size of [1,2,3,6]){
 test('team share keeps exact total and persists unique member XP for '+size+' creature(s)',()=>{
  const s=game(size),e=encounter(s);
  const result=commit(s,e);
  assert.equal(result.applied,true);
  assert.equal(result.award.xp,1001);
  assert.equal(result.award.memberXp.length,size);
  const grants=result.award.memberXp.map(m=>m.xp);
  assert.equal(grants.reduce((a,b)=>a+b,0),1001);
  assert.ok(Math.max(...grants)-Math.min(...grants)<=1);
  const saved=[result.session.party.active,...result.session.party.reserve];
  assert.deepEqual(saved.map(m=>m.xp),grants);
  const receipt=projectAdventureCombatAwardV1({
   session:result.session,award:result.award,bestiaryCards:cards});
  assert.equal(receipt.rows.filter(r=>r.label.startsWith('Créature ')).length,size);
  assert.equal(commit(result.session,e).applied,false,'same official battle cannot reaward');
  assert.equal(s.party.active.xp,0,'input save remains immutable');
 });
}
test('switch and KO preserve XP of every original instance without awarding to replacement twice',()=>{
 const s=game(3),e=encounter(s,[0,17,9]);
 const r=commit(s,e);
 assert.equal(r.session.party.active.instanceId,'owned-2');
 const byId=new Map([r.session.party.active,...r.session.party.reserve]
  .map(m=>[m.instanceId,m]));
 assert.equal(byId.get('owned-1').xp,334);
 assert.equal(byId.get('owned-2').xp,334);
 assert.equal(byId.get('owned-3').xp,333);
 assert.equal(byId.get('owned-1').hp,0);
 assert.equal(byId.get('owned-2').hp,17);
 assert.equal(r.award.memberXp[0].instanceId,'owned-1');
});
test('old active-only rule remains byte-compatible and no XP is given to bench',()=>{
 const s=game(2,DEFAULT_ADVENTURE_RULES_V1),e=encounter(s);
 const r=commit(s,e);
 assert.equal(r.session.party.active.xp,1000);
 assert.equal(r.session.party.reserve[0].xp,0);
 assert.equal(Object.hasOwn(r.award,'memberXp'),false);
});
test('a defeat gives 0 XP to everyone and preserves original roster HP state',()=>{
 const s=game(2),e=encounter(s,[0,0],'defeat'),r=commit(s,e);
 assert.equal(r.award.xp,0);
 assert.deepEqual(r.award.memberXp.map(m=>m.xp),[0,0]);
});
test('Shell fullscreen contains Capture Sac, Équipe and native Back, Explorer cannot steal layer',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const shell=readFileSync(new URL('../assets/gensrpg/capture-v2/shell-entry-v1.js',import.meta.url),'utf8');
 assert.match(shell,/function requestGameFullscreen\(\)/);
 assert.match(shell,/host\.requestFullscreen\(/);
 assert.match(shell,/gameFullscreenActive,onGameFullscreenChange/);
 assert.match(app,/shell\.requestGameFullscreen\(\)/);
 assert.match(app,/shell\.exitGameFullscreen\(\)/);
 assert.match(html,/id="adventure-xp-distribution"/);
 assert.match(html,/id="adventure-play-frame"[^>]+allow="autoplay" hidden/);
 assert.doesNotMatch(html,/id="adventure-play-frame"[^>]*allowfullscreen/);
 assert.match(app,/void requestAdventureFullscreen\(\);\s*const selectedWorldId/);
 assert.match(app,/url\.searchParams\.set\('cameraAngle',String\(result\.session\.cameraPolicy/);
});
