'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const core318=read('assets/dungeon/dungeon-core-318.js');

const historical=/function activeHeroId\(x\)\{\s*const list=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\];\s*const i=Math\.max\(0,Math\.min\(Math\.max\(0,list\.length-1\),Number\(x\?\.index\)\|\|0\)\);\s*return String\(list\[i\]\|\|""\);\s*\}/;
assert.match(core318,historical,
  'Core 318 must still own the historical private activeHeroId before delegation RED');
assert.equal(
  (core318.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  0,
  'Core 318 must not consume the canonical helper before the delegation lot'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
let roomOfCalls=[];
let originalEntries=0;
let toasts=[];

const spatial={
  ensure(x){x.heroBranchStates=x.heroBranchStates||{};return x},
  roomOf(x,id){roomOfCalls.push(String(id));return x.heroRooms?.[id]??x.room},
  persist(){return true},
  activate(x,id){
    const state=x.heroBranchStates?.[id];
    if(state?.branch?.active){
      x.room=state.room;
      x.last=clone(state.last);
      x.enemyCells=clone(state.enemyCells||{});
      x.branch=clone(state.branch);
      x.positions[id]=state.cell;
    }
    return x;
  }
};

const ctx={
  console,JSON,Math,Date,localStorage,
  document:{querySelector(){return null}},
  setTimeout(){return 1},
  isDungeonMode(){return true},
  loadDungeonState(){return {room:91}},
  DungeonSpatial313:spatial,
  loadActiveEnemies(){return []},
  saveActiveEnemies(){},
  loadDungeonSceneElements(){return [{id:'cache-shared',cellIndex:5}]},
  gensGameplayModules(){return {movement:true}},
  currentRpgProfile(){return {rpgUniverse:{movement:{mode:'tactical'}}}},
  CHARS:{a:{name:'A'},b:{name:'B'},c:{name:'C'}},
  showToast(...args){toasts.push(args)},
  DungeonCore01:{render(){return true}}
};
ctx.dc200EnterBranch=function(){originalEntries++;return 'original'};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(core318,ctx,{filename:'assets/dungeon/dungeon-core-318.js'});

const api=ctx.DungeonCore318;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api,'Core 318 public API must load');
assert.equal(typeof api.activeRoom,'function');
assert.equal(typeof api.branchStateForSource,'function');
assert.equal(typeof canonical,'function');

function setRt(x){store.set(RT,JSON.stringify(x))}
function baseRuntime(participants,index){
  return {
    participants,index,room:4,
    heroRooms:{a:2,b:7,c:9,'42':11},
    positions:{a:5,b:5,c:5,'42':5},
    remaining:{a:3,b:2,c:1,'42':4},
    heroBranchStates:{},
    last:{kind:'room',map:{cells:Array(9).fill('floor')}},
    enemyCells:{},
    branch:null
  };
}

for(const test of [
  {participants:['a','b'],index:undefined,expected:'a',room:2},
  {participants:['a','b'],index:NaN,expected:'a',room:2},
  {participants:['a','b'],index:'1',expected:'b',room:7},
  {participants:['a','b'],index:-4,expected:'a',room:2},
  {participants:['a','b'],index:99,expected:'b',room:7},
  {participants:['a','b'],index:1.5,expected:'b',room:7},
  {participants:[42],index:0,expected:'42',room:11}
]){
  const x=baseRuntime(test.participants,test.index);
  setRt(x);roomOfCalls=[];
  assert.equal(canonical(test.participants,test.index),test.expected);
  assert.equal(api.activeRoom(),test.room,
    'Core 318 activeRoom must keep using the historically selected hero room');
  assert.deepEqual(roomOfCalls,[test.expected],
    'Spatial.roomOf must receive the historically selected active hero');
}

{
  const x=baseRuntime(['a','b','c'],1.5);
  x.room=13;setRt(x);roomOfCalls=[];
  assert.equal(canonical(x.participants,x.index),'');
  assert.equal(api.activeRoom(),13,
    'in-range fractional index must still yield no hero and fall back to runtime room');
  assert.deepEqual(roomOfCalls,[]);
}

{
  const x=baseRuntime('not-an-array',0);
  x.room=14;setRt(x);roomOfCalls=[];
  assert.equal(api.activeRoom(),14);
  assert.deepEqual(roomOfCalls,[]);
}

{
  const x=baseRuntime(['a','b'],'1');
  x.heroBranchStates.a={
    room:4,cell:22,last:{kind:'boss',map:{entryIdx:22,cells:Array(25).fill('floor')}},
    enemyCells:{boss:12},
    branch:{active:true,heroId:'a',parentRoom:4,sourceId:'cache-shared',sourceCell:5}
  };
  setRt(x);originalEntries=0;toasts=[];
  assert.equal(ctx.dc200EnterBranch('cache-shared'),true,
    'selected hero must join the existing shared branch');
  assert.equal(originalEntries,0,
    'joining an existing branch must not invoke the original branch generator');
  const after=JSON.parse(store.get(RT));
  assert.equal(after.heroBranchStates.b.branch.sourceId,'cache-shared');
  assert.equal(after.heroBranchStates.b.branch.heroId,'b');
  assert.equal(after.remaining.b,2,
    'branch join must preserve selected hero remaining movement');
  assert.ok(toasts.length>=1,'existing branch join keeps the historical notice path');
}

{
  const x=baseRuntime(['a','b','c'],1.5);
  x.heroBranchStates.a={
    room:4,cell:22,last:{kind:'boss',map:{entryIdx:22,cells:Array(25).fill('floor')}},
    enemyCells:{},
    branch:{active:true,heroId:'a',parentRoom:4,sourceId:'cache-shared',sourceCell:5}
  };
  setRt(x);originalEntries=0;
  assert.equal(ctx.dc200EnterBranch('cache-shared'),'original',
    'no selected hero must preserve the original branch path');
  assert.equal(originalEntries,1);
}

console.log(JSON.stringify({
  scenario:'Phase 7 Core 318 active hero characterization',
  consumers:['DungeonCore318.activeRoom','dc200EnterBranch branch guard'],
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN before delegation with historical Core 318 selector preserved',
  deferred:[
    'DungeonCore317 activeHeroId divergence',
    'DungeonSourceRenderStability167877 inline active selector divergence'
  ]
},null,2));
