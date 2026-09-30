'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const roomRuntime=read('assets/dungeon/dungeon-room-runtime-167822.js');

const historical=/function activeHeroId\(x\)\{const list=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,list\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(list\[i\]\|\|""\)\}/;
assert.match(
  roomRuntime,
  historical,
  'Room Runtime must still own the historical private activeHeroId selector before delegation'
);
assert.equal(
  (roomRuntime.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  0,
  'Room Runtime must not consume the canonical helper before the delegation RED'
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

let spatialEnsure=0,spatialPersist=0;
const ctx={
  console,JSON,Math,Date,localStorage,
  setTimeout(){return 1},
  activeDungeonAdventureId(){return 'adv-room-runtime'},
  DungeonRoomCreator100:{
    loadLibrary(){return [JSON.parse(JSON.stringify(forcedRoom))]},
    validateRoom(){return {valid:true}}
  },
  DungeonSpatial313:{
    ensure(){spatialEnsure++},
    persist(){spatialPersist++}
  }
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(roomRuntime,ctx,{filename:'assets/dungeon/dungeon-room-runtime-167822.js'});

const api=ctx.DungeonRoomRuntime167822;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api,'Room Runtime API must load');
assert.equal(typeof api.applyTemplateToCurrentRoom,'function');
assert.equal(typeof canonical,'function','canonical Dungeon active hero owner must exist');

store.set(CFG,JSON.stringify({
  'adv-room-runtime':{enabled:true,chance:100,roomIds:['room-forced']}
}));

function makeRuntime(participants,index,positions,remaining,extra={}){
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
    },
    ...extra
  };
}

function setRuntime(x){store.set(RT,JSON.stringify(x))}
function getRuntime(){return JSON.parse(store.get(RT))}

function expectSelectedHero(participants,index,positions,remaining,expectedHero){
  spatialEnsure=0;spatialPersist=0;
  const before=makeRuntime(participants,index,positions,remaining);
  setRuntime(before);
  assert.equal(canonical(participants,index),expectedHero);
  assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),true);
  const after=getRuntime();
  assert.equal(after.last.customRoomRuntime167822,true);
  assert.equal(after.last.customRoomId,'room-forced');
  assert.equal(after.last.map.entryIdx,1);
  for(const [id,pos] of Object.entries(positions||{})){
    assert.equal(
      after.positions[id],
      id===String(expectedHero)?1:pos,
      'only the historically selected hero may be moved to the custom entry'
    );
  }
  for(const [id,value] of Object.entries(remaining||{})){
    assert.equal(
      after.remaining[id],
      value,
      'remaining movement values must remain unchanged'
    );
  }
  assert.equal(spatialEnsure,1);
  assert.equal(spatialPersist,1);
}

expectSelectedHero(['a','b'],'1',{a:7,b:8},{a:2,b:4},'b');
expectSelectedHero(['a','b'],-4,{a:7,b:8},{a:2,b:4},'a');
expectSelectedHero(['a','b'],99,{a:7,b:8},{a:2,b:4},'b');
expectSelectedHero(['a','b'],1.5,{a:7,b:8},{a:2,b:4},'b');
expectSelectedHero([42],0,{'42':8},{'42':6},'42');

spatialEnsure=0;spatialPersist=0;
setRuntime(makeRuntime(['a','b','c'],1.5,{a:7,b:8,c:9},{a:2,b:4,c:5}));
assert.equal(canonical(['a','b','c'],1.5),'');
assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),true);
let after=getRuntime();
assert.deepEqual(after.positions,{a:7,b:8,c:9},
  'in-range fractional selector must still move no hero');
assert.deepEqual(after.remaining,{a:2,b:4,c:5},
  'in-range fractional selector must restore no hero movement');
assert.equal(spatialEnsure,1);
assert.equal(spatialPersist,1);

setRuntime(makeRuntime('not-an-array',0,{a:7},{a:2}));
assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),true);
after=getRuntime();
assert.deepEqual(after.positions,{a:7},
  'non-array participants must select no hero');

setRuntime(makeRuntime([0,'b'],0,{'0':7,b:8},{'0':2,b:4}));
assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),true);
after=getRuntime();
assert.deepEqual(after.positions,{'0':7,b:8},
  'falsy selected participant must move no hero');

const branchRuntime=makeRuntime(['a'],0,{a:7},{a:2},{branch:{active:true}});
setRuntime(branchRuntime);
assert.equal(api.applyTemplateToCurrentRoom(forcedRoom),false,
  'active secondary branch guard must remain authoritative');
assert.equal(getRuntime().positions.a,7);

const alreadyCustom=makeRuntime(['a'],0,{a:7},{a:2});
alreadyCustom.last.customRoomRuntime167822=true;
setRuntime(alreadyCustom);
assert.equal(api.applyTemplateToCurrentRoom(),false,
  'existing custom room must not be replaced without forceRoom');

const existingTransition=makeRuntime(['a'],0,{a:7},{a:2});
existingTransition.dc313LastTransition={heroId:'a',from:1,to:2,created:false};
setRuntime(existingTransition);
assert.equal(api.applyTemplateToCurrentRoom(),false,
  'non-created transition must not generate a custom room');

console.log(JSON.stringify({
  scenario:'Phase 7 Room Runtime active hero delegation characterization',
  consumer:'DungeonRoomRuntime167822.applyTemplateToCurrentRoom',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN before delegation with historical private selector preserved',
  deferred:[
    'DungeonWorldRuntime167823.activeHeroId',
    'DungeonLargeRoomSupport167834.activeHero',
    'Core317/Core318 activeHeroId',
    'DungeonSourceRenderStability167877 inline selection'
  ]
},null,2));
