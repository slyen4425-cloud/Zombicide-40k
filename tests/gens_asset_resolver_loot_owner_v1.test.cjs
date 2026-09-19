const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const resolverSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','asset-resolver-v1.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const ctx={};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(resolverSrc,ctx,{filename:'asset-resolver-v1.js'});
const api=ctx.GensAssetResolverV1;
assert.ok(api,'asset resolver API must exist');

const lootIds=[
  'dloot_old_coin','dloot_silver_idol','dloot_beast_fang','dloot_runic_shard',
  'dloot_black_pearl','dloot_dragon_scale','dloot_royal_relic','dloot_void_gem'
];
for(const id of lootIds){
  assert.equal(
    api.dungeonItemPath(id),
    'assets/dungeon/creatures/'+id+'.png',
    'Dungeon loot '+id+' must be owned by the Core item resolver'
  );
}

const start=index.indexOf('id="dungeonCore023StabilityFix"');
assert.ok(start>=0,'missing dungeonCore023StabilityFix');
const end=index.indexOf('</script>',start);
assert.ok(end>start,'unterminated dungeonCore023StabilityFix');
const b023=index.slice(start,end);

assert.doesNotMatch(b023,/\bDC023_LOOT_ART\b/,'Core 0.23 must not keep a duplicate loot asset map');
assert.doesNotMatch(b023,/\bDC023_ASSET_ROOT\b/,'Core 0.23 must not keep a duplicate Dungeon asset root');
assert.match(
  b023,
  /GensAssetResolverV1\.dungeonItemPath\(/,
  'Core 0.23 loot decoration must delegate paths to the Core item resolver'
);
assert.match(
  b023,
  /image_data\s*:\s*it\.image_data\s*\|\|\s*canonical/,
  'existing loot image_data override must remain above the canonical asset'
);

console.log(JSON.stringify({
  scenario:'Phase 4 B.6 Dungeon loot asset owner',
  lootIds,
  owner:'GensAssetResolverV1.dungeonItemPath',
  consumer:'dungeonCore023StabilityFix'
},null,2));
