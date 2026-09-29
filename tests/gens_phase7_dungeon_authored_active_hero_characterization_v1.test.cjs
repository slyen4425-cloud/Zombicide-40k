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

assert.equal(bytes.length,8169990,
  'Phase 7 active-hero characterization must start from Final Exit terminal GREEN runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 active-hero characterization must keep the exact canonical index blob');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;

assert.match(authored,historical,
  'Authored Runtime must still expose the historical local activeHero selector before extraction');
assert.match(finalExit,historical,
  'Final Exit must still expose the same historical local activeHero selector before extraction');
assert.equal((authored.match(/function activeHero\(/g)||[]).length,1);
assert.equal((finalExit.match(/function activeHero\(/g)||[]).length,1);
assert.equal(
  (entry.match(/resolveAuthoredActiveHero/g)||[]).length,
  0,
  'canonical active-hero helper must not exist before extraction'
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

// Authored Runtime path: plan() exposes the selected hero without needing room travel.
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
  assert.equal(hero(['a','b'],'1'),'b');
  assert.equal(hero(['a','b'],-4),'a');
  assert.equal(hero(['a','b'],99),'b');
  assert.equal(hero(['a','b'],1.5),'b',
    'fractional index above the last index must clamp to the last hero historically');
  assert.equal(hero(['a','b','c'],1.5),'',
    'fractional index inside the valid numeric range must remain fractional and miss the array slot historically');
  assert.equal(hero([],0),'');
  assert.equal(hero('not-an-array',0),'');
  assert.equal(hero([0,'b'],0),'');
  assert.equal(hero([42],0),'42');
}

// Final Exit path: finalState() must resolve the same active hero for valid authored terminal state.
{
  const {store,localStorage}=makeStore();
  const graph={id:'world-active-hero'};
  let positionalEnabled=true;
  const authoredApi={
    active(){return true},
    graph(){return graph},
    plan(){return {currentNodeId:'last',outgoing:[],targetNodeId:'',needsExit:false}},
    positional(){return positionalEnabled}
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
  assert.equal(stateFor([42],0)?.hero,'42');
  assert.equal(stateFor([],0),null,
    'empty participants must still make Final Exit reject the state because active hero is empty');
}

console.log(JSON.stringify({
  scenario:'Phase 7 authored active hero characterization',
  runtime:{bytes:bytes.length,gitBlob},
  duplicatedOwners:[
    'DungeonAuthoredRuntime167839.activeHero',
    'DungeonAuthoredFinalExit167875.activeHero'
  ],
  pureTarget:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  semantics:{
    clampsNegativeToFirst:true,
    clampsOverflowToLast:true,
    numericStringCoercion:true,
    fractionalIndexClampedOnlyAtBounds:true,
    inRangeFractionalIndexNotNormalized:true,
    falsyParticipantBecomesEmpty:true
  }
},null,2));
