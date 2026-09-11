import assert from 'node:assert/strict';
import {createQuestDefinition,validateQuestDefinition,createQuestState,startQuest,addQuestProgress,isQuestReady,completeQuest,failQuest,claimQuestRewards} from '../src/modes/rpg/quest-engine.js';

const definitions={
  conditions:[{id:'level-2'}],
  items:[{id:'old-coin'}],
  events:[{id:'quest-reward'},{id:'quest-complete'},{id:'quest-fail'}],
};
const quest=createQuestDefinition({
  id:'crypt-key',name:'La clé de la crypte',startConditionIds:['level-2'],
  objectives:[
    {id:'kill-skeletons',label:'Éliminer les squelettes',kind:'defeat',targetId:'skeleton',required:3},
    {id:'find-rune',label:'Trouver la rune',kind:'flag',targetId:'rune-found',required:1},
    {id:'bonus-cache',label:'Trouver la cache',kind:'flag',targetId:'cache-found',required:1,optional:true},
  ],
  rewardItemIds:['old-coin'],rewardXp:10,rewardEventId:'quest-reward',completionEventId:'quest-complete',failureEventId:'quest-fail'
});
assert.equal(validateQuestDefinition(quest,definitions).valid,true);
let state=createQuestState(quest,{runId:'run-1'});
let out=startQuest(quest,state,{canStart:false}); assert.equal(out.ok,false); assert.equal(out.reason,'conditions');
out=startQuest(quest,state,{canStart:true,now:'t0'}); assert.equal(out.ok,true); state=out.state; assert.equal(state.status,'active');
out=addQuestProgress(quest,state,'kill-skeletons',2,{now:'t1'}); state=out.state; assert.equal(out.questReady,false); assert.equal(state.progress['kill-skeletons'],2);
out=addQuestProgress(quest,state,'kill-skeletons',5,{now:'t2'}); state=out.state; assert.equal(state.progress['kill-skeletons'],3); assert.equal(out.objectiveCompleted,true); assert.equal(isQuestReady(quest,state),false);
out=addQuestProgress(quest,state,'find-rune',1,{now:'t3'}); state=out.state; assert.equal(isQuestReady(quest,state),true);
out=completeQuest(quest,state,{now:'t4'}); assert.equal(out.ok,true); state=out.state; assert.equal(state.status,'completed'); assert.deepEqual(out.rewards.itemIds,['old-coin']); assert.equal(out.rewards.xp,10); assert.deepEqual(out.rewards.eventIds,['quest-reward','quest-complete']);
let claim=claimQuestRewards(state); assert.equal(claim.ok,true); state=claim.state; claim=claimQuestRewards(state); assert.equal(claim.ok,false); assert.equal(claim.reason,'already-claimed');
out=completeQuest(quest,state); assert.equal(out.ok,false); assert.equal(out.reason,'already-completed');

const repeatable=createQuestDefinition({id:'daily',name:'Patrouille',repeatable:true,objectives:[{id:'visit',required:1}],failureEventId:'quest-fail'});
state=startQuest(repeatable,createQuestState(repeatable),{canStart:true}).state;
out=failQuest(repeatable,state,{now:'t5'}); assert.equal(out.ok,true); assert.equal(out.eventId,'quest-fail'); assert.equal(out.state.status,'failed');
out=startQuest(repeatable,out.state,{canStart:true}); assert.equal(out.ok,true); assert.equal(out.state.status,'active');

const broken=createQuestDefinition({id:'broken',name:'Cassée',startConditionIds:['missing'],rewardItemIds:['void'],completionEventId:'ghost',objectives:[{id:'same',conditionIds:['x']},{id:'same'}]});
const check=validateQuestDefinition(broken,definitions); assert.equal(check.valid,false); assert.equal(check.errors.some(e=>e.code==='missing-condition'),true); assert.equal(check.errors.some(e=>e.code==='missing-item'),true); assert.equal(check.errors.some(e=>e.code==='missing-event'),true); assert.equal(check.errors.some(e=>e.code==='duplicate-objective'),true); assert.equal(check.errors.some(e=>e.code==='missing-objective-condition'),true);
console.log('rpg quest engine ok');
