'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const zoneLinks=read('assets/dungeon/dungeon-zone-links-167846.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (zoneLinks.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Zone Links must delegate the pure active-hero selection exactly once'
);
assert.match(
  zoneLinks,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Zone Links private activeHero must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  zoneLinks,
  /function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)/,
  'Zone Links must no longer own the historical active-hero selection algorithm'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
let graph={id:'world-1',nodes:[{id:'A',roomId:'room-a'},{id:'B',roomId:'room-b'}],edges:[],cacheBindings:[]};
const ctx={
  console,JSON,Math,Date,localStorage,
  setTimeout(){return 1},
  DungeonAuthoredRuntime167839:{
    active(){return true},
    graph(){return JSON.parse(JSON.stringify(graph))},
    enterNode(){return true},
    syncActionButton(){return true}
  },
  DungeonWorldBuilder167821:{
    findDungeon(){return graph},
    loadLibrary(){return [graph]},
    validation(){return {valid:true,errors:[],warnings:[]}},
    upsertDungeon(){return true}
  },
  DungeonRoomCreator100:{
    findRoom(id){return {id,cells:[{object:'entry'}]}},
    loadLibrary(){return []}
  },
  DungeonCore01:{render(){return true}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(zoneLinks,ctx,{filename:'assets/dungeon/dungeon-zone-links-167846.js'});

const api=ctx.DungeonZoneLinks167846;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.equal(typeof api?.authoredContext,'function');
assert.equal(typeof canonical,'function');

function setRt(x){store.set(RT,JSON.stringify(x))}
function makeRuntime(participants,index,positions){
  return {
    participants,index,positions,room:2,
    last:{authoredRuntime167839:true,worldDungeonId:'world-1',worldNodeId:'fallback-node'},
    authored167839:{roomNodes:{'2':'B'},heroNodes:{a:'A',b:'B',c:'A'}}
  };
}

for(const test of [
  {participants:['a','b'],index:undefined,positions:{a:3,b:7}},
  {participants:['a','b'],index:NaN,positions:{a:4,b:7}},
  {participants:['a','b'],index:'1',positions:{a:2,b:7}},
  {participants:['a','b'],index:-4,positions:{a:5,b:7}},
  {participants:['a','b'],index:99,positions:{a:4,b:8}},
  {participants:['a','b'],index:1.5,positions:{a:4,b:9}},
  {participants:[42],index:0,positions:{'42':6}}
]){
  setRt(makeRuntime(test.participants,test.index,test.positions));
  const out=api.authoredContext();
  const hero=canonical(test.participants,test.index);
  assert.ok(out);
  assert.equal(out.hero,hero);
  assert.equal(out.currentNodeId,'B');
  assert.equal(out.pos,Number(test.positions[hero]));
}

setRt(makeRuntime(['a','b','c'],1.5,{a:2,b:5,c:8}));
assert.equal(api.authoredContext(),null);

assert.ok(
  contract.invariants.some(x=>/DungeonZoneLinks167846/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the Zone Links active-hero delegation boundary'
);

assert.doesNotMatch(
  entry,
  /DungeonZoneLinks167846|dungeon-zone-links-167846/,
  'pure Dungeon entry must not absorb Zone Links runtime ownership'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Zone Links active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  privateConsumer:'DungeonZoneLinks167846.activeHero',
  retainedPublicConsumer:'DungeonZoneLinks167846.authoredContext',
  expected:'RED before delegation, GREEN after Zone Links-only micro-diff'
},null,2));
