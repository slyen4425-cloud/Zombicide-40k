import assert from 'node:assert/strict';
import { createEventDefinition } from '../src/modes/rpg/event-engine.js';
import { createEventQueueRuntime, enqueueEventRequest } from '../src/modes/rpg/event-queue-runtime.js';
import { drainRoomRuntimeEvents, resolveRoomRuntimeEventChoice } from '../src/modes/rpg/room-event-runtime.js';

const immediate=createEventDefinition({id:'immediate',actions:[{kind:'flag',flagId:'immediate_done',value:true}]});
const choice=createEventDefinition({id:'choice',actions:[{kind:'choice',id:'pick',choices:[
  {id:'yes',label:'Oui',actions:[{kind:'flag',flagId:'choice_yes',value:true}]},
  {id:'no',label:'Non',actions:[{kind:'flag',flagId:'choice_no',value:true}]},
]}]});
const after=createEventDefinition({id:'after',actions:[{kind:'reward',itemId:'coin',quantity:3}]});
const definitions={events:[immediate,choice,after]};

let queue=createEventQueueRuntime();
queue=enqueueEventRequest(queue,'immediate').queue;
queue=enqueueEventRequest(queue,'choice').queue;
queue=enqueueEventRequest(queue,'after').queue;
let roomRuntime={currentRoomId:'camp',eventQueue:queue};

let out=drainRoomRuntimeEvents(roomRuntime,definitions,{world:{flags:{},inventory:{}}});
assert.equal(out.ok,true);
assert.equal(out.reason,'waiting-choice');
assert.equal(out.world.flags.immediate_done,true,'immediate event must execute automatically');
assert.equal(out.roomRuntime.eventQueue.pending.length,1,'events after a blocking choice must stay queued');
assert.equal(out.roomRuntime.eventQueue.pending[0].eventId,'after');
assert.equal(out.roomRuntime.eventOrchestrator.active?.request?.eventId,'choice');
assert.equal(out.processed.length,2,'drain should process events until the blocking choice');

roomRuntime=out.roomRuntime;
out=drainRoomRuntimeEvents(roomRuntime,definitions,{world:out.world});
assert.equal(out.reason,'event-active','re-draining while waiting must not duplicate the active event');
assert.equal(out.roomRuntime.eventQueue.pending.length,1);
assert.equal(out.world.flags.immediate_done,true);

out=resolveRoomRuntimeEventChoice(roomRuntime,'yes',definitions,{world:out.world});
assert.equal(out.ok,true);
assert.equal(out.world.flags.choice_yes,true);
assert.equal(out.world.inventory.coin,3,'after resolving the choice the remaining queue must continue automatically');
assert.equal(out.roomRuntime.eventQueue.pending.length,0);
assert.equal(out.roomRuntime.eventOrchestrator.active,null);
assert.equal(out.roomRuntime.eventOrchestrator.completedRequestIds.length,3);

const again=drainRoomRuntimeEvents(out.roomRuntime,definitions,{world:out.world});
assert.equal(again.reason,'drained');
assert.equal(again.world.inventory.coin,3,'completed events must not execute twice');

console.log('rpg-room-event-runtime.test.mjs: OK');
