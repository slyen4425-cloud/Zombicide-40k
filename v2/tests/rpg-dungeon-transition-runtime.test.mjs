import assert from 'node:assert/strict';
import { createWorld,createZone,createRoom,createRoomLink,buildWorldIndex } from '../src/modes/rpg/world-engine.js';
import { createDungeonRuntime } from '../src/modes/rpg/room-runtime.js';
import { createAudioState,startAudio } from '../src/modes/rpg/audio-engine.js';
import { transitionDungeonRoomWithAudio } from '../src/modes/rpg/dungeon-transition-runtime.js';

const zone=createZone({id:'z1',name:'Zone',roomIds:['a','b']});
const roomA=createRoom({id:'a',zoneId:'z1',name:'Crypte',metadata:{audio:{leave:'crypt-leave',ambience:'crypt-loop'}}});
const roomB=createRoom({id:'b',zoneId:'z1',name:'Hall',metadata:{audio:{enter:'hall-enter',ambience:'hall-loop'}}});
const link=createRoomLink({id:'ab',fromRoomId:'a',toRoomId:'b'});
const world=createWorld({id:'w1',name:'Test',startRoomId:'a',zones:['z1']});
const index=buildWorldIndex({world,zones:[zone],rooms:[roomA,roomB],links:[link]});

const definitions={audio:[
  {id:'crypt-loop',name:'Crypte',src:'crypt.ogg',channel:'ambience',loop:true,probability:100},
  {id:'crypt-leave',name:'Sortie',src:'leave.ogg',channel:'sfx',probability:100},
  {id:'hall-enter',name:'Entrée',src:'enter.ogg',channel:'sfx',probability:100},
  {id:'hall-loop',name:'Hall',src:'hall.ogg',channel:'ambience',loop:true,probability:100},
]};
const started=createDungeonRuntime(index);
assert.equal(started.ok,true);
let audioState=createAudioState();
const running=startAudio(audioState,{id:'old-ambience',audioId:'crypt-loop',src:'crypt.ogg',channel:'ambience',loop:true,volume:1,delayMs:0});
assert.equal(running.ok,true);
audioState=running.state;

const moved=transitionDungeonRoomWithAudio({
  worldIndex:index,
  runtime:started.runtime,
  linkId:'ab',
  audioState,
  audioDefinitions:definitions,
  audioOptions:{random:()=>0},
});
assert.equal(moved.ok,true);
assert.equal(moved.runtime.currentRoomId,'b');
assert.equal(moved.fromRoomId,'a');
assert.equal(moved.toRoomId,'b');
assert.equal(Object.values(moved.audioState.playing).some(x=>x.channel==='ambience'),false);
assert.deepEqual(moved.audio.queued.map(x=>x.phase),['leave','enter','ambience']);
assert.equal(moved.audio.queued[2].audioId,'hall-loop');

const refused=transitionDungeonRoomWithAudio({
  worldIndex:index,
  runtime:moved.runtime,
  linkId:'missing-link',
  audioState:moved.audioState,
  audioDefinitions:definitions,
  audioOptions:{random:()=>0},
});
assert.equal(refused.ok,false);
assert.equal(refused.reason,'link-unavailable');
assert.equal(refused.audioState,moved.audioState,'failed room transition must not mutate audio state');

console.log('rpg-dungeon-transition-runtime.test.mjs: ok');
