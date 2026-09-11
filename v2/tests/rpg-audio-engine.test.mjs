import assert from 'node:assert/strict';
import { createAudioDefinition,validateAudioDefinition,createAudioState,queueAudio,startAudio,stopAudio } from '../src/modes/rpg/audio-engine.js';
import { createEventDefinition,createEventState,runEvent } from '../src/modes/rpg/event-engine.js';

const door=createAudioDefinition({id:'door-open',name:'Porte ancienne',src:'assets/audio/door-open.ogg',channel:'sfx',volume:0.8});
const ambience=createAudioDefinition({id:'crypt-ambience',name:'Crypte',src:'assets/audio/crypt.ogg',channel:'ambience',loop:true,volume:0.5});
const definitions={audio:[door,ambience]};

assert.equal(validateAudioDefinition(door).valid,true);
assert.equal(validateAudioDefinition(createAudioDefinition({id:'bad',name:'Bad',src:''})).valid,false);

let audioState=createAudioState({channelVolumes:{sfx:0.5,ambience:0.4}});
const queued=queueAudio(audioState,'door-open',definitions,{random:()=>0});
assert.equal(queued.ok,true);
audioState=queued.state;
const started=startAudio(audioState,queued.request);
assert.equal(started.ok,true);
assert.equal(started.playback.effectiveVolume,0.4);
audioState=started.state;
const stopped=stopAudio(audioState,queued.request.id);
assert.equal(stopped.ok,true);
assert.equal(Object.keys(stopped.state.playing).length,0);

const event=createEventDefinition({id:'open-crypt',name:'Ouvrir la crypte',actions:[
  {kind:'text',text:'La pierre gronde.'},
  {kind:'audio',audioId:'door-open'},
  {kind:'audio',audioId:'crypt-ambience',channel:'ambience',loop:true,volume:0.35},
]});
const state=createEventState(event,{roomId:'crypt'});
const result=runEvent(state,{definitions,world:{}});
assert.equal(result.state.status,'completed');
assert.equal(result.state.result.audioRequests.length,2);
assert.deepEqual(result.state.result.audioRequests.map(x=>x.audioId),['door-open','crypt-ambience']);
assert.equal(result.state.result.audioRequests[1].loop,true);
assert.equal(result.state.result.audioRequests[1].volume,0.35);
assert.equal(result.state.log.some(x=>x.type==='event-audio-requested'),true);

const missing=createEventDefinition({id:'missing-audio',actions:[{kind:'audio',audioId:'not-found'}]});
const missingResult=runEvent(createEventState(missing),{definitions,world:{}});
assert.equal(missingResult.state.result.audioRequests.length,0);
assert.equal(missingResult.state.log.some(x=>x.type==='event-action-skipped'&&x.kind==='audio'),true);

console.log('rpg-audio-engine.test.mjs: ok');
