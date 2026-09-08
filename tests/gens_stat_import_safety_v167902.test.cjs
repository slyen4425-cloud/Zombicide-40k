const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const statSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stat-reconcile-167902.js'),'utf8');
const importSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-backup-import-safe-167902.js'),'utf8');
const patcher=fs.readFileSync(path.join(root,'tools','patch_generic_stat_grid_v167890.py'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

// V16.79.03 must keep one stat engine but protect the real mobile DOM from later legacy repaints.
assert.match(statSrc,/GensRpgStatService167901/);
assert.match(statSrc,/APP_VERSION="16\.79\.03"/);
assert.match(statSrc,/MutationObserver/,'real sheet/editor DOM must be observed');
assert.match(statSrc,/gss903PointsBanner/,'remaining stat points must be visible on the real hero sheet');
assert.match(statSrc,/data-dtab='stats'/,'opening the mobile STATS tab must force reconciliation');
assert.match(statSrc,/Effets \/ influences/,'derived characteristic rules must be clearly exposed in the editor');
assert.match(statSrc,/10 Force = \+1 Dégâts physiques/,'editor must explain step-based derived rules');
assert.match(statSrc,/dng_aldren\.png/,'Aldren repository art must be part of the same recovery path');
assert.doesNotMatch(statSrc,/const\s+CORE\s*=\s*\[/,'UI reconciliation must not create another stat registry');
assert.match(patcher,/gens-rpg-stat-reconcile-167902\.js\?v=167902/);
assert.match(patcher,/gens-backup-import-safe-167902\.js\?v=167902/);
assert.match(sw,/gensrpg-cache-16\.79\.03-mobile-stat-art/);
assert.match(sw,/gens-rpg-stat-reconcile-167902\.js/);

// Generated SVG portraits of built-in heroes are obsolete and must resolve to repository PNGs.
const artCtx={console,Math,Date,Promise,setTimeout,CHARS:{
 dungeon_aldren:{name:'Aldren',image:'data:image/svg+xml;charset=utf-8,%3Csvg%3E',avatar:''},
 dungeon_lyra:{name:'Lyra',image:'assets/dungeon/creatures/dng_lyra.png'}
}};
artCtx.window=artCtx;artCtx.globalThis=artCtx;
vm.createContext(artCtx);vm.runInContext(statSrc,artCtx,{filename:'gens-rpg-stat-reconcile-167902.js'});
const statApi=artCtx.GensRpgStatReconcile167902;assert.ok(statApi,'mobile stat reconciliation API missing');
statApi.repairHeroData();
assert.equal(artCtx.CHARS.dungeon_aldren.image,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(artCtx.CHARS.dungeon_aldren.avatar,'assets/dungeon/creatures/dng_aldren.png');

// Safe import helpers remain merge-safe across modes.
const ctx={console,Math,Date,Promise,setTimeout,CHARS:{
 dungeon_aldren:{name:'Aldren',image:'idbasset:missing'},
 dungeon_lyra:{name:'Lyra',image:'assets/dungeon/creatures/dng_lyra.png'}
}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(importSrc,ctx,{filename:'gens-backup-import-safe-167902.js'});
const api=ctx.GensSafeBackupImport167902;assert.ok(api,'safe import API missing');
const localHeroes=JSON.stringify([{id:'z_local',name:'Survivant local',gameMode:'zombicide',hp:5},{id:'r_local',name:'Mage local',gameMode:'dungeon',hp:9}]);
const incomingHeroes=JSON.stringify([{id:'z_local',name:'Ancien nom',gameMode:'zombicide',armor:2},{id:'z_old',name:'Survivant sauvegardé',gameMode:'zombicide'},{id:'r_old',name:'Guerrier sauvegardé',gameMode:'dungeon'}]);
let merged=JSON.parse(api.mergeHeroes(localHeroes,incomingHeroes,new Set(['zheroes']),'merge'));
assert.ok(merged.some(h=>h.id==='z_old'));assert.ok(!merged.some(h=>h.id==='r_old'));assert.equal(merged.find(h=>h.id==='z_local').name,'Survivant local');assert.ok(merged.some(h=>h.id==='r_local'));
merged=JSON.parse(api.mergeHeroes(localHeroes,incomingHeroes,new Set(['zheroes']),'replace'));
assert.ok(merged.some(h=>h.id==='r_local'));assert.ok(merged.some(h=>h.id==='z_old'));assert.ok(!merged.some(h=>h.id==='r_old'));
const localWorld=JSON.stringify({worlds:[{id:'new_world',name:'Donjon actuel'}],settings:{quality:'high'}}),oldWorld=JSON.stringify({worlds:[{id:'old_world',name:'Ancien donjon'}],settings:{music:true}}),worldMerge=JSON.parse(api.stringifyMerged(localWorld,oldWorld));
assert.ok(worldMerge.worlds.some(x=>x.id==='new_world'));assert.ok(worldMerge.worlds.some(x=>x.id==='old_world'));assert.equal(worldMerge.settings.quality,'high');assert.equal(worldMerge.settings.music,true);
assert.doesNotMatch(importSrc,/gensrpgRawRemoveRestorableKeys\s*\(/);
console.log('GenSrpG V16.79.03: real mobile stat sheet/editor + Aldren art + safe import guard OK');
