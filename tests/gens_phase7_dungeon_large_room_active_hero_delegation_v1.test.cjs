'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const largeRoom=read('assets/dungeon/dungeon-large-room-support-167834.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (largeRoom.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Large Room must delegate the pure active-hero selection exactly once'
);
assert.match(
  largeRoom,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Large Room private activeHero must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  largeRoom,
  /function activeHero\(x\)\{const ids=Array\.isArray\(x\?\.participants\)/,
  'Large Room must no longer own the historical active-hero algorithm'
);
assert.ok(
  contract.invariants.some(x=>/DungeonLargeRoom167834/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the Large Room active-hero delegation boundary'
);
assert.doesNotMatch(
  entry,
  /DungeonLargeRoom167834|dungeon-large-room-support-167834/,
  'pure Dungeon entry must not absorb Large Room runtime ownership'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))},
  removeItem(k){store.delete(k)}
};
const math=Object.create(Math);
math.random=()=>0.25;
const roomB={
  id:'room-b',name:'Salle B',width:3,height:3,roomType:'room',theme:'crypt',
  cells:Array.from({length:9},(_,i)=>({
    terrain:i===4?'wall':'floor',
    object:i===1?'entry':i===8?'exit':null
  }))
};
const graph={
  id:'world-large-room',startNodeId:'B',
  nodes:[{id:'B',roomId:'room-b',label:'Salle B'}],edges:[]
};
const ctx={
  console,JSON,Date,Math:math,localStorage,
  DungeonWorldBuilder167821:{
    findDungeon(id){return id===graph.id?JSON.parse(JSON.stringify(graph)):null}
  },
  DungeonRoomCreator100:{
    findRoom(id){return id===roomB.id?JSON.parse(JSON.stringify(roomB)):null}
  },
  loadActiveEnemies(){return []},
  loadDungeonSceneElements(){return []},
  saveDungeonSceneElements(){return true},
  DungeonSpatial313:{ensure(){},persist(){}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(largeRoom,ctx,{filename:'assets/dungeon/dungeon-large-room-support-167834.js'});

const api=ctx.DungeonLargeRoom167834;
const canonical=ctx.GensDungeonV1.movement.resolveAuthoredActiveHero;
assert.equal(typeof api?.repairGenerated,'function');
assert.equal(typeof api?.repairWorld,'function');

function legacyMap(size=9){
  const cells=Array(size*size).fill('floor');
  cells[0]='entry';cells[cells.length-1]='exit';
  return {version:4,size,width:size,height:size,cells,entryIdx:0,exitIdx:cells.length-1,objective:{type:'reach_exit',status:'open'}};
}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
function readRt(){return JSON.parse(localStorage.getItem(RT)||'null')}

write({
  participants:['a','b'],index:'1',room:1,
  positions:{a:2,b:5},remaining:{a:3,b:3},
  enemyCells:{},heroRooms:{a:1,b:1},roomStates:{},
  last:{kind:'enemy',room:1,map:legacyMap(9)},
  dc313LastTransition:{heroId:'b',from:0,to:1,created:true}
});
assert.equal(canonical(['a','b'],'1'),'b');
assert.equal(api.repairGenerated({room:0},6),true);
let x=readRt();
assert.equal(x.positions.a,2);
assert.equal(x.positions.b,x.last.map.entryIdx);

write({
  participants:['a','b','c'],index:1.5,room:1,
  positions:{a:2,b:4,c:6},remaining:{a:3,b:3,c:3},
  enemyCells:{},heroRooms:{a:1,b:1,c:1},roomStates:{},
  last:{kind:'enemy',room:1,map:legacyMap(9)},
  dc313LastTransition:{heroId:'',from:0,to:1,created:true}
});
assert.equal(canonical(['a','b','c'],1.5),'');
assert.equal(api.repairGenerated({room:0},6),true);
x=readRt();
assert.deepEqual(JSON.parse(JSON.stringify(x.positions)),{a:2,b:4,c:6});

write({
  participants:['a','b'],index:1,room:1,
  positions:{a:0,b:0},remaining:{a:3,b:3},
  enemyCells:{},heroRooms:{a:1,b:1},roomStates:{},
  last:{kind:'enemy',room:1,map:legacyMap(6)},
  dc313LastTransition:{heroId:'b',from:0,to:1,created:true}
});
assert.equal(api.repairWorld(
  {room:0},
  {id:'world-large-room'},
  {targetNodeId:'B',edge:{toEntryIndex:1}}
),true);
x=readRt();
assert.equal(x.world167823.heroNodes.b,'B');
assert.deepEqual(JSON.parse(JSON.stringify(x.world167823.history.b)),['B']);
assert.equal(x.world167823.heroNodes.a,undefined);
assert.equal(x.positions.b,1);

console.log(JSON.stringify({
  scenario:'Phase 7 Large Room active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  consumers:[
    'DungeonLargeRoom167834.repairGenerated',
    'DungeonLargeRoom167834.repairWorld -> ensureWorldState'
  ],
  expected:'RED before delegation, GREEN after Large Room-only micro-diff'
},null,2));
