import assert from 'node:assert/strict';
import { createQuestDefinition } from '../src/modes/rpg/quest-engine.js';
import { createQuestRuntime, startQuestRuntime, questRuntimeSnapshot } from '../src/modes/rpg/quest-runtime.js';
import { questSignalsForRoomVisit, questSignalsForInteraction, applyRoomVisitToQuests, applyInteractionResultToQuests } from '../src/modes/rpg/room-quest-bridge.js';

const quest=createQuestDefinition({
  id:'village-help',name:'Aide au village',objectives:[
    {id:'visit-inn',kind:'visit',targetId:'inn',required:1},
    {id:'talk-mayor',kind:'npc',targetId:'mayor',required:1},
    {id:'use-lever',kind:'switch',targetId:'lever-a',required:1},
    {id:'generic-interact',kind:'interact',targetId:'lever-a',required:1,optional:true},
    {id:'custom-flag',kind:'flag',targetId:'secret-open',required:1,optional:true},
  ]
});
let runtime=createQuestRuntime([quest]);
runtime=startQuestRuntime(runtime,quest,{now:'t0'}).runtime;

assert.deepEqual(questSignalsForRoomVisit('inn'),[{kind:'visit',targetId:'inn',amount:1}]);
let out=applyRoomVisitToQuests(runtime,[quest],'inn',{now:'t1'});
runtime=out.runtime;
assert.equal(out.updates.length,1);
assert.equal(questRuntimeSnapshot(runtime,'village-help').progress['visit-inn'],1);

const mayor={id:'mayor',kind:'npc',data:{}};
assert.equal(questSignalsForInteraction(mayor,{success:false}).length,0,'failed interactions must not progress quests');
out=applyInteractionResultToQuests(runtime,[quest],mayor,{success:false},{now:'t2'});
assert.equal(out.updates.length,0);

out=applyInteractionResultToQuests(runtime,[quest],mayor,{success:true},{now:'t3'});
runtime=out.runtime;
assert.equal(questRuntimeSnapshot(runtime,'village-help').progress['talk-mayor'],1);

const lever={id:'lever-a',kind:'switch',data:{questSignals:[{kind:'flag',targetId:'secret-open'}]}};
const signals=questSignalsForInteraction(lever,{success:true});
assert.equal(signals.some(s=>s.kind==='switch'&&s.targetId==='lever-a'),true);
assert.equal(signals.some(s=>s.kind==='interact'&&s.targetId==='lever-a'),true);
assert.equal(signals.some(s=>s.kind==='flag'&&s.targetId==='secret-open'),true);
out=applyInteractionResultToQuests(runtime,[quest],lever,{success:true},{now:'t4'});
runtime=out.runtime;
const state=questRuntimeSnapshot(runtime,'village-help');
assert.equal(state.progress['use-lever'],1);
assert.equal(state.progress['generic-interact'],1);
assert.equal(state.progress['custom-flag'],1);

console.log('rpg-room-quest-bridge.test.mjs: OK');
