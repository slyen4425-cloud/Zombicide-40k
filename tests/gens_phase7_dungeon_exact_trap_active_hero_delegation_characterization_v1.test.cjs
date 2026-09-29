'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const exactTrap=read('assets/dungeon/dungeon-exact-trap-runtime-167845.js');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;
assert.match(
  exactTrap,
  historical,
  'Exact Trap must still expose the historical private selector before the delegation RED'
);
assert.equal(
  (exactTrap.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  0,
  'Exact Trap must not consume the canonical helper before the delegation lot'
);

const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
let resolved=[];
const ctx={
  console,JSON,Math,Date,localStorage,
  setTimeout(){return 1},
  loadDungeonSceneElements(){return []},
  saveDungeonSceneElements(){return true},
  dungeonTrapTypes(){return {rune:{id:'rune',name:'Rune instable'}}},
  dungeonResolveTrapAgainstHero(id,hero,show){resolved.push({id,hero,show});return {ok:true}},
  DungeonSpatial313:{ensure(){},persist(){}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(exactTrap,ctx,{filename:'assets/dungeon/dungeon-exact-trap-runtime-167845.js'});

const api=ctx.DungeonExactTrapRuntime167845;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api,'Exact Trap API must load');
assert.equal(typeof api.triggerAtHero,'function','Exact Trap triggerAtHero must remain public');
assert.equal(typeof canonical,'function','canonical Dungeon active-hero owner must exist');

function runtime(participants,index,positions,overrides={}){
  return {
    participants,index,positions,room:1,
    last:{
      authoredRuntime167839:true,
      worldRuntime167823:true,
      worldDungeonId:'world-exact-trap',
      worldNodeId:'node-A',
      map:{cells:['entry','floor','floor','floor','floor','floor','floor']},
      worldZoneContent167824:{
        mode:'fixed',
        traps:[{id:'trap-rune',cell:5,trapType:'reference',refId:'rune',label:'Rune instable'}]
      }
    },
    ...overrides
  };
}

function expectTrigger(participants,index,positions,expectedHero){
  resolved=[];
  const x=runtime(participants,index,positions);
  const expected=canonical(participants,index);
  assert.equal(expected,expectedHero);
  assert.equal(api.triggerAtHero(x),true,'matching canonical active hero must trigger the exact trap');
  assert.deepEqual(
    resolved,
    [{id:'rune',hero:expectedHero,show:true}],
    'Exact Trap must resolve against the historically selected active hero'
  );
  assert.equal(
    x.worldContentState167824['world-exact-trap']['node-A'].triggeredTraps['trap-rune'],
    true,
    'exact trap consumed state must remain owned by Exact Trap'
  );
}

expectTrigger(['a','b'],'1',{a:2,b:5},'b');
expectTrigger(['a','b'],-4,{a:5,b:2},'a');
expectTrigger(['a','b'],99,{a:2,b:5},'b');
expectTrigger(['a','b'],1.5,{a:2,b:5},'b');
expectTrigger([42],0,{'42':5},'42');

resolved=[];
const fractional=runtime(['a','b','c'],1.5,{a:2,b:5,c:5});
assert.equal(canonical(fractional.participants,fractional.index),'');
assert.equal(api.triggerAtHero(fractional),false,
  'in-range fractional active index must still select no hero and trigger no trap');
assert.deepEqual(resolved,[]);

resolved=[];
const nonArray=runtime('not-an-array',0,{});
assert.equal(api.triggerAtHero(nonArray),false);
assert.deepEqual(resolved,[]);

resolved=[];
const falsyHero=runtime([0,'b'],0,{'0':5,b:2});
assert.equal(api.triggerAtHero(falsyHero),false);
assert.deepEqual(resolved,[]);

resolved=[];
const nonAuthored=runtime(['a'],0,{a:5});
delete nonAuthored.last.authoredRuntime167839;
assert.equal(api.triggerAtHero(nonAuthored),false,
  'non-authored runtime must remain rejected');
assert.deepEqual(resolved,[]);

resolved=[];
const alreadyTriggered=runtime(['a'],0,{a:5});
alreadyTriggered.worldContentState167824={
  'world-exact-trap':{
    'node-A':{
      openedChests:{},pickedItems:{},triggeredTraps:{'trap-rune':true},solvedPuzzles:{},talkedNpcs:{}
    }
  }
};
assert.equal(api.triggerAtHero(alreadyTriggered),false,
  'already consumed exact trap must not retrigger');
assert.deepEqual(resolved,[]);

console.log(JSON.stringify({
  scenario:'Phase 7 Exact Trap active hero characterization',
  consumer:'DungeonExactTrapRuntime167845.triggerAtHero',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN before delegation with historical private selector preserved',
  deferred:[
    'DungeonZoneLinks167846.activeHero',
    'DungeonWorldRuntime167823.activeHeroId',
    'DungeonRoomRuntime167822.activeHeroId',
    'DungeonLargeRoomSupport167834.activeHero',
    'Core317/Core318 activeHeroId',
    'DungeonSourceRenderStability167877 inline selection'
  ]
},null,2));
