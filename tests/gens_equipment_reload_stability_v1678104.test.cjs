const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-equipment-bonus-persistence-1678103.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.104 equipment persistence syntax');
assert.match(src,/APP_VERSION="16\.78\.104"/);
assert.match(src,/gensrpg_equipment_rpg_bonuses_v2/,'dedicated authoritative equipment bonus store required');
assert.match(src,/patchDataSources/,'legacy loaders/savers must be hydrated from canonical bonus store');
assert.match(src,/hydrateList/,'equipment lists must be rehydrated on reopen');
assert.match(bridge,/gens-equipment-bonus-persistence-1678103\.js\?v=1678104/,'bridge must force fresh V16.78.104 script');
assert.match(sw,/gensrpg-cache-16\.78\.104-equipment-reload-stability/);

let custom=[{id:'custom_sword',name:'Épée custom'}];
const builtins=[{id:'dng_sword',name:'Épée Dungeon'}];
let overrides={};
const storage={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null,setItem:(k,v)=>{storage[k]=String(v)}};
const defs=[{id:'force',name:'Force',icon:'💪'},{id:'necromancie',name:'Nécromancie',icon:'☠️'}];
const ctx={console,Math,JSON,setTimeout:()=>0,localStorage,globalThis:null,
 GensCleanRpgStats167874:{defs:()=>defs,runtimeDefs:()=>defs,def:id=>defs.find(d=>d.id===id)||null},
 loadCustomEquipment:()=>JSON.parse(JSON.stringify(custom)),
 saveCustomEquipment:list=>{custom=JSON.parse(JSON.stringify(list))},
 dungeonItems:()=>JSON.parse(JSON.stringify(builtins)),ITEMS:JSON.parse(JSON.stringify(builtins)),
 loadDungeonItemOverrides:()=>JSON.parse(JSON.stringify(overrides)),saveDungeonItemOverrides:o=>{overrides=JSON.parse(JSON.stringify(o))},
 refreshCustomEquipmentIntoItems:()=>{},ensureDungeonItems:()=>{}
};
ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-equipment-bonus-persistence-1678103.js'});
const api=ctx.GensEquipmentBonusPersistence1678103;assert.ok(api);

// Exact regression: choose a new stat, save, legacy editor reconstructs item without rpgBonuses, reopen must still restore it.
api.remember('custom_sword',{necromancie:4,force:2});
ctx.saveCustomEquipment([{id:'custom_sword',name:'Épée custom reconstruite'}]);
assert.equal(custom[0].rpgBonuses.necromancie,4,'legacy save must not erase custom stat bonus');
assert.equal(custom[0].rpgBonuses.force,2);
const reopened=ctx.loadCustomEquipment()[0];
assert.equal(reopened.rpgBonuses.necromancie,4,'reopen must rehydrate custom stat');
assert.equal(reopened.rpgBonuses.force,2);

// Even a source object rebuilt without bonuses must be hydrated on read.
custom=[{id:'custom_sword',name:'Épée custom sans champ bonus'}];
const reopenedAfterDestructiveRebuild=ctx.loadCustomEquipment()[0];
assert.equal(reopenedAfterDestructiveRebuild.rpgBonuses.necromancie,4,'authoritative store survives destructive legacy reconstruction');

// Built-in Dungeon item follows the same reopen rule and native override persistence.
api.remember('dng_sword',{necromancie:3});
assert.equal(ctx.dungeonItems()[0].rpgBonuses.necromancie,3,'built-in item read must hydrate canonical bonus');
const result=api.persistNative('dng_sword',{necromancie:5});
assert.equal(result.ok,true);
assert.equal(overrides.dng_sword.rpgBonuses.necromancie,5,'built-in item override must persist canonical bonus');
assert.equal(ctx.dungeonItems()[0].rpgBonuses.necromancie,5,'built-in item reopen must return latest bonus');
assert.match(api.bonusSummary({id:'dng_sword',rpgBonuses:{necromancie:5}}),/\+5 .*Nécromancie/,'description must show custom stat bonus');
console.log('V16.78.104 equipment reload stability: add -> save -> legacy rebuild -> reopen -> bonus retained');
