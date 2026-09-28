'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169990,
  'Phase 7 authored hero-move characterization must track the micro-lot 7 runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 authored hero-move characterization must track the exact micro-lot 7 blob');

assert.match(
  authored,
  /function heroMoveAllowance\(id\)\{try\{return Math\.max\(0,Number\(ROOT\.dungeonHeroMoveValue083\?\.\(id\)\)\|\|Number\(ROOT\.CHARS\?\.\[id\]\?\.dungeonStats\?\.movement\)\|\|3\)\}catch\(e\)\{return 3\}\}/,
  'historical authored heroMoveAllowance expression drifted'
);
assert.match(
  authored,
  /function movementForEntry\(x,hero\)\{const plan=ROOT\.GensDungeonV1\.movement\.planAuthoredEntryMovement\(x\?\.remaining\?\.\[hero\]\);return plan\.status==="remaining"\?plan\.movement:heroMoveAllowance\(hero\)\}/,
  'entry movement must keep heroMoveAllowance as its lazy fallback consumer'
);
assert.doesNotMatch(entry,/planAuthoredHeroMoveAllowance/,
  'characterization must stay GREEN before hero-move allowance planner extraction');

let primaryValue=4;
let primaryThrows=false;
let primaryCalls=0;
let statValue=9;
let statReads=0;
let hasHero=true;

const context={
  console,Math,Date,JSON,
  localStorage:{getItem(){return null},setItem(){}},
  dungeonHeroMoveValue083(id){
    primaryCalls++;
    assert.equal(id,'hero');
    if(primaryThrows)throw new Error('primary failure');
    return primaryValue;
  }
};
Object.defineProperty(context,'CHARS',{
  configurable:true,
  get(){
    if(!hasHero)return {};
    return {hero:{dungeonStats:{
      get movement(){statReads++;return statValue}
    }}};
  }
});
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,context,{filename:'dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;
assert.ok(api,'authored runtime API must load');
assert.equal(typeof api.heroMoveAllowance,'function');

function run({primary,stat=9,throws=false,hero=true},expected,{reads,primaryCount=1}){
  primaryValue=primary;
  statValue=stat;
  primaryThrows=throws;
  hasHero=hero;
  primaryCalls=0;
  statReads=0;
  assert.equal(api.heroMoveAllowance('hero'),expected);
  assert.equal(primaryCalls,primaryCount,'primary movement provider call count drifted');
  assert.equal(statReads,reads,'CHARS fallback read count drifted');
}

run({primary:4},4,{reads:0});
run({primary:-2},0,{reads:0});
run({primary:'4'},4,{reads:0});
run({primary:Infinity},Infinity,{reads:0});
run({primary:0,stat:9},9,{reads:1});
run({primary:'0',stat:9},9,{reads:1});
run({primary:undefined,stat:-2},0,{reads:1});
run({primary:null,stat:0},3,{reads:1});
run({primary:NaN,hero:false},3,{reads:0});
run({primary:4,throws:true,stat:9},3,{reads:0});

console.log(JSON.stringify({
  scenario:'Phase 7 authored hero move allowance characterization',
  runtime:{bytes:bytes.length,gitBlob},
  owner:'DungeonAuthoredRuntime167839.heroMoveAllowance',
  primaryProvider:'dungeonHeroMoveValue083',
  fallback:'CHARS movement then 3',
  primaryShortCircuit:true,
  exceptionFallback:3,
  spatial:'untouched'
},null,2));
