import assert from 'node:assert/strict';
import { createAudioState, startAudio } from '../src/modes/rpg/audio-engine.js';
import { queueRoomTransitionAudio } from '../src/modes/rpg/audio-runtime.js';
import { commitRoomTransitionAudioToOutput } from '../src/modes/rpg/audio-output-runtime.js';

const definitions={audio:[
  {id:'crypt-loop',name:'Crypte',src:'crypt.ogg',channel:'ambience',loop:true,probability:100},
  {id:'crypt-leave',name:'Sortie crypte',src:'crypt-leave.ogg',channel:'sfx',probability:100},
  {id:'hall-enter',name:'Entrée hall',src:'hall-enter.ogg',channel:'sfx',probability:100},
  {id:'hall-loop',name:'Hall',src:'hall.ogg',channel:'ambience',loop:true,probability:100},
]};
const options={random:()=>0};
let state=createAudioState();
const oldRequest={id:'old-ambience',audioId:'crypt-loop',src:'crypt.ogg',channel:'ambience',loop:true,volume:1,delayMs:0};
state=startAudio(state,oldRequest).state;

const transition=queueRoomTransitionAudio({
  state,
  fromRoom:{id:'crypt',audioBindings:{leave:'crypt-leave'}},
  toRoom:{id:'hall',audioBindings:{enter:'hall-enter',ambience:'hall-loop'}},
  definitions,
  options,
});

const calls={play:[],stop:[]};
const output={
  play(request){calls.play.push(structuredClone(request));return {ok:true,requestId:request.id};},
  stop(requestId){calls.stop.push(String(requestId));return {ok:true,requestId:String(requestId)};},
};
const committed=commitRoomTransitionAudioToOutput({transitionAudio:transition,output});
assert.equal(committed.ok,true);
assert.deepEqual(calls.stop,['old-ambience']);
assert.deepEqual(calls.play.map(x=>x.audioId),['crypt-leave','hall-enter','hall-loop']);
assert.equal(Object.values(committed.state.playing).some(x=>x.audioId==='crypt-loop'),false);
assert.equal(Object.values(committed.state.playing).some(x=>x.audioId==='hall-loop'),true);
assert.equal(committed.started.length,3);

const muted=createAudioState({muted:true});
const mutedTransition=queueRoomTransitionAudio({
  state:muted,
  toRoom:{id:'hall',audioBindings:{enter:'hall-enter',ambience:'hall-loop'}},
  definitions,
  options,
});
const mutedCalls=[];
const mutedResult=commitRoomTransitionAudioToOutput({transitionAudio:mutedTransition,output:{play:r=>{mutedCalls.push(r);return {ok:true};},stop:()=>({ok:true})}});
assert.equal(mutedResult.ok,true);
assert.equal(mutedCalls.length,0,'muted engine state must not start browser playback');

console.log('rpg-audio-output-runtime.test.mjs: ok');
