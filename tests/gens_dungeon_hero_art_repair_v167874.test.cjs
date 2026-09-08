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
assert.match(src,/dungeon-authored-final-exit-167875\.js\?v=167878/);
assert.match(src,/dungeon-authored-event-cells-167877\.js\?v=167878/);
assert.match(src,/dungeon-event-runtime-fix-167878\.js\?v=167878/);
const chars={
 dungeon_aldren:{image:'assets/old/generic_hero.png',avatar:'data:image/svg+xml;base64,BBB'},
 dungeon_lyra:{image:'assets/dungeon/creatures/dng_lyra.png',avatar:''},
 dungeon_brom:{image:'',avatar:'assets/old/brom-placeholder.png'}
};
const ctx={console,setTimeout,clearTimeout,requestAnimationFrame:f=>f(),CHARS:chars,current:'dungeon_aldren'};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-dungeon-hero-art-repair-167874.js'});
const api=ctx.GensDungeonHeroArtRepair167874;assert.ok(api);
api.repairDefs();
assert.equal(chars.dungeon_aldren.image,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(chars.dungeon_aldren.avatar,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(chars.dungeon_lyra.image,'assets/dungeon/creatures/dng_lyra.png');
assert.equal(chars.dungeon_lyra.avatar,'assets/dungeon/creatures/dng_lyra.png');
assert.equal(chars.dungeon_brom.image,'assets/dungeon/creatures/dng_brom.png');
assert.equal(chars.dungeon_brom.avatar,'assets/dungeon/creatures/dng_brom.png');
console.log('Dungeon built-in hero art repair + V16.78.78 runtime loader: OK');
require('./dungeon_authored_final_exit_v167878.test.cjs');
