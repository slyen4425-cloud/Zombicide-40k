const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js');
const src=fs.readFileSync(file,'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src),'equipment cleanup syntax');
assert.match(src,/APP_VERSION="16\.78\.102(?:\.1)?"/);
assert.match(src,/deuiEquipmentEditorStats167817/,'legacy fixed RPG equipment block must be hidden');
assert.match(src,/eqBonusKind/,'legacy single-stat selector must be hidden');
assert.match(src,/eqEvo"\+lv\+"Force/,'legacy evolution Force field must be hidden, while combat dice/result stay intact');
assert.match(src,/runtimeDefs/,'set/evolution choices must come from active canonical stats');
assert.match(src,/rpgBonuses/,'evolution bonuses must persist through canonical rpgBonuses');
assert.match(src,/dungeonEquipmentBonus/,'runtime equipment bonus must include unlocked evolution stat bonuses');
assert.match(src,/gensrpg_dungeon_set_overrides_v1/,'existing set storage must be preserved');
assert.match(src,/dseAddThreshold/,'canonical set editor must own add-threshold action');
assert.match(src,/dseRemoveThreshold/,'canonical set editor must own remove-threshold action');
assert.match(src,/renderSetThresholds/,'set threshold edits must be re-rendered from canonical data without dropping custom stats');
assert.match(bridge,/gens-equipment-stat-cleanup-1678102\.js\?v=1678102/,'always-loaded bridge must load equipment cleanup');
assert.match(sw,/gensrpg-cache-16\.78\.102-equipment-stat-cleanup/);
assert.match(sw,/gens-equipment-stat-cleanup-1678102\.js/);
const sandbox={console,globalThis:null};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(src,sandbox);
const api=sandbox.GensEquipmentStatCleanup1678102;
assert.ok(api,'cleanup API exported');
const item={evolution:{enabled:true,levels:[
 {level:2,xp:10,rpgBonuses:{force:2,necromancie:1}},
 {level:3,xp:20,rpgBonuses:{force:3,necromancie:4}}
]}};
assert.equal(api.evolutionBonusForItem(item,'force',9),0);
assert.equal(api.evolutionBonusForItem(item,'force',10),2);
assert.equal(api.evolutionBonusForItem(item,'force',25),5);
assert.equal(api.evolutionBonusForItem(item,'necromancie',25),5,'custom active stat can accumulate through equipment evolution');
console.log('V16.78.102 equipment cleanup: canonical set/evolution stat bridge OK');
