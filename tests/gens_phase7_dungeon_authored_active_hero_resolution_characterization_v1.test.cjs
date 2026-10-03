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
const finalExit=read('assets/dungeon/dungeon-authored-final-exit-167875.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169430,
  'Phase 7 active-hero resolution characterization must start from the canonical post-divergence GREEN runtime');
assert.equal(gitBlob,'f523410e175ee4946059da8e8ee8519295fb63c5',
  'Phase 7 active-hero resolution characterization must keep the exact canonical index blob');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;

assert.match(
  authored,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Authored Runtime must preserve local state reads while delegating only pure active-hero selection'
);
assert.match(
  finalExit,
  /function activeHero\(x\)\{return R\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Final Exit may subsequently delegate the same proven pure selection while preserving finalState semantics'
);
assert.equal((authored.match(/function activeHero\(/g)||[]).length,1);
assert.equal((finalExit.match(/function activeHero\(/g)||[]).length,1);
assert.ok(
  (entry.match(/resolveAuthoredActiveHero/g)||[]).length>=2,
  'canonical active-hero helper must be defined and exported by Dungeon movement'
);

const makeStore=()=>{
  const store=new Map();
  return {
    store,
    localStorage:{
      getItem(k){return store.has(k)?store.get(k):null},
      setItem(k,v){store.set(k,String(v))}
    }
  };
};

// Authored Runtime: plan() exposes the selected hero through the real authored path.
{
  const {localStorage}=makeStore();
  const ctx={console,Math,Date,JSON,localStorage};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
  vm.runInContext(authored,ctx,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
  const api=ctx.DungeonAuthoredRuntime167839;
  assert.ok(api,'Authored Runtime API must load');

  const hero=(participants,index)=>{
    const x={participants,index,room:0};
    const g={id:'world-active-hero',startNodeId:'A',edges:[]};
    return api.plan(x,g).hero;
  };

  assert.equal(hero(['a','b'],undefined),'a');
  assert.equal(hero(['a','b'],NaN),'a');
  assert.equal(hero(['a','b'],'1'),'b');
  assert.equal(hero(['a','b'],-4),'a');
  assert.equal(hero(['a','b'],99),'b');
  assert.equal(hero(['a','b'],1.5),'b',
    'fractional index above the upper bound must clamp to the last hero historically');
  assert.equal(hero(['a','b','c'],1.5),'',
    'fractional index still inside numeric bounds must remain fractional and miss the array slot historically');
  assert.equal(hero([],0),'');
  assert.equal(hero('not-an-array',0),'');
  assert.equal(hero([0,'b'],0),'');
  assert.equal(hero([42],0),'42');
}

// Final Exit: finalState() resolves the same active hero through the real terminal-state path.
{
  const {store,localStorage}=makeStore();
  const graph={id:'world-active-hero'};
  const authoredApi={
    active(){return true},
    graph(){return graph},
    plan(){return {currentNodeId:'last',outgoing:[],targetNodeId:'',needsExit:false}},
    positional(){return true}
  };
  const ctx={
    console,Math,Date,JSON,localStorage,
    DungeonAuthoredRuntime167839:authoredApi
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
  vm.runInContext(finalExit,ctx,{filename:'assets/dungeon/dungeon-authored-final-exit-167875.js'});
  const api=ctx.DungeonAuthoredFinalExit167875;
  assert.ok(api,'Final Exit API must load');

  const stateFor=(participants,index)=>{
    const positions={};
    for(const value of Array.isArray(participants)?participants:[]){
      if(value)positions[String(value)]=2;
    }
    store.set('gensrpg_dungeon_runtime_v2',JSON.stringify({
      participants,index,room:3,positions,
      last:{
        authoredRuntime167839:true,
        worldDungeonId:'world-active-hero',
        worldNodeId:'last',
        map:{cells:['floor','cache','exit'],exitIdx:2}
      },
      branch:null
    }));
    return api.finalState();
  };

  assert.equal(stateFor(['a','b'],undefined)?.hero,'a');
  assert.equal(stateFor(['a','b'],'1')?.hero,'b');
  assert.equal(stateFor(['a','b'],-4)?.hero,'a');
  assert.equal(stateFor(['a','b'],99)?.hero,'b');
  assert.equal(stateFor(['a','b'],1.5)?.hero,'b');
  assert.equal(stateFor(['a','b','c'],1.5),null,
    'in-range fractional selector must still yield an empty hero and make Final Exit reject the state');
  assert.equal(stateFor([42],0)?.hero,'42');
  assert.equal(stateFor([],0),null,
    'empty participants must still make Final Exit reject the state because active hero is empty');
}

console.log(JSON.stringify({
  scenario:'Phase 7 authored active hero resolution characterization after Final Exit divergence lot',
  runtime:{bytes:bytes.length,gitBlob},
  pureOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  runtimeConsumer:'DungeonAuthoredRuntime167839.activeHero',
  subsequentDelegatedConsumer:'DungeonAuthoredFinalExit167875.activeHero',
  semantics:{
    clampsNegativeToFirst:true,
    clampsOverflowToLast:true,
    numericStringCoercion:true,
    fractionalIndexClampedOnlyAtBounds:true,
    inRangeFractionalIndexNotNormalized:true,
    falsyParticipantBecomesEmpty:true
  }
},null,2));
