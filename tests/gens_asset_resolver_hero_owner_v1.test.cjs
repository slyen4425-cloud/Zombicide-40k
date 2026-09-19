const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

const coreTag='<script src="assets/gensrpg/core/asset-resolver-v1.js"></script>';
const heroOwnerTag='<script>\n\nconst Z40K_GENERIC_SHEET_BG';
const pCore=index.indexOf(coreTag);
const pHeroOwner=index.indexOf(heroOwnerTag);
assert.ok(pCore>=0,'missing Core asset resolver production tag');
assert.ok(pHeroOwner>=0,'missing historical hero/item owner script');
assert.ok(pCore<pHeroOwner,'Core asset resolver must load before the historical hero/item owner script');

const heroFn=index.match(/function dungeonBuiltinHeroGithubArt168\(id\)\{([\s\S]*?)\n\}/);
assert.ok(heroFn,'missing dungeonBuiltinHeroGithubArt168');
assert.match(heroFn[1],/window\.GensAssetResolverV1\.dungeonHeroPath\(id\)/,
  'Dungeon builtin hero path must delegate to the Phase 4 Core resolver');
assert.doesNotMatch(heroFn[1],/dungeon_aldren|dungeon_lyra|dungeon_brom|assets\/dungeon\/creatures\//,
  'historical hero helper must not retain its own hero/path catalogue');

const ensure=index.match(/function ensureDungeonHeroes\(\)\{([\s\S]*?)\n\}/);
assert.ok(ensure,'missing ensureDungeonHeroes');
assert.match(ensure[1],/const githubArt=dungeonBuiltinHeroGithubArt168\(id\)/,
  'existing hero consumer must keep using the historical helper during this sub-lot');
assert.match(ensure[1],/image:ov\.avatar\|\|githubArt\|\|dungeonBuiltinPortrait\(id\)/,
  'custom hero override must remain above Core path and generated portrait fallback');

const items=index.match(/function dungeonItems\(\)\{([\s\S]*?)\n\}/);
assert.ok(items,'missing dungeonItems');
assert.match(items[1],/const githubItemArts=\{/,
  'items remain deliberately historical in the hero-only sub-lot');
assert.match(items[1],/githubItemArts\[it\.id\]\s*\?\s*"assets\/dungeon\/creatures\/"\+githubItemArts\[it\.id\]/,
  'item path construction must remain untouched until its own sub-lot');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon builtin hero path owner',
  heroDelegatesToCore:true,
  heroOverridePriorityPreserved:true,
  itemOwnerUntouched:true
},null,2));
