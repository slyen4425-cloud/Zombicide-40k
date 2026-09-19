const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','core','asset-resolver-v1.js');
const src=fs.readFileSync(file,'utf8');

assert.doesNotThrow(()=>new Function(src),'asset resolver source must stay syntactically valid');
assert.doesNotMatch(src,/\b(?:document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener)\b/,'pure asset resolver must not own DOM, storage, observers, listeners or timers');

const ctx={};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'asset-resolver-v1.js'});
const api=ctx.GensAssetResolverV1;
assert.ok(api,'asset resolver API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');

assert.equal(api.dungeonCreaturePath('dng_skeleton'),'assets/dungeon/creatures/dng_skeleton.png');
assert.equal(api.dungeonCreaturePath('DNG_ORC'),'assets/dungeon/creatures/DNG_ORC.png');
assert.equal(api.dungeonCreaturePath('zombie_walker'),'','non-Dungeon creature ids must not inherit Dungeon paths');

assert.equal(api.dungeonHeroPath('dungeon_aldren'),'assets/dungeon/creatures/dng_aldren.png');
assert.equal(api.dungeonHeroPath('dungeon_lyra'),'assets/dungeon/creatures/dng_lyra.png');
assert.equal(api.dungeonHeroPath('dungeon_brom'),'assets/dungeon/creatures/dng_brom.png');
assert.equal(api.dungeonHeroPath('custom_hero'),'','unknown heroes must not receive a hidden Dungeon fallback');

assert.equal(api.dungeonItemPath('dng_longsword'),'assets/dungeon/creatures/dng_longsword.png');
assert.equal(api.dungeonItemPath('dng_heal_potion'),'assets/dungeon/creatures/dungeon_potion_hp.png');
assert.equal(api.dungeonItemPath('dng_amulet'),'assets/dungeon/creatures/dungeon_relic.png');
assert.equal(api.dungeonItemPath('unknown_item'),'','unknown items must not receive an invented path');

assert.equal(api.resolve({module:'dungeon',kind:'creature',id:'dng_wyvern'}),'assets/dungeon/creatures/dng_wyvern.png');
assert.equal(api.resolve({module:'dungeon',kind:'hero',id:'dungeon_aldren'}),'assets/dungeon/creatures/dng_aldren.png');
assert.equal(api.resolve({module:'dungeon',kind:'item',id:'dng_bow'}),'assets/dungeon/creatures/dng_bow.png');
assert.equal(api.resolve({module:'dungeon',kind:'item',id:'dng_bow',override:'data:image/png;base64,ABC'}),'data:image/png;base64,ABC','explicit editor override must remain first authority');
assert.equal(api.resolve({module:'dungeon',kind:'hero',id:'missing',fallback:'legacy.svg'}),'legacy.svg','caller-provided technical fallback must remain explicit');
assert.equal(api.resolve({module:'survival',kind:'creature',id:'dng_skeleton'}),'','Survival must never inherit a Dungeon asset by id collision');
assert.equal(api.resolve({module:'capture',kind:'item',id:'dng_bow',fallback:'capture-own.png'}),'capture-own.png','other modules may only use their own explicit fallback');

console.log(JSON.stringify({
  scenario:'Phase 4 pure asset resolver contract',
  productionLoaded:false,
  dungeonCreature:'assets/dungeon/creatures/dng_skeleton.png',
  dungeonHero:'assets/dungeon/creatures/dng_aldren.png',
  dungeonItem:'assets/dungeon/creatures/dng_bow.png',
  crossModuleFallback:false
},null,2));
