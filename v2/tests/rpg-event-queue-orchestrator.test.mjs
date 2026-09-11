import assert from 'node:assert/strict';
import { createEventDefinition } from '../src/modes/rpg/event-engine.js';
import { createEventQueueRuntime, enqueueEventRequest } from '../src/modes/rpg/event-queue-runtime.js';
import { createEventQueueOrchestrator, startNextQueuedEvent, resolveActiveEventChoice } from '../src/modes/rpg/event-queue-orchestrator.js';

const first=createEventDefinition({
  id:'first-event',name:'Premier',once:true,
  actions:[{kind:'flag',flagId:'first_done',value:true}],
});
const choice=createEventDefinition({
  id:'choice-event',name:'Choix',actions:[{
    kind:'choice',id:'decision',choices:[
      {id:'yes',label:'Oui',actions:[{kind:'reward',itemId:'coin',quantity:2}]},
      {id:'no',label:'Non',actions:[{kind:'flag',flagId:'declined',value:true}]},
    ],
  }],
});
const definitions={events:[first,choice]};

let queue=createEventQueueRuntime();
queue=enqueueEventRequest(queue,'first-event',{source:'npc',sourceId:'guide'}).queue;
queue=enqueueEventRequest(queue,'choice-event',{source:'npc',sourceId:'guide'}).queue;
queue=enqueueEventRequest(queue,'first-event',{source:'npc',sourceId:'guide'}).queue;
queue=enqueueEventRequest(queue,'missing-event',{source:'npc',sourceId:'guide'}).queue;

let runtime=createEventQueueOrchestrator({queue});
let world={flags:{},inventory:{}};

let out=startNextQueuedEvent(runtime,definitions,{world});
assert.equal(out.ok,true);
runtime=out.runtime; world=out.world;
assert.equal(world.flags.first_done,true);
assert.equal(runtime.active,null);
assert.deepEqual(runtime.completedOnceEventIds,['first-event']);
assert.equal(runtime.completedRequestIds.length,1);

out=startNextQueuedEvent(runtime,definitions,{world});
assert.equal(out.ok,true);
runtime=out.runtime; world=out.world;
assert.equal(out.eventState.status,'waiting-choice');
assert.equal(runtime.active?.request?.eventId,'choice-event');

const blocked=startNextQueuedEvent(runtime,definitions,{world});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'event-active','must not start another queued event while one waits for a choice');

out=resolveActiveEventChoice(runtime,'yes',definitions,{world});
assert.equal(out.ok,true);
runtime=out.runtime; world=out.world;
assert.equal(world.inventory.coin,2);
assert.equal(runtime.active,null);
assert.equal(runtime.completedRequestIds.length,2);

out=startNextQueuedEvent(runtime,definitions,{world});
assert.equal(out.ok,false);
assert.equal(out.reason,'once-event-already-completed');
runtime=out.runtime;
assert.equal(runtime.completedRequestIds.length,3,'skipped once-event request must still be consumed exactly once');
assert.equal(world.flags.first_done,true);

out=startNextQueuedEvent(runtime,definitions,{world});
assert.equal(out.ok,false);
assert.equal(out.reason,'event-missing');
runtime=out.runtime;
assert.equal(runtime.completedRequestIds.length,4);
assert.equal(runtime.queue.pending.length,0);

const empty=startNextQueuedEvent(runtime,definitions,{world});
assert.equal(empty.ok,false);
assert.equal(empty.reason,'queue-empty');

assert.equal(runtime.history.filter(entry=>entry.type==='event-request-completed').length,2);
assert.equal(runtime.history.filter(entry=>entry.type==='event-request-skipped').length,2);

console.log('rpg-event-queue-orchestrator.test.mjs: OK');
