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

assert.equal(blob,'207353f408d8c60213b512f73184bb9ec666b75d','asset resolver final audit must target the exact B.5 runtime index blob');

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

for(const [id,b] of [['2.13',b213],['2.14',b214],['3.10',b310]]){
  assert.doesNotMatch(b,/dungeon_aldren\s*:\s*(?:ROOT\+)?["']dng_aldren\.png["']/,'B.5 resolved: Core '+id+' no longer duplicates the built-in hero asset map');
  assert.match(b,/GensAssetResolverV1\.dungeonHeroPath\(/,'B.5 resolved: Core '+id+' delegates built-in hero paths to the Core resolver');
}
for(const [id,b] of [['3.09',b309],['3.10',b310]]){
  assert.doesNotMatch(b,/ROOT\+String\(e\.enemyId\)\+["']\.png["']/,'B.5 resolved: Core '+id+' no longer uses the historical direct built-in enemy expression');
  assert.match(b,/GensAssetResolverV1\.dungeonCreaturePath\(/,'B.5 resolved: Core '+id+' delegates built-in enemy paths to the Core resolver');
}

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
    lootLogicalMap:['dungeonCore023StabilityFix']
  },
  resolvedSubLots:{
    B5LateTokenEntityPaths:['dungeonCore213Stability','dungeonCore214SingleAuthority','dungeonCore309VisualFixes','dungeonCore310PersistenceAndTokens']
  },
  retainedDungeonPresentationOwners:['dungeonCore055ExactAssets'],
  nextSubLots:['B.6 loot logical paths']
},null,2));
