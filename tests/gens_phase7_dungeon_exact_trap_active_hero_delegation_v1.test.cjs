'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const exactTrap=read('assets/dungeon/dungeon-exact-trap-runtime-167845.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (exactTrap.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Exact Trap must delegate the pure active-hero selection exactly once'
);
assert.match(
  exactTrap,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Exact Trap private activeHero must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  exactTrap,
  /function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)/,
  'Exact Trap must no longer own the historical active-hero selection algorithm'
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
assert.ok(api);
assert.equal(typeof api.triggerAtHero,'function');
assert.equal(api.activeHero,undefined,'Exact Trap activeHero must remain private');

const x={
  participants:['a','b'],index:'1',positions:{a:2,b:5},room:1,
  last:{
    authoredRuntime167839:true,
    worldRuntime167823:true,
    worldDungeonId:'world-exact-trap',
    worldNodeId:'node-A',
    map:{cells:['entry','floor','floor','floor','floor','floor']},
    worldZoneContent167824:{
      mode:'fixed',
      traps:[{id:'trap-rune',cell:5,trapType:'reference',refId:'rune',label:'Rune instable'}]
    }
  }
};
assert.equal(api.triggerAtHero(x),true);
assert.deepEqual(resolved,[{id:'rune',hero:'b',show:true}]);

assert.ok(
  contract.invariants.some(x=>/DungeonExactTrapRuntime167845/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the Exact Trap active-hero delegation boundary'
);

assert.doesNotMatch(
  entry,
  /DungeonExactTrapRuntime167845|dungeon-exact-trap-runtime-167845/,
  'pure Dungeon entry must not absorb Exact Trap runtime ownership'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Exact Trap active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  consumer:'DungeonExactTrapRuntime167845.triggerAtHero',
  expected:'RED before delegation, GREEN after Exact-Trap-only micro-diff'
},null,2));
