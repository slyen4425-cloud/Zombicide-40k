'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const corePath=path.join(root,'assets','gensrpg','core','equipment-bonus-persistence-v1.js');

assert.equal(
  fs.existsSync(corePath),
  true,
  'Core Equipment bonus persistence contract module must exist'
);

const source=fs.readFileSync(corePath,'utf8');
assert.equal(
  /document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|saveEquipmentEditor|loadCustomEquipment|saveCustomEquipment|loadDungeonItemOverrides|saveDungeonItemOverrides/.test(source),
  false,
  'pure Equipment bonus persistence Core must not depend on DOM, storage, timers or runtime seams'
);

const ctx={console,Object,Array,String,Number,Set,globalThis:null};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'equipment-bonus-persistence-v1.js'});
const api=ctx.GensEquipmentBonusPersistenceV1;
assert.ok(api,'GensEquipmentBonusPersistenceV1 export missing');

const custom=[
  {id:'a',name:'A',rpgBonuses:{force:1},setId:'set_a'},
  {id:'b',name:'B',rpgBonuses:{armor:2}}
];
const customBefore=JSON.stringify(custom);
const customResult=api.applyCustom(custom,'a',{force:7,armor:3});

assert.equal(customResult.found,true);
assert.deepEqual(JSON.parse(JSON.stringify(customResult.items)),[
  {id:'a',name:'A',rpgBonuses:{force:7,armor:3},setId:'set_a'},
  {id:'b',name:'B',rpgBonuses:{armor:2}}
]);
assert.equal(JSON.stringify(custom),customBefore,'custom source list must remain immutable');
assert.notEqual(customResult.items,custom);
assert.notEqual(customResult.items[0],custom[0]);
assert.notEqual(customResult.items[0].rpgBonuses,custom[0].rpgBonuses);

const missingCustom=api.applyCustom(custom,'missing',{force:9});
assert.equal(missingCustom.found,false);
assert.deepEqual(JSON.parse(JSON.stringify(missingCustom.items)),custom);

const overrides={
  builtin_a:{setId:'set_a',setPieceId:'head',rpgBonuses:{force:2},other:'keep'},
  untouched:{rpgBonuses:{armor:1}}
};
const overridesBefore=JSON.stringify(overrides);
const builtinResult=api.applyBuiltin(overrides,'builtin_a',{force:9});

assert.equal(builtinResult.found,true);
assert.deepEqual(JSON.parse(JSON.stringify(builtinResult.overrides)),{
  builtin_a:{setId:'set_a',setPieceId:'head',rpgBonuses:{force:9},other:'keep'},
  untouched:{rpgBonuses:{armor:1}}
});
assert.equal(JSON.stringify(overrides),overridesBefore,'builtin override source must remain immutable');
assert.notEqual(builtinResult.overrides,overrides);
assert.notEqual(builtinResult.overrides.builtin_a,overrides.builtin_a);

const newBuiltin=api.applyBuiltin(overrides,'builtin_new',{esprit:4});
assert.equal(newBuiltin.found,true,'builtin override target may be created from an explicit builtin id');
assert.deepEqual(JSON.parse(JSON.stringify(newBuiltin.overrides.builtin_new)),{rpgBonuses:{esprit:4}});

const invalidCustom=api.applyCustom(custom,'',null);
assert.equal(invalidCustom.found,false);
const invalidBuiltin=api.applyBuiltin(overrides,'',null);
assert.equal(invalidBuiltin.found,false);

const routedCustom=api.apply({
  kind:'custom',
  id:'b',
  bonuses:{armor:8},
  customItems:custom,
  overrides
});
assert.equal(routedCustom.kind,'custom');
assert.equal(routedCustom.found,true);
assert.equal(routedCustom.customItems[1].rpgBonuses.armor,8);
assert.deepEqual(JSON.parse(JSON.stringify(routedCustom.overrides)),overrides);

const routedBuiltin=api.apply({
  kind:'builtin',
  id:'builtin_a',
  bonuses:{force:11},
  customItems:custom,
  overrides
});
assert.equal(routedBuiltin.kind,'builtin');
assert.equal(routedBuiltin.found,true);
assert.equal(routedBuiltin.overrides.builtin_a.rpgBonuses.force,11);
assert.deepEqual(JSON.parse(JSON.stringify(routedBuiltin.customItems)),custom);

const routedUnknown=api.apply({kind:'other',id:'a',bonuses:{force:99},customItems:custom,overrides});
assert.equal(routedUnknown.found,false);
assert.equal(routedUnknown.kind,'other');
assert.deepEqual(JSON.parse(JSON.stringify(routedUnknown.customItems)),custom);
assert.deepEqual(JSON.parse(JSON.stringify(routedUnknown.overrides)),overrides);

console.log(JSON.stringify({
  scenario:'Phase 4 pure Equipment bonus persistence contract',
  customImmutable:true,
  builtinImmutable:true,
  canonicalSnapshotReplace:true,
  preserveUnrelatedFields:true,
  explicitTargetRouting:true,
  runtimeChanged:false
},null,2));
