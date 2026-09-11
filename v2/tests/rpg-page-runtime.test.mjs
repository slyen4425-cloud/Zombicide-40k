import assert from 'node:assert/strict';
import { createRpgPageRuntime } from '../src/modes/rpg/rpg-page.js';

const played=[]; const stopped=[];
const output={
  play(request){played.push(request.id);return {ok:true,requestId:request.id};},
  stop(requestId){stopped.push(requestId);return {ok:true,requestId};},
  dispose(){stopped.push('dispose');return {ok:true,stopped:['all']};},
};

const runtime=createRpgPageRuntime({audioOutput:output});
assert.equal(runtime.isDisposed(),false);
const commit=runtime.audioSession.commit({queued:[{id:'cue-1',audioId:'room-enter',src:'enter.ogg',channel:'sfx',volume:1}]});
assert.equal(commit.ok,true);
assert.deepEqual(played,['cue-1']);
const disposed=runtime.dispose();
assert.equal(disposed.ok,true);
assert.equal(runtime.isDisposed(),true);
assert.deepEqual(stopped,['dispose']);
const again=runtime.dispose();
assert.equal(again.ok,true);
assert.equal(again.alreadyDisposed,true);
const refused=runtime.audioSession.commit({queued:[{id:'cue-2',audioId:'late',src:'late.ogg'}]});
assert.equal(refused.ok,false);
assert.equal(refused.reason,'session-disposed');
assert.deepEqual(played,['cue-1']);

console.log('rpg-page-runtime.test.mjs: ok');
