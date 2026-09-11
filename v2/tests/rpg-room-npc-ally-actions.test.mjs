import assert from 'node:assert/strict';
import { createRoomInteraction } from '../src/modes/rpg/interaction-engine.js';
import { createRoomInstance } from '../src/modes/rpg/room-runtime.js';
import { createAllyDefinition, createAllyRoster } from '../src/modes/rpg/ally-engine.js';
import { createAllyInteractionDefinition } from '../src/modes/rpg/ally-gameplay.js';
import { buildRoomNpcInteractionView, applyRoomNpcAllyAction } from '../src/modes/rpg/room-npc-interaction-ui.js';

const ally=createAllyDefinition({id:'rurik',name:'Rurik',kind:'mercenary'});
const gameplay=createAllyInteractionDefinition({
  id:'rurik-talk',allyDefinitionId:'rurik',
  dialogue:[{id:'hello',speaker:'Rurik',text:'50 pièces et je viens.'}],
  recruitment:{enabled:true,currencyId:'gold',cost:50},
});
const interaction=createRoomInteraction({id:'rurik-npc',kind:'npc',name:'Rurik',attachment:{kind:'cell',x:1,y:1},data:{allyInteractionId:'rurik-talk'}});
const layout={id:'layout',roomId:'tavern',width:3,height:3,doors:[],interactions:[interaction],metadata:{entities:[]}};
const room=createRoomInstance('tavern',layout);
let roomRuntime={currentRoomId:'tavern',rooms:{tavern:room},sequence:0,log:[]};
let roster=createAllyRoster();
let wallet={gold:80};
const definitions={allies:[ally],allyInteractions:[gameplay],stats:[],resources:[],skills:[]};

let built=buildRoomNpcInteractionView({roomRuntime,roomId:'tavern',roomInteraction:interaction,definitions,quests:[]});
assert.equal(built.ok,true);
const recruit=built.view.actions.find(action=>action.kind==='recruit-ally');
assert.ok(recruit,'recruit action must be exposed by the real room NPC UI');
assert.equal(recruit.label,'Recruter · 50 gold');

let out=applyRoomNpcAllyAction(roomRuntime,'tavern',interaction,recruit,{roster,wallet,definitions,ownerActorId:'aldren',x:1,y:1});
assert.equal(out.ok,true);
roomRuntime=out.roomRuntime; roster=out.roster; wallet=out.wallet;
assert.equal(wallet.gold,30);
assert.equal(roster.order.length,1);
assert.equal(roomRuntime.rooms.tavern.interactions['rurik-npc'].data.recruited,true);

built=buildRoomNpcInteractionView({roomRuntime,roomId:'tavern',roomInteraction:interaction,definitions,quests:[]});
assert.equal(built.view.actions.some(action=>action.kind==='recruit-ally'),false,'recruit must disappear once already recruited');
const dismiss=built.view.actions.find(action=>action.kind==='dismiss-ally');
assert.ok(dismiss,'dismiss action must appear for the recruited ally');

out=applyRoomNpcAllyAction(roomRuntime,'tavern',interaction,dismiss,{roster,wallet,definitions});
assert.equal(out.ok,true);
roomRuntime=out.roomRuntime; roster=out.roster;
assert.equal(roster.actors[dismiss.instanceId].dismissed,true);
assert.equal(roomRuntime.rooms.tavern.interactions['rurik-npc'].data.dismissed,true);

const summonGameplay=createAllyInteractionDefinition({
  id:'spirit-talk',allyDefinitionId:'rurik',
  summon:{enabled:true,sourceKind:'manual'},
});
const summonInteraction=createRoomInteraction({id:'spirit-npc',kind:'ally',name:'Esprit',attachment:{kind:'cell',x:0,y:0},data:{allyInteractionId:'spirit-talk'}});
const summonRoom=createRoomInstance('shrine',{id:'shrine-layout',roomId:'shrine',width:2,height:2,doors:[],interactions:[summonInteraction],metadata:{entities:[]}});
let summonRuntime={currentRoomId:'shrine',rooms:{shrine:summonRoom},sequence:0,log:[]};
let summonRoster=createAllyRoster();
const summonDefinitions={...definitions,allyInteractions:[gameplay,summonGameplay]};
built=buildRoomNpcInteractionView({roomRuntime:summonRuntime,roomId:'shrine',roomInteraction:summonInteraction,definitions:summonDefinitions,quests:[]});
const summon=built.view.actions.find(action=>action.kind==='summon-ally');
assert.ok(summon,'summon action must be exposed');
out=applyRoomNpcAllyAction(summonRuntime,'shrine',summonInteraction,summon,{roster:summonRoster,definitions:summonDefinitions});
assert.equal(out.ok,true);
assert.equal(out.roster.order.length,1);
assert.equal(out.roomRuntime.rooms.shrine.interactions['spirit-npc'].data.summoned,true);

console.log('rpg-room-npc-ally-actions.test.mjs: OK');
