const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const resolver=fs.readFileSync(path.join(root,'assets','gensrpg','core','asset-resolver-v1.js'),'utf8');

function block(id){
  const re=new RegExp('<script[^>]*id=["\\']'+id+'["\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const coreTag='<script src="assets/gensrpg/core/asset-resolver-v1.js"></script>';
const pCore=index.indexOf(coreTag);
const p164=index.indexOf('<script id="dungeonGithubArts164">');
assert.ok(pCore>=0,'Phase 4 Core asset resolver must be production-loaded');
assert.ok(pCore<p164,'Core asset resolver must load before historical Dungeon art consumers');

for(const id of ['dungeonGithubArts164','dungeonArtRenderFix165','dungeonDirectImageBinding166']){
  const src=block(id);
  assert.match(src,/GensAssetResolverV1\.dungeonCreaturePath/,'generic Dungeon creature path must delegate to Core in '+id);
  assert.doesNotMatch(src,/(?:["']assets\/dungeon\/creatures\/["']\s*\+|assets\/dungeon\/creatures\/\$\{)/,'historical block must not reconstruct Dungeon creature paths in '+id);
}

const marker=block('dungeonHeroItemAssets168Marker');
assert.match(marker,/GensAssetResolverV1\.ROOTS\.dungeon\.creatures/,'legacy root marker may remain only as a delegating alias');
assert.doesNotMatch(marker,/["']assets\/dungeon\/creatures\/["']/,'legacy root marker must not own a duplicate root literal');

const exact=block('dungeonCore055ExactAssets');
assert.match(exact,/const ROOT55='assets\/dungeon\/creatures\/'/,'exact UI asset owner remains intentionally outside this creature-path sub-lot');

assert.match(resolver,/function dungeonCreaturePath\s*\(/,'Core resolver must expose the canonical Dungeon creature path function');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon creature resolver ownership raccord',
  coreLoadedBeforeHistoricalConsumers:true,
  delegatedBlocks:['dungeonGithubArts164','dungeonArtRenderFix165','dungeonDirectImageBinding166'],
  legacyRootAliasDelegates:true,
  exactUiAssetsUntouched:true
},null,2));
