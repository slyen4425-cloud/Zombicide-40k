'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const worldRuntime=read('assets/dungeon/dungeon-world-runtime-167823.js');

const historical=/function activeHeroId\(x\)\{const list=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,list\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(list\[i\]\|\|""\)\}/;
assert.doesNotMatch(worldRuntime,historical,
  'World Runtime must no longer own the historical private selector after delegation');
assert.equal(
  (worldRuntime.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'World Runtime must consume the canonical helper exactly once after delegation'
);
assert.match(
  worldRuntime,
  /function activeHeroId\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'World Runtime activeHeroId must retain its private surface while delegating only the pure selection'
);

const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
const RT='gensrpg_dungeon_runtime_v2';
const CFG='gensrpg_dungeon_authoritative_world_cfg_v1';

const graph={
  id:'world-hero',
  startNodeId:'A',
  nodes:[
    {id:'A',roomId:'room-a',label:'A'},
    {id:'B',roomId:'room-b',label:'B'}
  ],
  edges:[
    {id:'ab',fromNodeId:'A',fromExitIndex:2,toNodeId:'B',toEntryIndex:0}
  ]
};
const rooms={
  'room-a':{id:'room-a',name:'Salle A',width:2,height:2,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},
    {terrain:'floor',object:'exit'},{terrain:'floor',object:null}
  ]},
  'room-b':{id:'room-b',name:'Salle B',width:2,height:2,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:'exit'}
  ]}
};

function setRt(x){store.set(RT,JSON.stringify(x))}
function getRt(){return JSON.parse(store.get(RT)||'null')}
function baseRuntime(participants,index,positions){
  return {
    participants,index,room:1,
    positions:{...positions},
    remaining:Object.fromEntries((Array.isArray(participants)?participants:[]).map(x=>[String(x),3])),
    heroRooms:{},
    enemyCells:{},
    roomStates:{},
    last:{kind:'world',map:{cells:['entry','floor','exit','floor'],entryIdx:0,exitIdx:2}},
    world167823:{
      dungeonId:'world-hero',
      heroNodes:{a:'A',b:'A'},
      nodeRooms:{A:1},
      roomNodes:{'1':'A'},
      history:{}
    }
  };
}

store.set(CFG,JSON.stringify({adv:{enabled:true,dungeonId:'world-hero'}}));
let legacyExploreCalls=0;
const core={
  render(){return true},
  explore(){legacyExploreCalls++;return 'legacy'}
};
const spatial={
  ensure(x){x.roomStates=x.roomStates||{};x.heroRooms=x.heroRooms||{};x.positions=x.positions||{};x.remaining=x.remaining||{};x.enemyCells=x.enemyCells||{}},
  persist(){},
  setRoom(){},
  activate(){}
};

const ctx={
  console,JSON,Math,Date,localStorage,
  setTimeout(){return 1},
  DungeonCore01:core,
  DungeonSpatial313:spatial,
  DungeonWorldBuilder167821:{
    findDungeon(id){return id==='world-hero'?JSON.parse(JSON.stringify(graph)):null},
    validation(g){return {valid:!!g?.startNodeId}}
  },
  DungeonRoomCreator100:{
    findRoom(id){const r=rooms[String(id)];return r?JSON.parse(JSON.stringify(r)):null}
  },
  DungeonZoneContent167824:{applyCurrentZone(){return false}},
  activeDungeonAdventureId(){return 'adv'},
  dungeonRoomExitLocked102(){return false},
  showToast(){},
  modal(){}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(worldRuntime,ctx,{filename:'assets/dungeon/dungeon-world-runtime-167823.js'});

const api=ctx.DungeonWorldRuntime167823;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api);
assert.equal(typeof api.currentPlan,'function');
assert.equal(typeof canonical,'function');
assert.equal(api.install(),true,'fixture must explicitly install the real World Runtime wrappers');

for(const t of [
  {participants:['a','b'],index:undefined},
  {participants:['a','b'],index:NaN},
  {participants:['a','b'],index:'1'},
  {participants:['a','b'],index:-4},
  {participants:['a','b'],index:99},
  {participants:['a','b'],index:1.5},
  {participants:['a','b','c'],index:1.5},
  {participants:[],index:0},
  {participants:'not-an-array',index:0},
  {participants:[0,'b'],index:0},
  {participants:[42],index:0}
]){
  const expected=canonical(t.participants,t.index);
  const positions={a:2,b:2,c:2,'42':2};
  setRt(baseRuntime(t.participants,t.index,positions));
  const p=api.currentPlan();
  if(expected){
    assert.ok(p,'currentPlan must exist when historical active hero resolves');
    assert.equal(p.hero,expected,'currentPlan must expose the historically selected hero');
  }else{
    assert.equal(p,null,'currentPlan must remain null when historical selector resolves no hero');
  }
}

legacyExploreCalls=0;
setRt(baseRuntime(['a','b'],'1',{a:0,b:2}));
assert.equal(core.explore(),true,'wrapped explore must use selected hero b and follow edge A -> B');
assert.equal(legacyExploreCalls,0,'authoritative World Runtime must not fall back to legacy explore');
let x=getRt();
assert.equal(x.last.worldNodeId,'B');
assert.equal(x.world167823.heroNodes.b,'B');

legacyExploreCalls=0;
setRt(baseRuntime(['a','b','c'],1.5,{a:2,b:2,c:2}));
assert.equal(core.explore(),'legacy',
  'in-range fractional selector must still resolve no hero and fall back to legacy explore');
assert.equal(legacyExploreCalls,1);

console.log(JSON.stringify({
  scenario:'Phase 7 World Runtime active hero characterization',
  consumers:[
    'DungeonWorldRuntime167823.currentPlan',
    'DungeonWorldRuntime167823 installed DungeonCore01.explore wrapper'
  ],
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN after delegation with historical behavior preserved'
},null,2));
