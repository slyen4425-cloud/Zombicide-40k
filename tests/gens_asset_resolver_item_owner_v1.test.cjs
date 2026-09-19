const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

const start=index.indexOf('function dungeonItems(){');
const end=index.indexOf('\nfunction ensureDungeonItems()',start);
assert.ok(start>=0&&end>start,'missing dungeonItems owner');
const src=index.slice(start,end);

assert.match(src,/GensAssetResolverV1\.dungeonItemPath\(it\.id\)/,
  'Dungeon built-in item path must delegate to the Phase 4 Core resolver');
assert.doesNotMatch(src,/const\s+githubItemArts\s*=|githubItemArts\[/,
  'historical dungeonItems must not retain a duplicate built-in item asset catalogue');
assert.doesNotMatch(src,/["']assets\/dungeon\/creatures\/["']\s*\+/,
  'historical dungeonItems must not reconstruct Dungeon asset paths');
assert.match(src,/image_data:ov\.image_data\|\|canonicalArt\|\|dungeonItemArt\(it\.id,ov\.name\|\|it\.name\)/,
  'item override > canonical Core asset > generated fallback priority must remain explicit');
assert.match(src,/imageCrop:gensNormCrop\(ov\.imageCrop\|\|\{\}\)/,
  'item crop behavior must remain unchanged');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon built-in item path owner',
  delegatesToCore:true,
  duplicateCatalogueRemoved:true,
  overridePriorityPreserved:true,
  cropPreserved:true
},null,2));
