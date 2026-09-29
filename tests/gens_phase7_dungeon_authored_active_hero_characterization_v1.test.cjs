'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169990,
  'Phase 7 authored active-hero characterization must start from Final Exit terminal GREEN runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 authored active-hero characterization must keep the exact canonical index blob');

assert.match(
  authored,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.exploration\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'post-raccord Authored Runtime must preserve state reads while delegating active-hero selection'
);

const pure={};
pure.window=pure;
pure.globalThis=pure;
vm.createContext(pure);
vm.runInContext(entry,pure,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pure.GensDungeonV1?.exploration?.resolveAuthoredActiveHero,
  'function',
  'post-raccord characterization requires the canonical authored active-hero helper'
);

const localStorage={getItem(){return null},setItem(){}};
const ctx={console,Math,Date,JSON,localStorage};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,ctx,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
const api=ctx.DungeonAuthoredRuntime167839;
assert.ok(api,'Authored Runtime API must load');

const graph={id:'world-active-hero',startNodeId:'A',nodes:[{id:'A'}],edges:[]};
function hero(participants,index){
  const x={participants,index,room:0};
  return api.plan(x,graph).hero;
}

assert.equal(hero(['a','b','c'],0),'a');
assert.equal(hero(['a','b','c'],2),'c');
assert.equal(hero(['a','b','c'],99),'c',
  'oversized active index must clamp to last participant');
assert.equal(hero(['a','b','c'],-4),'a',
  'negative active index must clamp to first participant');
assert.equal(hero(['a','b','c'],'1'),'b',
  'numeric-string active index must preserve Number coercion');
assert.equal(hero(['a','b','c'],undefined),'a',
  'missing active index must preserve first-participant fallback');
assert.equal(hero(['a','b','c'],'abc'),'a',
  'non-numeric active index must preserve Number(index)||0 fallback');
assert.equal(hero(['a','b','c'],1.5),'',
  'fractional active index must not be rounded or normalized');
assert.equal(hero(null,0),'',
  'non-array participants must preserve empty-hero result');
assert.equal(hero([],0),'',
  'empty participants must preserve empty-hero result');
assert.equal(hero([0,'b'],0),'',
  'falsy participant values must preserve historical empty-string conversion');
assert.equal(hero([123],0),'123',
  'truthy non-string participant values must preserve String conversion');

console.log(JSON.stringify({
  scenario:'Phase 7 authored active hero post-raccord characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.activeHero consumer',
  pureTarget:'GensDungeonV1.exploration.resolveAuthoredActiveHero',
  semantics:{
    clampNegativeToFirst:true,
    clampOversizedToLast:true,
    numericStringCoercion:true,
    invalidIndexFallsBackZero:true,
    fractionalIndexNotRounded:true,
    falsyParticipantBecomesEmpty:true
  }
},null,2));
