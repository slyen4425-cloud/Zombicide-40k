import assert from 'node:assert/strict';
import { createRoomInteraction } from '../src/modes/rpg/interaction-engine.js';
import { createRoomInstance } from '../src/modes/rpg/room-runtime.js';
import { createAllyDefinition } from '../src/modes/rpg/ally-engine.js';
import { createAllyInteractionDefinition } from '../src/modes/rpg/ally-gameplay.js';
import { createQuestDefinition } from '../src/modes/rpg/quest-engine.js';
import { createQuestRuntime, questRuntimeSnapshot } from '../src/modes/rpg/quest-runtime.js';
import { buildRoomNpcInteractionView, applyRoomNpcQuestAction } from '../src/modes/rpg/room-npc-interaction-ui.js';

const ally=createAllyDefinition({id:'guide',name:'Guide'});
const quest=createQuestDefinition({id:'escort',name:'Escorter le guide',objectives:[{id:'visit',kind:'visit',targetId:'gate',required:1}]});
const gameplay=createAllyInteractionDefinition({
  id:'guide-talk',allyDefinitionId:'guide',escortQuestId:'escort',
  dialogue:[
    {id:'hello',speaker:'Guide',text:'Je peux vous montrer le chemin.'},
    {id:'secret',speaker:'Guide',text:'Le passage est derrière la statue.',conditionIds:['knows-secret']},
  ],
});
const interaction=createRoomInteraction({id:'guide-npc',kind:'npc',name:'Le Guide',attachment:{kind:'cell',x:0,y:0},data:{allyInteractionId:'guide-talk',icon:'🧭'}});
const layout={id:'layout',roomId:'camp',width:1,height:1,doors:[],interactions:[interaction],metadata:{entities:[]}};
const room=createRoomInstance('camp',layout);
let roomRuntime={currentRoomId:'camp',rooms:{camp:room},sequence:0,log:[],questRuntime:createQuestRuntime([quest])};
const definitions={allies:[ally],allyInteractions:[gameplay],quests:[quest]};

let built=buildRoomNpcInteractionView({roomRuntime,roomId:'camp',roomInteraction:interaction,definitions,quests:[quest],conditionEvaluator:()=>false});
assert.equal(built.ok,true);
assert.equal(built.view.name,'Le Guide');
assert.equal(built.dialogue.length,1,'conditional dialogue must use ally interaction runtime filtering');
assert.equal(built.dialogue[0].text,'Je peux vous montrer le chemin.');
assert.equal(built.view.actions.length,1,'escort quest should become a visible quest action');
assert.equal(built.view.actions[0].kind,'start-quest');
assert.equal(built.view.actions[0].label,'Accepter : Escorter le guide');

let out=applyRoomNpcQuestAction(roomRuntime,[quest],built.view.actions[0],{definitions,now:'t0'});
assert.equal(out.ok,true);
roomRuntime=out.roomRuntime;
assert.equal(questRuntimeSnapshot(roomRuntime.questRuntime,'escort').status,'active');

built=buildRoomNpcInteractionView({roomRuntime,roomId:'camp',roomInteraction:interaction,definitions,quests:[quest],conditionEvaluator:id=>id==='knows-secret'});
assert.equal(built.dialogue.length,2,'available dialogue must be refreshed from real ally runtime state/conditions');
assert.equal(built.dialogue[1].text,'Le passage est derrière la statue.');

const invalid=buildRoomNpcInteractionView({roomRuntime,roomId:'camp',roomInteraction:{...interaction,kind:'object'},definitions,quests:[quest]});
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'not-ally-interaction');

console.log('rpg-room-npc-interaction-ui.test.mjs: OK');
