'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const roomRuntime=read('assets/dungeon/dungeon-room-runtime-167822.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (roomRuntime.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Room Runtime must delegate the pure active-hero selection exactly once'
);
assert.match(
  roomRuntime,
  /function activeHeroId\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Room Runtime private activeHeroId must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  roomRuntime,
  /function activeHeroId\(x\)\{const list=Array\.isArray\(x\?\.participants\)/,
  'Room Runtime must no longer own the historical active-hero selection algorithm'
);

const RT='gensrpg_dungeon_runtime_v2';
const CFG='gensrpg_dungeon_room_runtime_cfg_v1';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
const forcedRoom={
  id:'room-forced',
  name:'Forced room',
  roomType:'room',
  theme:'stone',
  width:3,
  height:2,
  cells:[
    {terrain:'floor',object:'floor'},
    {terrain:'floor',object:'entry'},
    {terrain:'wall',object:null},
    {terrain:'floor',object:null},
    {terrain:'floor',object:'enemy'},
    {terrain:'floor',object:'exit'}
  ]
};
const ctx={
  console,JSON,Math,Date,localStorage,
  setTimeout(){return 1},
  activeDungeonAdventureId(){return 'adv-room-runtime'},
  DungeonRoomCreator100:{
    loadLibrary(){return [JSON.parse(JSON.stringify(forcedRoom))]},
    validateRoom(){return {valid:true}}
  },
  DungeonSpatial313:{ensure(){},persist(){}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(roomRuntime,ctx,{filename:'assets/dungeon/dungeon-room-runtime-167822.js'});

const api=ctx.DungeonRoomRuntime167822;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.equal(typeof api?.applyTemplateToCurrentRoom,'function');
assert.equal(typeof canonical,'function');

store.set(CFG,JSON.stringify({
  'adv-room-runtime':{enabled:true,chance:100,roomIds:['room-forced']}
}));

function makeRuntime(participants,index,positions,remaining){
  return {
    participants,index,room:2,
    positions:{...(positions||{})},
    remaining:{...(remaining||{})},
    enemyCells:{enemyA:0},
    roomStates:{},
    heroRooms:{},
    dc313LastTransition:{heroId:'seed',from:1,to:2,created:true},
    last:{
      kind:'enemy',
      room:2,
      map:{size:2,width:2,height:2,cells:['entry','enemy','floor','exit'],entryIdx:0,exitIdx:3}
    }
  };
}
function setRuntime(x){store.set(RT,JSON.stringify(x))}
function getRuntime(){return JSON.parse(store.get(RT))}

for(const test of [
  {participants:['a','b'],index:'1',positions:{a:7,b:8},remaining:{a:2,b:4}},
  {participants:['a','b'],index:-4,positions:{a:7,b:8},remaining:{a:2,b:4}},
  {participants:['a','b'],index:99,positions:{a:7,b:8},remaining:{a:2,b:4}},
  {participants:['a','b'],index:1.5,positions:{a:7,b:8},remaining:{a:2,b:4}},
  {participants:[42],index:0,positions:{'42':8},remaining:{'42':6}}
]){
  setRuntime(makeRuntime(test.participants,test.index,test.positions,test.remaining));
  const hero=canonical(test.participants,test.index);
  assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),true);
  const after=getRuntime();
  for(const [id,pos] of Object.entries(test.positions)){
    assert.equal(after.positions[id],id===String(hero)?1:pos);
  }
  for(const [id,value] of Object.entries(test.remaining)){
    assert.equal(after.remaining[id],value);
  }
}

setRuntime(makeRuntime(['a','b','c'],1.5,{a:7,b:8,c:9},{a:2,b:4,c:5}));
assert.equal(canonical(['a','b','c'],1.5),'');
assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),true);
let after=getRuntime();
assert.deepEqual(after.positions,{a:7,b:8,c:9});
assert.deepEqual(after.remaining,{a:2,b:4,c:5});

assert.ok(
  contract.invariants.some(x=>/DungeonRoomRuntime167822/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the Room Runtime active-hero delegation boundary'
);
assert.doesNotMatch(
  entry,
  /DungeonRoomRuntime167822|dungeon-room-runtime-167822/,
  'pure Dungeon entry must not absorb Room Runtime ownership'
);
assert.doesNotMatch(
  roomRuntime,
  /DungeonRoomRuntime167822=\{[^}]*activeHeroId/,
  'Room Runtime activeHeroId must remain private'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Room Runtime active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  privateConsumer:'DungeonRoomRuntime167822.activeHeroId',
  retainedPublicConsumer:'DungeonRoomRuntime167822.applyTemplateToCurrentRoom',
  expected:'RED before delegation, GREEN after Room Runtime-only micro-diff'
},null,2));
