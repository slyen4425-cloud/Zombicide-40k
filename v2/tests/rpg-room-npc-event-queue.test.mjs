import assert from 'node:assert/strict';
import { createRoomInteraction } from '../src/modes/rpg/interaction-engine.js';
import { createRoomInstance } from '../src/modes/rpg/room-runtime.js';
import { createAllyDefinition, createAllyRoster } from '../src/modes/rpg/ally-engine.js';
import { createAllyInteractionDefinition } from '../src/modes/rpg/ally-gameplay.js';
import { applyRoomNpcAllyAction } from '../src/modes/rpg/room-npc-interaction-ui.js';
import { peekEventRequest, dequeueEventRequest } from '../src/modes/rpg/event-queue-runtime.js';

const ally=createAllyDefinition({id:'scout',name:'Éclaireur'});
const gameplay=createAllyInteractionDefinition({
  id:'scout-talk',allyDefinitionId:'scout',
  recruitment:{enabled:true,currencyId:'gold',cost:5,successEventId:'recruit-ok',failureEventId:'recruit-fail'},
  summon:{enabled:true,sourceKind:'manual',successEventId:'summon-ok'},
  dismissEventId:'dismiss-ok',
});
const interaction=createRoomInteraction({id:'scout-npc',kind:'npc',name:'Éclaireur',data:{allyInteractionId:'scout-talk'}});
const layout={id:'layout',roomId:'camp',width:1,height:1,doors:[],interactions:[interaction],metadata:{entities:[]}};
const room=createRoomInstance('camp',layout);
let roomRuntime={currentRoomId:'camp',rooms:{camp:room},sequence:0,log:[]};
let roster=createAllyRoster();
const definitions={allies:[ally],allyInteractions:[gameplay]};

let out=applyRoomNpcAllyAction(roomRuntime,'camp',interaction,{kind:'recruit-ally'},{roster,wallet:{gold:0},definitions});
assert.equal(out.ok,false);
assert.equal(out.reason,'not-enough-currency');
assert.equal(out.eventQueued,true,'failure event must still be queued');
roomRuntime=out.roomRuntime;
assert.equal(peekEventRequest(roomRuntime.eventQueue).eventId,'recruit-fail');
assert.equal(peekEventRequest(roomRuntime.eventQueue).metadata.outcome,'failure');

out=applyRoomNpcAllyAction(roomRuntime,'camp',interaction,{kind:'recruit-ally'},{roster,wallet:{gold:10},definitions});
assert.equal(out.ok,true);
assert.equal(out.eventQueued,true);
roomRuntime=out.roomRuntime;
roster=out.roster;
assert.equal(roomRuntime.eventQueue.pending[1].eventId,'recruit-ok');
assert.equal(roomRuntime.eventQueue.pending[1].metadata.outcome,'success');
const instanceId=out.runtime.instanceId;

out=applyRoomNpcAllyAction(roomRuntime,'camp',interaction,{kind:'dismiss-ally',instanceId},{roster,definitions});
assert.equal(out.ok,true);
assert.equal(out.eventQueued,true);
roomRuntime=out.roomRuntime;
assert.equal(roomRuntime.eventQueue.pending[2].eventId,'dismiss-ok');
assert.equal(roomRuntime.eventQueue.pending[2].metadata.actionKind,'dismiss-ally');

let dequeued=dequeueEventRequest(roomRuntime.eventQueue);
assert.equal(dequeued.ok,true);
assert.equal(dequeued.request.eventId,'recruit-fail');
assert.equal(dequeued.queue.pending[0].eventId,'recruit-ok','queue order must stay FIFO');

console.log('rpg-room-npc-event-queue.test.mjs: OK');
