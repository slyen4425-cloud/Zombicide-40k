import assert from 'node:assert/strict';
import { createAudioState } from '../src/modes/rpg/audio-engine.js';
import { queueSkillAudio,queueTrapAudio,queueCreatureAudio,queueHeroFormAudio,queueRoomAudio,queueCombatAudio } from '../src/modes/rpg/audio-runtime.js';

const definitions={audio:[
 {id:'bow-cast',name:'Arc',src:'bow.ogg',channel:'combat',probability:100},
 {id:'trap-click',name:'Piège',src:'trap.ogg',channel:'sfx',probability:100},
 {id:'wolf-spawn',name:'Loup',src:'wolf.ogg',channel:'combat',probability:100},
 {id:'form-on',name:'Forme',src:'form.ogg',channel:'sfx',probability:100},
 {id:'crypt-loop',name:'Crypte',src:'crypt.ogg',channel:'ambience',loop:true,probability:100},
 {id:'battle-win',name:'Victoire',src:'win.ogg',channel:'music',probability:100},
]};
let state=createAudioState();
const options={random:()=>0};

let out=queueSkillAudio({state,skill:{id:'shoot',audioBindings:{cast:'bow-cast'}},phase:'cast',definitions,options});
assert.equal(out.ok,true); assert.equal(out.audioId,'bow-cast'); state=out.state;

out=queueTrapAudio({state,trap:{id:'spikes',audioId:'trap-click'},result:{audioId:'trap-click'},phase:'trigger',definitions,options});
assert.equal(out.ok,true); assert.equal(out.request.channel,'sfx'); state=out.state;

out=queueCreatureAudio({state,creature:{id:'wolf',audioBindings:{spawn:'wolf-spawn'}},phase:'spawn',definitions,options});
assert.equal(out.ok,true); assert.equal(out.audioId,'wolf-spawn'); state=out.state;

out=queueHeroFormAudio({state,form:{id:'rage',audioBindings:{activate:'form-on'}},phase:'activate',definitions,options});
assert.equal(out.ok,true); state=out.state;

out=queueRoomAudio({state,room:{id:'crypt',metadata:{audio:{ambience:'crypt-loop'}}},phase:'ambience',definitions,options});
assert.equal(out.ok,true); assert.equal(out.request.loop,true); state=out.state;

out=queueCombatAudio({state,source:{audioBindings:{victory:'battle-win'}},phase:'victory',definitions,options});
assert.equal(out.ok,true); assert.equal(out.request.channel,'music'); state=out.state;

assert.equal(state.history.length,6);
const missing=queueCreatureAudio({state,creature:{id:'silent'},phase:'death',definitions,options});
assert.equal(missing.ok,false); assert.equal(missing.reason,'audio-unbound');
console.log('rpg-audio-runtime.test.mjs: ok');
