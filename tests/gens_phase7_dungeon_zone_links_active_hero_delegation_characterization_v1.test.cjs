'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const zoneLinks=read('assets/dungeon/dungeon-zone-links-167846.js');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;
assert.doesNotMatch(zoneLinks,historical,
  'Zone Links must no longer own the historical private activeHero selector after delegation');
assert.equal(
  (zoneLinks.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Zone Links must consume the canonical helper exactly once after delegation'
);
assert.match(
  zoneLinks,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Zone Links activeHero must delegate only the pure selection'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
let active=true;
let graph={id:'world-1',nodes:[{id:'A',roomId:'room-a'},{id:'B',roomId:'room-b'}],edges:[],cacheBindings:[]};
const authored={
  active(){return active},
  graph(){return graph?JSON.parse(JSON.stringify(graph)):null},
  enterNode(){return true},
  syncActionButton(){return true}
};
const builder={
  findDungeon(){return graph},
  loadLibrary(){return graph?[graph]:[]},
  validation(){return {valid:true,errors:[],warnings:[]}},
  upsertDungeon(){return true}
};
const roomApi={
  findRoom(id){return {id,cells:[{object:'entry'}]}},
  loadLibrary(){return []}
};
const ctx={
  console,JSON,Math,Date,localStorage,
  setTimeout(){return 1},
  DungeonAuthoredRuntime167839:authored,
  DungeonWorldBuilder167821:builder,
  DungeonRoomCreator100:roomApi,
  DungeonCore01:{render(){return true}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(zoneLinks,ctx,{filename:'assets/dungeon/dungeon-zone-links-167846.js'});

const api=ctx.DungeonZoneLinks167846;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api,'Zone Links API must load');
assert.equal(typeof api.authoredContext,'function','authoredContext public API must remain exposed');
assert.equal(typeof canonical,'function','canonical active hero owner must exist');

function makeRuntime(participants,index,positions,extra={}){
  return {
    participants,index,positions,room:2,
    last:{
      authoredRuntime167839:true,
      worldDungeonId:'world-1',
      worldNodeId:'fallback-node'
    },
    authored167839:{
      roomNodes:{'2':'B'},
      heroNodes:{a:'A',b:'B',c:'A'}
    },
    ...extra
  };
}
function setRt(x){store.set(RT,JSON.stringify(x))}

function expectContext(participants,index,positions,expectedHero,expectedNode='B'){
  const x=makeRuntime(participants,index,positions);
  setRt(x);
  const expected=canonical(participants,index);
  assert.equal(expected,expectedHero);
  const out=api.authoredContext();
  assert.ok(out,'valid authored context must resolve');
  assert.equal(out.hero,expectedHero);
  assert.equal(out.currentNodeId,expectedNode);
  assert.equal(out.pos,Number(positions[expectedHero]));
  assert.equal(out.graph.id,'world-1');
  assert.equal(out.x.room,2);
}

expectContext(['a','b'],'1',{a:2,b:7},'b');
expectContext(['a','b'],-5,{a:4,b:7},'a');
expectContext(['a','b'],99,{a:4,b:8},'b');
expectContext(['a','b'],1.5,{a:4,b:9},'b');
expectContext([42],0,{'42':6},'42');

setRt(makeRuntime(['a','b','c'],1.5,{a:2,b:5,c:8}));
assert.equal(canonical(['a','b','c'],1.5),'');
assert.equal(api.authoredContext(),null,
  'in-range fractional selector must still resolve no hero and no authored context');

setRt(makeRuntime([],0,{}));
assert.equal(api.authoredContext(),null,'empty participant list must remain rejected');

setRt(makeRuntime('not-an-array',0,{}));
assert.equal(api.authoredContext(),null,'non-array participants must remain rejected');

setRt(makeRuntime([0,'b'],0,{'0':5,b:2}));
assert.equal(api.authoredContext(),null,'falsy selected participant must remain rejected');

active=false;
setRt(makeRuntime(['a'],0,{a:3}));
assert.equal(api.authoredContext(),null,'inactive authored runtime must remain rejected');
active=true;

setRt(makeRuntime(['a'],0,{a:3},{last:{worldDungeonId:'world-1',worldNodeId:'A'}}));
assert.equal(api.authoredContext(),null,'runtime without authored marker must remain rejected');

graph=null;
setRt(makeRuntime(['a'],0,{a:3}));
assert.equal(api.authoredContext(),null,'missing authored graph must remain rejected');

graph={id:'world-other',nodes:[],edges:[],cacheBindings:[]};
setRt(makeRuntime(['a'],0,{a:3}));
assert.equal(api.authoredContext(),null,'worldDungeonId mismatch must remain rejected');

console.log(JSON.stringify({
  scenario:'Phase 7 Zone Links active hero characterization',
  publicConsumer:'DungeonZoneLinks167846.authoredContext',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN after delegation with historical behavior preserved',
  deferred:[
    'DungeonWorldRuntime167823.activeHeroId',
    'DungeonRoomRuntime167822.activeHeroId',
    'DungeonLargeRoomSupport167834.activeHero',
    'Core317/Core318 activeHeroId',
    'DungeonSourceRenderStability167877 inline selection'
  ]
},null,2));
