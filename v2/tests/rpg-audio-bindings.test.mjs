import assert from 'node:assert/strict';
import { createAudioState } from '../src/modes/rpg/audio-engine.js';
import { queueBoundAudio, queueResultAudio, resolveBoundAudioId, audioBindingSnapshot } from '../src/modes/rpg/audio-bindings.js';
import { createChestDefinition, createChestState, openChest } from '../src/modes/rpg/chest-engine.js';

const definitions={audio:[
  {id:'bow-shot',name:'Tir arc',src:'audio/bow-shot.ogg',channel:'combat'},
  {id:'chest-open',name:'Coffre',src:'audio/chest-open.ogg',channel:'sfx'},
  {id:'summon-wolf',name:'Invocation',src:'audio/summon-wolf.ogg',channel:'combat'},
  {id:'door-open',name:'Porte',src:'audio/door-open.ogg',channel:'sfx'},
]};

let audio=createAudioState();
const bow={id:'bow',audioId:'bow-shot',data:{attackStyle:'ranged'}};
assert.equal(resolveBoundAudioId(bow,'attack'),'bow-shot');
let queued=queueBoundAudio({state:audio,source:bow,cue:'attack',definitions,options:{random:()=>0}});
assert.equal(queued.ok,true);
assert.equal(queued.request.audioId,'bow-shot');
assert.equal(queued.request.metadata.cue,'attack');
audio=queued.state;

const summon={id:'wolf-summon',audioBindings:{spawn:'summon-wolf'},audioId:'bow-shot'};
assert.equal(resolveBoundAudioId(summon,'spawn'),'summon-wolf');
queued=queueBoundAudio({state:audio,source:summon,cue:'spawn',definitions,options:{random:()=>0}});
assert.equal(queued.ok,true);
assert.equal(queued.request.audioId,'summon-wolf');
audio=queued.state;

const door={id:'crypt-door',data:{audio:{open:'door-open'}}};
assert.equal(resolveBoundAudioId(door,'open'),'door-open');
const snapshot=audioBindingSnapshot(door);
assert.equal(snapshot.cues.open,'door-open');

const chest=createChestDefinition({id:'chest-1',audioId:'chest-open',loot:[{itemId:'coin',quantity:1}]});
const opened=openChest(chest,createChestState(chest),{inventory:{}});
assert.equal(opened.ok,true);
assert.equal(opened.result.audioId,'chest-open');
queued=queueResultAudio({state:audio,result:opened.result,cue:'open',definitions,options:{random:()=>0}});
assert.equal(queued.ok,true);
assert.equal(queued.request.audioId,'chest-open');
audio=queued.state;

assert.equal(audio.history.filter(x=>x.type==='queued').length,3);
const missing=queueBoundAudio({state:audio,source:{id:'silent'},cue:'use',definitions});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'audio-unbound');

console.log('rpg-audio-bindings.test.mjs: ok');
