const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');

const indexPath=path.join(__dirname,'..','index.html');
const bytes=fs.readFileSync(indexPath);
const index=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(blob,'388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9','asset resolver final audit must target the exact B.4 GREEN index blob');

function block(id){
  const m=index.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const b213=block('dungeonCore213Stability');
const b214=block('dungeonCore214SingleAuthority');
const b309=block('dungeonCore309VisualFixes');
const b310=block('dungeonCore310PersistenceAndTokens');
const b023=block('dungeonCore023StabilityFix');
const b055=block('dungeonCore055ExactAssets');

assert.match(b213,/dungeon_aldren:"dng_aldren\.png"[\s\S]*assets\/dungeon\/creatures\//,'B.5 debt: Core 2.13 still duplicates built-in hero asset mapping');
assert.match(b214,/dungeon_aldren:"dng_aldren\.png"[\s\S]*assets\/dungeon\/creatures\//,'B.5 debt: Core 2.14 still duplicates built-in hero asset mapping');
assert.match(b310,/dungeon_aldren:ROOT\+"dng_aldren\.png"/,'B.5 debt: Core 3.10 still duplicates built-in hero asset mapping');
assert.match(b309,/ROOT\+String\(e\.enemyId\)\+"\.png"/,'B.5 debt: Core 3.09 still owns a direct enemy path fallback');
assert.match(b310,/ROOT\+String\(e\.enemyId\)\+"\.png"/,'B.5 debt: Core 3.10 still owns a direct enemy path fallback');

for(const id of ['dloot_old_coin','dloot_silver_idol','dloot_beast_fang','dloot_runic_shard','dloot_black_pearl','dloot_dragon_scale','dloot_royal_relic','dloot_void_gem']){
  assert.match(b023,new RegExp(id+':"'+id+'\\.png"'),'B.6 debt: missing historical loot art mapping '+id);
}
assert.match(b023,/DC023_ASSET_ROOT="assets\/dungeon\/creatures\/"/,'B.6 debt: loot art owner still reconstructs the Dungeon root');

assert.match(b055,/const ROOT55='assets\/dungeon\/creatures\/'/,'block 65 remains an exact Dungeon presentation asset owner');
assert.match(b055,/dungeon_marker_start\.png/);
assert.match(b055,/dungeon_chest_legendary\.png/);
assert.match(b055,/dungeon_pressure_plate\.png/);
assert.doesNotMatch(b055,/dungeon_aldren|dng_longsword|dng_skeleton|dloot_/,'block 65 must not own logical hero/item/enemy/loot entity resolution');

console.log(JSON.stringify({
  scenario:'Phase 4 asset resolver final audit',
  sourceIndexBlob:blob,
  remainingResolverDebts:{
    lateHeroTokenPaths:['dungeonCore213Stability','dungeonCore214SingleAuthority','dungeonCore310PersistenceAndTokens'],
    lateEnemyFallbackPaths:['dungeonCore309VisualFixes','dungeonCore310PersistenceAndTokens'],
    lootLogicalMap:['dungeonCore023StabilityFix']
  },
  retainedDungeonPresentationOwners:['dungeonCore055ExactAssets'],
  nextSubLots:['B.5 late token entity paths','B.6 loot logical paths']
},null,2));
