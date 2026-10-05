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
const finalExit=read('assets/dungeon/dungeon-authored-final-exit-167875.js');
const returnPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const branchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');

const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167138,
  'Final Exit active-hero characterization must keep the canonical index size');
assert.equal(gitBlob,'09b1e19c04777da82fd0ad355adc7eb82532db29',
  'Final Exit active-hero characterization must keep the canonical index blob');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;

assert.doesNotMatch(finalExit,historical,
  'Final Exit must no longer own the duplicated activeHero decision after delegation');
assert.equal((finalExit.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,1,
  'Final Exit must consume the canonical helper exactly once after delegation');
assert.match(finalExit,
  /function activeHero\(x\)\{return R\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Final Exit must keep activeHero(x) as the local runtime raccord');
assert.doesNotMatch(returnPersist,historical,
  'Return Persist no longer owns the duplicated decision after its later dedicated delegation lot');
assert.match(returnPersist,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Return Persist preserves its public raccord and delegates only pure selection');
assert.equal((returnPersist.match(/resolveAuthoredActiveHero\(/g)||[]).length,1);
assert.doesNotMatch(branchNav,historical,
  'Branch Nav Cleanup no longer owns the duplicated decision after its later dedicated delegation lot');
assert.match(branchNav,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Branch Nav Cleanup preserves its public raccord and delegates only pure selection');
assert.equal((branchNav.match(/resolveAuthoredActiveHero\(/g)||[]).length,1);

const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
const graph={id:'world-final-exit-active-hero'};
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
const resolve=ctx.GensDungeonV1.movement.resolveAuthoredActiveHero;
assert.ok(api,'Final Exit API must load');
assert.equal(typeof resolve,'function','canonical active-hero helper must exist from lot 17');

function finalStateFor(participants,index){
  const hero=resolve(participants,index);
  const positions={};
  if(hero)positions[hero]=2;
  store.set('gensrpg_dungeon_runtime_v2',JSON.stringify({
    participants,index,room:3,positions,
    last:{
      authoredRuntime167839:true,
      worldDungeonId:'world-final-exit-active-hero',
      worldNodeId:'last',
      map:{cells:['floor','cache','exit'],exitIdx:2}
    },
    branch:null
  }));
  return {expectedHero:hero,state:api.finalState()};
}

for(const [participants,index] of [
  [['a','b'],undefined],
  [['a','b'],NaN],
  [['a','b'],'1'],
  [['a','b'],-4],
  [['a','b'],99],
  [['a','b'],1.5],
  [['a','b','c'],1.5],
  [[],0],
  ['not-an-array',0],
  [[0,'b'],0],
  [[42],0]
]){
  const {expectedHero,state}=finalStateFor(participants,index);
  if(expectedHero){
    assert.ok(state,'Final Exit must accept a valid canonical active hero in the terminal scenario');
    assert.equal(state.hero,expectedHero,
      'Final Exit local raccord must match the canonical helper exactly after delegation');
  }else{
    assert.equal(state,null,
      'Final Exit must reject terminal state when the historical/canonical active hero is empty');
  }
}

console.log(JSON.stringify({
  scenario:'Phase 7 Final Exit active hero delegation characterization',
  runtime:{bytes:bytes.length,gitBlob},
  localOwner:'DungeonAuthoredFinalExit167875.activeHero',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  laterDelegated:[
    'DungeonAuthoredReturnPersist167862.activeHero',
    'DungeonAuthoredBranchNavCleanup167863.activeHero'
  ],
  untouched:[
    'DungeonAuthoredRuntime167839',
    'DungeonSpatial313'
  ],
  result:'parity preserved after delegation'
},null,2));
