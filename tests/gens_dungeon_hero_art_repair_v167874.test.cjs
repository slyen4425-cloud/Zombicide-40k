const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.doesNotMatch(src,/GensRpgStatService|GensCleanRpgStats|dungeonAttributeValue|changeDungeonAttribute/,'hero art repair must stay independent from statistics');
assert.match(src,/dng_aldren\.png/);
assert.match(src,/dng_lyra\.png/);
assert.match(src,/dng_brom\.png/);
assert.match(src,/dungeon-authored-final-exit-167875\.js\?v=167879/);
assert.match(src,/dungeon-authored-event-cells-167877\.js\?v=167879/);
assert.match(src,/dungeon-event-runtime-fix-167878\.js\?v=167879/);
const custom='data:image/png;base64,CUSTOM';
const chars={
 dungeon_aldren:{image:custom,avatar:custom},
 dungeon_lyra:{image:'assets/dungeon/creatures/dng_lyra.png',avatar:''},
 dungeon_brom:{image:'',avatar:''}
};
const ctx={console,setTimeout,clearTimeout,requestAnimationFrame:f=>f(),CHARS:chars,current:'dungeon_aldren'};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-dungeon-hero-art-repair-167874.js'});
const api=ctx.GensDungeonHeroArtRepair167874;assert.ok(api);
assert.equal(api.repairDefs(),0,'visual bridge must not mutate canonical hero data');
assert.equal(chars.dungeon_aldren.image,custom);
assert.equal(chars.dungeon_aldren.avatar,custom);
assert.equal(api.canonicalArt('dungeon_aldren'),custom,'custom configured art must win');
assert.equal(api.canonicalArt('dungeon_lyra'),'assets/dungeon/creatures/dng_lyra.png','configured built-in art remains valid');
assert.equal(api.canonicalArt('dungeon_brom'),'assets/dungeon/creatures/dng_brom.png','built-in art is fallback only when no configured art exists');
console.log('Dungeon hero art bridge: canonical custom art preserved, built-in fallback retained, V16.78.79 runtime loader OK');
require('./dungeon_authored_final_exit_v167878.test.cjs');
