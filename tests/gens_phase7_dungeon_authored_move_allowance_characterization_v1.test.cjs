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

assert.equal(bytes.length,8165614,
  'Phase 7 authored move-allowance characterization must track the arrival-cell GREEN runtime');
assert.equal(gitBlob,'560966d096134cd58ff4dc6ab2be589cee936ba7',
  'Phase 7 authored move-allowance characterization must track the exact arrival-cell GREEN blob');

assert.match(
  authored,
  /function heroMoveAllowance\(id\)\{try\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredHeroMoveAllowance\(ROOT\.dungeonHeroMoveValue083\?\.\(id\),ROOT\.CHARS\?\.\[id\]\?\.dungeonStats\?\.movement\)\}catch\(e\)\{return 3\}\}/,
  'post-raccord authored heroMoveAllowance must preserve global reads and catch fallback around the pure Dungeon helper'
);
assert.match(
  authored,
  /function movementForEntry\(x,hero\)\{const plan=ROOT\.GensDungeonV1\.movement\.planAuthoredEntryMovement\(x\?\.remaining\?\.\[hero\]\);return plan\.status==="remaining"\?plan\.movement:heroMoveAllowance\(hero\)\}/,
  'movementForEntry must keep its lazy authored fallback boundary'
);

function make(runtimeValue,statValue,{runtimeThrows=false,charsThrows=false}={}){
  let runtimeCalls=0;
  const localStorage={getItem(){return null},setItem(){}};
  const context={console,Math,Date,JSON,localStorage};
  if(runtimeThrows){
    context.dungeonHeroMoveValue083=()=>{runtimeCalls++;throw new Error('runtime movement failure')};
  }else{
    context.dungeonHeroMoveValue083=()=>{runtimeCalls++;return runtimeValue};
  }
  if(charsThrows){
    Object.defineProperty(context,'CHARS',{get(){throw new Error('chars failure')}});
  }else{
    context.CHARS={hero:{dungeonStats:{movement:statValue}}};
  }
  context.window=context;
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
  vm.runInContext(authored,context,{filename:'dungeon-authored-runtime-167839.js'});
  return {context,api:context.DungeonAuthoredRuntime167839,runtimeCalls};
}

function value(runtimeValue,statValue,expected){
  const x=make(runtimeValue,statValue);
  assert.ok(x.api,'authored runtime API must load');
  assert.equal(x.api.heroMoveAllowance('hero'),expected,
    'heroMoveAllowance parity failed for runtime='+String(runtimeValue)+' stat='+String(statValue));
}

value(4,9,4);
value('4',9,4);
value(-2,9,0);
value(0,9,9);
value(null,5,5);
value(undefined,0,3);
value('abc',7,7);
value(Infinity,7,Infinity);
value(0,-2,0);
value(undefined,undefined,3);

{
  const x=make(4,9,{runtimeThrows:true});
  assert.equal(x.api.heroMoveAllowance('hero'),3,
    'runtime provider exception must preserve historical authored catch fallback 3');
}
{
  const x=make(0,9,{charsThrows:true});
  assert.equal(x.api.heroMoveAllowance('hero'),3,
    'stat lookup exception must preserve historical authored catch fallback 3');
}

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.resolveAuthoredHeroMoveAllowance,
  'function',
  'post-raccord characterization requires the Dungeon-owned authored move-allowance helper'
);

assert.doesNotMatch(
  entry,
  /dungeonHeroMoveValue083|CHARS|DungeonSpatial313/,
  'Dungeon public entry must not already own authored runtime reads or spatial state'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored hero move allowance characterization after arrival-cell GREEN',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.heroMoveAllowance',
  semantics:{
    runtimePriority:true,
    negativeClamp:true,
    zeroFallsThrough:true,
    statFallback:true,
    defaultMovement:3,
    authoredCatchFallback:3
  },
  pureTarget:'GensDungeonV1.movement.resolveAuthoredHeroMoveAllowance',
  spatial:'unchanged'
},null,2));
