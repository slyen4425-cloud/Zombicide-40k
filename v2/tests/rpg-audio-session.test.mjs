import assert from 'node:assert/strict';
import { createAudioState } from '../src/modes/rpg/audio-engine.js';
import { createRpgAudioSession } from '../src/modes/rpg/rpg-audio-session.js';

const calls=[];
const output={
  play(request){calls.push(['play',request.id,request.channel]);return {ok:true,requestId:request.id};},
  stop(requestId){calls.push(['stop',String(requestId)]);return {ok:true,requestId:String(requestId)};},
  dispose(){calls.push(['dispose']);return {ok:true,stopped:['amb-1']};},
};

const session=createRpgAudioSession({state:createAudioState(),output});
let out=session.commit({queued:[{request:{id:'sfx-1',audioId:'hit',src:'hit.ogg',channel:'sfx',volume:1}}]});
assert.equal(out.ok,true);
assert.deepEqual(out.started.map(x=>x.requestId),['sfx-1']);
assert.equal(session.snapshot().playing['sfx-1'].audioId,'hit');

out=session.commitRoomTransition({
  state:createAudioState(),
  stoppedAmbience:[{requestId:'amb-1',audioId:'crypt-loop'}],
  queued:[{phase:'ambience',request:{id:'amb-2',audioId:'hall-loop',src:'hall.ogg',channel:'ambience',loop:true,volume:0.5}}],
});
assert.equal(out.ok,true);
assert.equal(calls.some(x=>x[0]==='stop'&&x[1]==='amb-1'),true);
assert.equal(calls.some(x=>x[0]==='play'&&x[1]==='amb-2'),true);
assert.equal(session.snapshot().playing['amb-2'].audioId,'hall-loop');

const disposed=session.dispose();
assert.equal(disposed.ok,true);
assert.equal(session.isDisposed(),true);
assert.deepEqual(disposed.stopped,['amb-1']);

const refused=session.commit({queued:[{request:{id:'late',audioId:'late',src:'late.ogg',channel:'sfx'}}]});
assert.equal(refused.ok,false);
assert.equal(refused.reason,'session-disposed');
assert.equal(calls.some(x=>x[1]==='late'),false);

console.log('rpg-audio-session.test.mjs: ok');
