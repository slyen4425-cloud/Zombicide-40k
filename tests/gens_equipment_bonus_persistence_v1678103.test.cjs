const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-equipment-bonus-persistence-1678103.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.103 equipment persistence syntax');
assert.match(src,/APP_VERSION="16\.78\.103"/);
assert.match(src,/loadDungeonItemOverrides/,'built-in Dungeon items must persist through item overrides');
assert.match(src,/saveCustomEquipment/,'custom equipment must persist through custom equipment storage');
assert.match(src,/equipmentSummary/,'weapon summary must expose canonical bonuses');
assert.match(src,/equipmentCardStatsHtml/,'weapon card description must expose canonical bonuses');
assert.match(bridge,/gens-equipment-bonus-persistence-1678103\.js\?v=1678103/,'runtime bridge must load V16.78.103 persistence fix');
assert.match(sw,/gensrpg-cache-16\.78\.103-equipment-bonus-persistence/);
assert.match(sw,/gens-equipment-bonus-persistence-1678103\.js/);
let custom=[{id:'custom_sword',name:'Épée custom',rpgBonuses:{}}];
let overrides={};
const dungeon=[{id:'dng_sword',name:'Épée Dungeon',rpgBonuses:{}}];
const ctx={console,Math,JSON,setTimeout:()=>0,globalThis:null,
 GensCleanRpgStats167874:{defs:()=>[{id:'force',name:'Force',icon:'💪'},{id:'necromancie',name:'Nécromancie',icon:'☠️'}],runtimeDefs:()=>[{id:'force',name:'Force',icon:'💪'},{id:'necromancie',name:'Nécromancie',icon:'☠️'}],def:id=>({force:{id:'force'},necromancie:{id:'necromancie'}}[id]||null)},
 loadCustomEquipment:()=>custom,saveCustomEquipment:list=>{custom=JSON.parse(JSON.stringify(list))},refreshCustomEquipmentIntoItems:()=>{},
 dungeonItems:()=>dungeon,ITEMS:dungeon,
 loadDungeonItemOverrides:()=>overrides,saveDungeonItemOverrides:o=>{overrides=JSON.parse(JSON.stringify(o))},ensureDungeonItems:()=>{}
};ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-equipment-bonus-persistence-1678103.js'});
const api=ctx.GensEquipmentBonusPersistence1678103;assert.ok(api);
let r=api.persistBonuses('custom_sword',{force:3,necromancie:2});
assert.equal(r.ok,true);assert.equal(r.kind,'custom');assert.equal(JSON.stringify(custom[0].rpgBonuses),JSON.stringify({force:3,necromancie:2}));
r=api.persistBonuses('dng_sword',{force:4});
assert.equal(r.ok,true);assert.equal(r.kind,'override');assert.equal(JSON.stringify(overrides.dng_sword.rpgBonuses),JSON.stringify({force:4}));
assert.match(api.bonusSummary({rpgBonuses:{force:2,necromancie:1}}),/\+2 .*Force/);
assert.match(api.bonusSummary({rpgBonuses:{force:2,necromancie:1}}),/\+1 .*Nécromancie/);
console.log('V16.78.103 equipment bonus persistence: custom + built-in save + weapon description OK');
