import assert from 'node:assert/strict';
import { createQuestDefinition } from '../src/modes/rpg/quest-engine.js';
import { createQuestRuntime, startQuestRuntime, questRuntimeSnapshot } from '../src/modes/rpg/quest-runtime.js';
import { normalizeNpcQuestActions, buildNpcInteractionView, renderNpcInteractionView, applyNpcQuestAction } from '../src/modes/rpg/npc-interaction-ui.js';

const escort=createQuestDefinition({id:'escort-rurik',name:'Escorter Rurik',objectives:[{id:'reach-gate',kind:'visit',targetId:'gate',required:1}]});
const talk=createQuestDefinition({id:'talk-elder',name:'Le conseil de l’ancien',objectives:[{id:'elder-step',kind:'npc',targetId:'elder',required:1}]});
const quests=[escort,talk];
const interaction={
  id:'elder',kind:'npc',name:'Ancien',data:{icon:'🧙',portrait:'assets/elder.png',questActions:[
    {id:'accept-escort',kind:'start-quest',label:'Accepter la mission',questId:'escort-rurik'},
    {id:'advance-talk',kind:'signal',label:'Parler de la crypte',signal:{kind:'npc',targetId:'elder',amount:1}},
    {id:'secret',kind:'signal',label:'Option secrète',signal:{kind:'flag',targetId:'secret'},conditionIds:['secret-visible']},
    {id:'broken',kind:'start-quest',label:'Cassée',questId:'missing'},
  ]}
};
const dialogue=[{speaker:'Ancien',text:'La crypte est de nouveau ouverte.'},{speaker:'Lyra',text:'Nous irons voir.'}];

let actions=normalizeNpcQuestActions(interaction,quests,id=>id==='secret-visible');
assert.deepEqual(actions.map(a=>a.id),['accept-escort','advance-talk','secret']);
actions=normalizeNpcQuestActions(interaction,quests,()=>false);
assert.deepEqual(actions.map(a=>a.id),['accept-escort','advance-talk']);

const view=buildNpcInteractionView({interaction,dialogue,quests,conditionEvaluator:()=>false});
assert.equal(view.name,'Ancien');
assert.equal(view.portrait,'assets/elder.png');
assert.equal(view.dialogue.length,2);
assert.equal(view.actions.length,2);
const html=renderNpcInteractionView(view);
assert.match(html,/Ancien/);
assert.match(html,/La crypte est de nouveau ouverte/);
assert.match(html,/Accepter la mission/);
assert.match(html,/Parler de la crypte/);
assert.doesNotMatch(html,/escort-rurik/,'technical quest ids must not be exposed');
assert.doesNotMatch(html,/missing/);

let runtime=createQuestRuntime(quests);
let out=applyNpcQuestAction(runtime,quests,view.actions.find(a=>a.id==='accept-escort'),{now:'t0'});
assert.equal(out.ok,true);
runtime=out.runtime;
assert.equal(questRuntimeSnapshot(runtime,'escort-rurik').status,'active');

runtime=startQuestRuntime(runtime,talk,{now:'t1'}).runtime;
out=applyNpcQuestAction(runtime,quests,view.actions.find(a=>a.id==='advance-talk'),{now:'t2'});
assert.equal(out.ok,true);
runtime=out.runtime;
assert.equal(questRuntimeSnapshot(runtime,'talk-elder').progress['elder-step'],1);

out=applyNpcQuestAction(runtime,quests,{kind:'start-quest',questId:'missing'});
assert.equal(out.ok,false);
assert.equal(out.reason,'quest-missing');

console.log('rpg-npc-interaction-ui.test.mjs: OK');
