'use strict';
// TDD RED on legacy Capture138 real callback. Only a late change of module
// may prevent Capture UI mutation; normal Capture and Dungeon must be preserved.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const bytes=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes(path.join(__dirname,'..'));
const src=bytes.toString('utf8');
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const oldBlob='18627cc0c5fc7945732c8a910504c59ef823b6ae';
const newBlob='1a61147d5a32889fa85e6a09e846049103b9f0bf';
const oldNeedle='    setTimeout(()=>{\n      try{\n        document.getElementById("sheet")';
const newNeedle='    setTimeout(()=>{\n      if(!isCaptureContext138())return;\n      try{\n        document.getElementById("sheet")';
const block=(src.match(/<script\b[^>]*\bid="captureFix138"[^>]*>([\s\S]*?)<\/script>/i)||[])[1];
assert.ok(block,'captureFix138 must still own its legacy helper functions');
assert.equal((block.split(oldNeedle).length-1)+(block.split(newNeedle).length-1),1,'exactly one delayed Hub site');
const isFixed=block.includes(newNeedle);
assert.equal(sha(bytes),isFixed?newBlob:oldBlob,'index must be byte-exact before/after 40-byte fix');
if(isFixed){
  const reverted=Buffer.from(src.replace(newNeedle,oldNeedle),'utf8');
  assert.equal(reverted.length,8165398,'unrelated index edits forbidden');
  assert.equal(sha(reverted),oldBlob,'exact rollback must yield the source checkpoint');
} else {
  assert.equal(bytes.length,8165398);
}
const wrapper=(block.match(/const start138=window\.startConfiguredGame;\s*window\.startConfiguredGame=async function\(\)\{[\s\S]*?\n\};/)||[])[0];
assert.ok(wrapper,'execute actual legacy wrapper, not reimplementation');
async function run({initial='capture',next='capture',reject=false,missingHub=false}={}){
  let mode=initial,rendered=0,calls=0;
  const timers=[],events=[],elements=new Map();
  for(const id of ['sheet','menu','captureGameHub']){
    if(missingHub&&id==='captureGameHub')continue;
    elements.set(id,{style:{display:'initial'},scrollIntoView:()=>events.push('scroll:'+id)});
  }
  const ctx=vm.createContext({
    window:{startConfiguredGame:async()=>{calls++;if(reject)throw Error('reject');return 5}},
    isCaptureContext138:()=>mode==='capture',
    document:{getElementById:id=>elements.get(id)||null},
    renderCaptureWorldHub:()=>{rendered++},
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length}
  });
  vm.runInContext(wrapper,ctx,{timeout:1800});
  if(reject)await assert.rejects(ctx.window.startConfiguredGame(),/reject/);
  else assert.equal(await ctx.window.startConfiguredGame(),5);
  mode=next;
  for(const t of timers)t.fn();
  return {rendered,calls,timers:timers.map(x=>x.ms),events,
    sheet:elements.get('sheet')?.style.display,menu:elements.get('menu')?.style.display,
    hub:elements.get('captureGameHub')?.style.display};
}
(async()=>{
  const normal=await run();
  assert.deepEqual(normal.timers,[30]);
  assert.equal(normal.rendered,1,'normal Capture delayed behavior preserved');
  assert.equal(normal.hub,'block');
  assert.equal(normal.sheet,'none');
  assert.equal(normal.menu,'block');
  assert.equal((await run({missingHub:true})).rendered,1);
  const dungeon=await run({initial:'dungeon',next:'dungeon'});
  assert.deepEqual(dungeon.timers,[],'Dungeon launch has no Capture timer');
  assert.equal(dungeon.calls,1);
  assert.deepEqual((await run({reject:true})).timers,[]);
  const staleDungeon=await run({initial:'capture',next:'dungeon'});
  assert.deepEqual(staleDungeon.timers,[30]);
  assert.equal(staleDungeon.rendered,0,'RED: no stale Hub render after switch to Dungeon');
  for(const k of ['sheet','menu','hub'])assert.equal(staleDungeon[k],'initial','do not mutate Dungeon UI '+k);
  assert.deepEqual(staleDungeon.events,[]);
  const staleSurvival=await run({initial:'capture',next:'survival'});
  assert.equal(staleSurvival.rendered,0,'Survie must not receive stale Hub render');
  assert.equal(staleSurvival.hub,'initial');
  console.log(JSON.stringify({test:'Capture138 late Hub guard',indexBlob:sha(bytes),safeSwitch:true,normalCapture:true,changedBytes:isFixed?40:0}));
})().catch(e=>{console.error(e);process.exitCode=1});
