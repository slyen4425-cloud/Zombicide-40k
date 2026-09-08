const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const statSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stat-reconcile-167902.js'),'utf8');
const importSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-backup-import-safe-167902.js'),'utf8');
const patcher=fs.readFileSync(path.join(root,'tools','patch_generic_stat_grid_v167890.py'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

// The V16.79.02 layer must reconcile the UI only: the single stat service remains authoritative.
assert.match(statSrc,/GensRpgStatService167901/);
assert.match(statSrc,/GensGenericStats167887/);
assert.match(statSrc,/renderLinksEditor/,'derived characteristic rules must be restored in the editor');
assert.match(statSrc,/gss902RecoveredCard/,'missing authored stat must have a real hero-sheet fallback');
assert.doesNotMatch(statSrc,/const\s+CORE\s*=\s*\[/,'UI bridge must not create another core-stat registry');
assert.match(patcher,/gens-rpg-stat-reconcile-167902\.js\?v=167902/);
assert.match(patcher,/gens-backup-import-safe-167902\.js\?v=167902/);
assert.match(sw,/gensrpg-cache-16\.79\.02-stat-rules-import-safety/);
assert.match(sw,/gens-rpg-stat-reconcile-167902\.js/);
assert.match(sw,/gens-backup-import-safe-167902\.js/);

// Safe import helpers can be tested without a browser DOM.
const ctx={console,Math,Date,Promise,setTimeout,CHARS:{
 dungeon_aldren:{name:'Aldren',image:'idbasset:missing'},
 dungeon_lyra:{name:'Lyra',image:'assets/dungeon/creatures/dng_lyra.png'}
}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(importSrc,ctx,{filename:'gens-backup-import-safe-167902.js'});
const api=ctx.GensSafeBackupImport167902;assert.ok(api,'safe import API missing');
const localHeroes=JSON.stringify([
 {id:'z_local',name:'Survivant local',gameMode:'zombicide',hp:5},
 {id:'r_local',name:'Mage local',gameMode:'dungeon',hp:9}
]);
const incomingHeroes=JSON.stringify([
 {id:'z_local',name:'Ancien nom',gameMode:'zombicide',armor:2},
 {id:'z_old',name:'Survivant sauvegardé',gameMode:'zombicide'},
 {id:'r_old',name:'Guerrier sauvegardé',gameMode:'dungeon'}
]);
let merged=JSON.parse(api.mergeHeroes(localHeroes,incomingHeroes,new Set(['zheroes']),'merge'));
assert.ok(merged.some(h=>h.id==='z_old'),'missing Zombicide hero must be recovered');
assert.ok(!merged.some(h=>h.id==='r_old'),'unselected RPG hero must not be imported');
assert.equal(merged.find(h=>h.id==='z_local').name,'Survivant local','local hero must win on conflict');
assert.equal(merged.find(h=>h.id==='z_local').armor,2,'missing local fields may be recovered from backup');
assert.ok(merged.some(h=>h.id==='r_local'),'existing RPG hero must never be removed by Zombicide import');
merged=JSON.parse(api.mergeHeroes(localHeroes,incomingHeroes,new Set(['zheroes']),'replace'));
assert.ok(merged.some(h=>h.id==='r_local'),'replace Zombicide must still preserve RPG heroes');
assert.ok(merged.some(h=>h.id==='z_old'));
assert.ok(!merged.some(h=>h.id==='r_old'));

const localWorld=JSON.stringify({worlds:[{id:'new_world',name:'Donjon actuel'}],settings:{quality:'high'}});
const oldWorld=JSON.stringify({worlds:[{id:'old_world',name:'Ancien donjon'}],settings:{music:true}});
const worldMerge=JSON.parse(api.stringifyMerged(localWorld,oldWorld));
assert.ok(worldMerge.worlds.some(x=>x.id==='new_world'),'current Dungeon world must survive merge import');
assert.ok(worldMerge.worlds.some(x=>x.id==='old_world'),'backup Dungeon world may be added during merge');
assert.equal(worldMerge.settings.quality,'high');assert.equal(worldMerge.settings.music,true);
assert.equal(api.categoryForKey('gensrpg_dungeon_custom_rooms_v1'),'dungeon');
assert.equal(api.categoryForKey('gensrpg_dungeon_talent_sets_v1'),'talents');
assert.equal(api.categoryForKey('z40k_skill_library_v2'),'skills');
assert.doesNotMatch(importSrc,/gensrpgRawRemoveRestorableKeys\s*\(/,'safe import must never globally wipe restorable keys');
api.aldrenFallback();
assert.equal(ctx.CHARS.dungeon_aldren.image,'assets/dungeon/creatures/dng_aldren.png','Aldren must fall back to repository art when an imported IndexedDB reference is unavailable');
console.log('GenSrpG V16.79.02: stat rules/sheet + selective merge import + Aldren fallback OK');
