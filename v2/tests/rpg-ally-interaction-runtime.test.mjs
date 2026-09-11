import assert from 'node:assert/strict';
import { createRoomLayout } from '../src/modes/rpg/room-engine.js';
import { createRoomInteraction } from '../src/modes/rpg/interaction-engine.js';
import { createRoomInstance } from '../src/modes/rpg/room-runtime.js';
import { createAllyDefinition, createAllyRoster } from '../src/modes/rpg/ally-engine.js';
import { createAllyInteractionDefinition } from '../src/modes/rpg/ally-gameplay.js';
import { inspectAllyRoomInteraction, recruitFromRoomInteraction } from '../src/modes/rpg/ally-interaction-runtime.js';

const mercenary=createAllyDefinition({id:'rurik',name:'Rurik',kind:'mercenary',sourceKind:'custom',controlMode:'player'});
const gameplay=createAllyInteractionDefinition({
  id:'rurik-talk',allyDefinitionId:'rurik',
  dialogue:[{id:'hello',speaker:'Rurik',text:'50 pièces et je viens.'}],
  recruitment:{enabled:true,currencyId:'gold',cost:50},
});

const interaction=createRoomInteraction({
  id:'rurik-npc',kind:'npc',name:'Rurik',attachment:{kind:'cell',x:1,y:1},data:{allyInteractionId:'rurik-talk'},
});
const layout=createRoomLayout({id:'room-layout',roomId:'tavern',width:4,height:4});
layout.interactions=[interaction];
const room=createRoomInstance('tavern',layout);
let roomRuntime={currentRoomId:'tavern',rooms:{tavern:room},sequence:0,log:[]};
let roster=createAllyRoster();
let wallet={gold:80};
const definitions={allies:[mercenary],allyInteractions:[gameplay],stats:[],resources:[],skills:[]};

const before=inspectAllyRoomInteraction({roomRuntime,roomId:'tavern',roomInteraction:interaction,definitions});
assert.equal(before.ok,true);
assert.equal(before.dialogue[0].text,'50 pièces et je viens.');
assert.equal(before.recruited,false);

const recruited=recruitFromRoomInteraction({
  roomRuntime,roomId:'tavern',roomInteraction:interaction,roster,wallet,definitions,ownerActorId:'aldren',x:1,y:1,
});
assert.equal(recruited.ok,true);
assert.equal(recruited.wallet.gold,30);
assert.equal(recruited.runtime.name,'Rurik');
roomRuntime=recruited.roomRuntime; roster=recruited.roster; wallet=recruited.wallet;

const persisted=inspectAllyRoomInteraction({roomRuntime,roomId:'tavern',roomInteraction:interaction,definitions});
assert.equal(persisted.recruited,true);
assert.equal(persisted.instanceId,recruited.runtime.instanceId);

const second=recruitFromRoomInteraction({roomRuntime,roomId:'tavern',roomInteraction:interaction,roster,wallet,definitions,ownerActorId:'aldren'});
assert.equal(second.ok,false);
assert.equal(second.reason,'already-recruited');
assert.equal(wallet.gold,30);

const clonedRuntime=structuredClone(roomRuntime);
const afterReturn=inspectAllyRoomInteraction({roomRuntime:clonedRuntime,roomId:'tavern',roomInteraction:interaction,definitions});
assert.equal(afterReturn.recruited,true);
assert.equal(afterReturn.instanceId,recruited.runtime.instanceId);

console.log('rpg ally interaction runtime ok');
