import assert from 'node:assert/strict';
import { createQuestDefinition } from '../src/modes/rpg/quest-engine.js';
import { createQuestRuntime, startQuestRuntime, applyQuestSignal, completeQuestRuntime, failQuestRuntime, questRuntimeSnapshot } from '../src/modes/rpg/quest-runtime.js';

const definitions={conditions:[{id:'level-2',sourceKind:'level',operator:'gte',value:2,enabled:true}]};
const quest=createQuestDefinition({
  id:'crypt',name:'Crypte',startConditionIds:['level-2'],
  objectives:[
    {id:'kill',kind:'defeat',targetId:'skeleton',required:2},
    {id:'rune',kind:'flag',targetId:'rune-found',required:1},
    {id:'bonus',kind:'flag',targetId:'cache-found',required:1,optional:true},
  ],
  rewardItemIds:['old-coin'],rewardXp:10,completionEventId:'quest-complete',failureEventId:'quest-fail'
});

let runtime=createQuestRuntime([quest]);
let out=startQuestRuntime(runtime,quest,{definitions,context:{level:1},now:'t0'});
assert.equal(out.ok,false);
assert.equal(out.reason,'conditions');

out=startQuestRuntime(runtime,quest,{definitions,context:{level:2},now:'t1'});
assert.equal(out.ok,true);
runtime=out.runtime;
assert.equal(questRuntimeSnapshot(runtime,'crypt').status,'active');

out=applyQuestSignal(runtime,[quest],{kind:'defeat',targetId:'zombie',amount:1},{definitions,context:{level:2},now:'t2'});
assert.equal(out.updates.length,0);
assert.equal(questRuntimeSnapshot(out.runtime,'crypt').progress.kill,0);

out=applyQuestSignal(runtime,[quest],{kind:'defeat',targetId:'skeleton',amount:1},{definitions,context:{level:2},now:'t3'});
runtime=out.runtime;
assert.equal(out.updates.length,1);
assert.equal(questRuntimeSnapshot(runtime,'crypt').progress.kill,1);

out=applyQuestSignal(runtime,[quest],{kind:'defeat',targetId:'skeleton',amount:5},{definitions,context:{level:2},now:'t4'});
runtime=out.runtime;
assert.equal(questRuntimeSnapshot(runtime,'crypt').progress.kill,2,'progress must clamp to required count');

out=completeQuestRuntime(runtime,quest,{now:'t5'});
assert.equal(out.ok,false);
assert.equal(out.reason,'objectives-incomplete');

out=applyQuestSignal(runtime,[quest],{kind:'flag',targetId:'rune-found',amount:1},{definitions,context:{level:2},now:'t6'});
runtime=out.runtime;
out=completeQuestRuntime(runtime,quest,{now:'t7'});
assert.equal(out.ok,true);
runtime=out.runtime;
assert.equal(out.state.status,'completed');
assert.deepEqual(out.rewards.itemIds,['old-coin']);
assert.equal(out.rewards.xp,10);
assert.deepEqual(out.rewards.eventIds,['quest-complete']);
assert.equal(runtime.log.some(entry=>entry.type==='quest-started'),true);
assert.equal(runtime.log.filter(entry=>entry.type==='quest-progress').length,3);
assert.equal(runtime.log.some(entry=>entry.type==='quest-completed'),true);

const repeatable=createQuestDefinition({id:'patrol',name:'Patrouille',repeatable:true,objectives:[{id:'visit',kind:'visit',targetId:'room-2',required:1}],failureEventId:'quest-fail'});
let repeatRuntime=createQuestRuntime([repeatable]);
repeatRuntime=startQuestRuntime(repeatRuntime,repeatable,{now:'r0'}).runtime;
let failed=failQuestRuntime(repeatRuntime,repeatable,{now:'r1'});
assert.equal(failed.ok,true);
assert.equal(failed.eventId,'quest-fail');
assert.equal(failed.state.status,'failed');
failed=startQuestRuntime(failed.runtime,repeatable,{now:'r2'});
assert.equal(failed.ok,true);
assert.equal(failed.state.status,'active');

console.log('rpg-quest-runtime.test.mjs: OK');
