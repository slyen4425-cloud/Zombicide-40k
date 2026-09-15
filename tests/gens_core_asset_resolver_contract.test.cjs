const assert=require('node:assert/strict');
const path=require('node:path');
const Assets=require(path.join(__dirname,'..','assets','gensrpg','core','asset-resolver.js'));

assert.equal(Assets.VERSION,'1.1.0');
assert.deepEqual([...Assets.MODULES],['common','survival','dungeon','capture','pvp']);

// Validated current Dungeon defaults.
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'dungeon_aldren'}),'assets/dungeon/creatures/dng_aldren.png');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'dungeon_lyra'}),'assets/dungeon/creatures/dng_lyra.png');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'dungeon_brom'}),'assets/dungeon/creatures/dng_brom.png');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'tile',id:'wall'}),'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'tile',id:'floor'}),'assets/dungeon/creatures/dng_floor_stone_01.png');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'item',id:'dloot_void_gem'}),'assets/dungeon/creatures/dloot_void_gem.png');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'creature',id:'dng_skeleton'}),'assets/dungeon/creatures/dng_skeleton.png');

// Explicit creator/runtime configuration always wins over defaults.
const overrides={dungeon:{hero:{dungeon_aldren:'custom/worlds/red-aldren.webp'}}};
let out=Assets.resolveAsset({module:'dungeon',kind:'hero',id:'dungeon_aldren',overrides});
assert.equal(out.path,'custom/worlds/red-aldren.webp');
assert.equal(out.source,'override');

out=Assets.resolveAsset({module:'dungeon',kind:'hero',id:'dungeon_aldren',explicitPath:'custom/session/aldren.png',overrides});
assert.equal(out.path,'custom/session/aldren.png');
assert.equal(out.source,'explicit');

// artId is the preferred lookup key but the entity id remains an explicit fallback.
const customCatalog={dungeon:{hero:{custom_knight:'custom/catalog/knight.png'}}};
out=Assets.resolveAsset({module:'dungeon',kind:'hero',id:'dungeon_aldren',artId:'custom_knight',catalog:customCatalog});
assert.equal(out.path,'custom/catalog/knight.png');
assert.equal(out.resolvedId,'custom_knight');
assert.equal(out.source,'catalog');

// Runtime/editor entities expose which field supplied their direct art.
out=Assets.resolveEntityAsset({module:'dungeon',kind:'hero',id:'dungeon_aldren',entity:{artId:'custom_knight',image_data:'custom/entity/direct.png'},catalog:customCatalog});
assert.equal(out.path,'custom/entity/direct.png');
assert.equal(out.source,'entity-field');
assert.equal(out.sourceField,'image_data');

out=Assets.resolveEntityAsset({module:'dungeon',kind:'hero',id:'dungeon_aldren',entity:{artId:'custom_knight'},catalog:customCatalog});
assert.equal(out.path,'custom/catalog/knight.png');
assert.equal(out.source,'catalog');
assert.equal(out.sourceField,'');

out=Assets.resolveEntityAsset({module:'dungeon',kind:'creature',id:'dng_necromancer',entity:{art:'javascript:bad()'}});
assert.equal(out.path,'assets/dungeon/creatures/dng_necromancer.png','invalid entity art must fall through to the safe module convention');
assert.equal(out.source,'module-convention');

// User-supplied image payloads and HTTPS assets are valid explicit choices.
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'x',explicitPath:'data:image/png;base64,AAAA'}),'data:image/png;base64,AAAA');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'x',explicitPath:'https://example.invalid/hero.webp'}),'https://example.invalid/hero.webp');

// Path traversal / script schemes are never emitted by the resolver.
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'x',explicitPath:'../secret.png'}),'');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'x',explicitPath:'javascript:alert(1)'}),'');

// Strict module boundary: no same-name fallback from another mode.
const splitCatalog={
  survival:{hero:{shared_hero:'assets/survival/shared.png'}},
  dungeon:{hero:{}},
};
assert.equal(Assets.resolvePath({module:'dungeon',kind:'hero',id:'shared_hero',catalog:splitCatalog}),'');
assert.equal(Assets.resolvePath({module:'survival',kind:'hero',id:'shared_hero',catalog:splitCatalog}),'assets/survival/shared.png');
assert.equal(Assets.resolvePath({module:'capture',kind:'creature',id:'dng_skeleton'}),'','Dungeon naming must not leak into Capture');

// Convention is transparent and can be disabled by a caller/editor validation pass.
out=Assets.resolveAsset({module:'dungeon',kind:'creature',id:'dng_wyvern'});
assert.equal(out.source,'module-convention');
assert.equal(out.path,'assets/dungeon/creatures/dng_wyvern.png');
assert.equal(Assets.resolvePath({module:'dungeon',kind:'creature',id:'dng_wyvern',allowConvention:false}),'');

console.log('GenSrpG Core asset resolver contract OK');
