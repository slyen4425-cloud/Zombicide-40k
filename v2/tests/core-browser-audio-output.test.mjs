import assert from 'node:assert/strict';
import { createBrowserAudioOutput } from '../src/core/browser-audio-output.js';

const created=[];
const audioFactory=src=>{
  const audio={src,loop:false,volume:1,currentTime:12,played:0,paused:0,play(){this.played+=1;return Promise.resolve();},pause(){this.paused+=1;}};
  created.push(audio);
  return audio;
};
let scheduled=null;
const output=createBrowserAudioOutput({audioFactory,setTimeoutFn:(fn,ms)=>{scheduled={fn,ms};return 77;},clearTimeoutFn:id=>{if(scheduled&&id===77) scheduled=null;}});

let out=output.play({id:'amb-1',src:'crypt.ogg',channel:'ambience',loop:true,volume:0.8,effectiveVolume:0.4});
assert.equal(out.ok,true);
assert.equal(created[0].played,1);
assert.equal(created[0].loop,true);
assert.equal(created[0].volume,0.4);
assert.equal(output.activeRequests().length,1);

out=output.play({id:'hit-1',src:'hit.ogg',channel:'combat',delayMs:250,volume:1});
assert.equal(out.ok,true);
assert.equal(created[1].played,0);
assert.equal(scheduled.ms,250);
scheduled.fn();
assert.equal(created[1].played,1);

const stoppedAmbience=output.stopChannel('ambience');
assert.deepEqual(stoppedAmbience.stopped,['amb-1']);
assert.equal(created[0].paused,1);
assert.equal(created[0].currentTime,0);
assert.equal(output.activeRequests().length,1);

const stoppedHit=output.stop('hit-1');
assert.equal(stoppedHit.ok,true);
assert.equal(created[1].paused,1);
assert.equal(output.activeRequests().length,0);
assert.equal(output.stop('missing').reason,'not-active');
assert.equal(output.play({id:'bad'}).reason,'invalid-request');

output.play({id:'a',src:'a.ogg',channel:'sfx'});
output.play({id:'b',src:'b.ogg',channel:'music'});
const disposed=output.dispose();
assert.equal(disposed.stopped.length,2);
assert.equal(output.activeRequests().length,0);

console.log('core-browser-audio-output.test.mjs: ok');
