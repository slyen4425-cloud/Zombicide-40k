const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.doesNotMatch(src,/GensRpgStatService|GensCleanRpgStats|dungeonAttributeValue|changeDungeonAttribute/,'hero art repair must stay independent from statistics');
const chars={
 dungeon_aldren:{image:'data:image/svg+xml;base64,AAA',avatar:'data:image/svg+xml;base64,BBB'},
 dungeon_lyra:{image:'assets/dungeon/creatures/dng_lyra.png',avatar:''},
 dungeon_brom:{image:'',avatar:'assets/dungeon/creatures/dng_brom.png'}
};
const ctx={console,setTimeout,clearTimeout,requestAnimationFrame:f=>f(),CHARS:chars,current:'dungeon_aldren'};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-dungeon-hero-art-repair-167874.js'});
const api=ctx.GensDungeonHeroArtRepair167874;assert.ok(api);
assert.equal(api.obsolete('data:image/svg+xml;base64,AAA'),true);
assert.equal(api.obsolete('assets/dungeon/creatures/dng_aldren.png'),false);
api.repairDefs();
assert.equal(chars.dungeon_aldren.image,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(chars.dungeon_aldren.avatar,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(chars.dungeon_lyra.image,'assets/dungeon/creatures/dng_lyra.png');
assert.equal(chars.dungeon_lyra.avatar,'assets/dungeon/creatures/dng_lyra.png');
assert.equal(chars.dungeon_brom.image,'assets/dungeon/creatures/dng_brom.png');
assert.equal(chars.dungeon_brom.avatar,'assets/dungeon/creatures/dng_brom.png');
console.log('Dungeon built-in hero art repair: OK');
