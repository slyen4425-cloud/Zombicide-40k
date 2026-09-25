const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));

assert.deepEqual(manifest.totals,{
  totalAccesses:181,
  resolvedAccesses:116,
  unresolvedAccesses:65,
  distinctResolvedKeys:19
},'post-Economy-Rules storage totals drifted');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:151,resolved:101,unresolved:50,distinctKeys:11
},'post-Economy-Rules Dungeon storage totals drifted');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8169503,'audit 6 must target the current Phase 5 grid-repair index size');
assert.equal(blob,'fb8c77504ed067fb094374260b459f8d1fb7e824','audit 6 must target the exact current Phase 5 grid-repair index blob');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const economy=block('dungeonEconomy160');
assert.match(economy,/const DUNGEON_ECO_RULES_160="gensrpg_dungeon_economy_rules_160"/);
assert.equal((economy.match(/localStorage\.getItem\(DUNGEON_ECO_RULES_160\)/g)||[]).length,0,'migrated Economy rules must have no direct read');
assert.equal((economy.match(/GensStorageV1\.readJson\(localStorage,DUNGEON_ECO_RULES_160,\{\}\)/g)||[]).length,1,'Economy rules must use one Core read');
assert.equal((economy.match(/localStorage\.setItem\(DUNGEON_ECO_RULES_160/g)||[]).length,0,'migrated Economy rules must have no direct write');
assert.equal((economy.match(/GensStorageV1\.writeJson\(localStorage,DUNGEON_ECO_RULES_160,r\|\|dungeonEconomyRules160\(\)\)/g)||[]).length,1,'Economy rules must use one Core write');

assert.equal((economy.match(/localStorage\.getItem\(key\)/g)||[]).length,0,'migrated Economy session must have no direct read');
assert.equal((economy.match(/localStorage\.setItem\(key,/g)||[]).length,0,'migrated Economy session must have no direct write');
assert.equal((economy.match(/localStorage\.setItem\(key\(heroId\),/g)||[]).length,1,'hero inventory persistence must remain distinct');
assert.equal((economy.match(/GensStorageV1\.readJson\(localStorage,key,\{\}\)/g)||[]).length,1,'Economy session must use one Core read');
assert.equal((economy.match(/GensStorageV1\.writeJson\(localStorage,key,rest\)/g)||[]).length,1,'Economy session must use one Core write');
assert.match(economy,/const key="gensrpg_dungeon_session_eco_160_"\+id/,'dynamic Economy session key must remain profile-scoped');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.equal(keys.has('gensrpg_dungeon_economy_rules_160'),false,'migrated Economy rules key must leave direct-storage manifest');
assert.ok(keys.has('gensrpg_rpg_gameplay_by_profile_v1'),'gameplay mirror must remain deferred');
assert.equal(keys.has('gensrpg_challenge_library_v1'),false,'migrated Challenge Library key must leave direct-storage manifest');
assert.ok(keys.has('gensrpg_dungeon_runtime_v2'),'Dungeon runtime must remain deferred');

assert.equal(economy.includes('GensStorageV1.readJson(localStorage,DUNGEON_ECO_RULES_160,{})'),true,'Economy rules raccord must remain applied');
assert.equal(economy.includes('GensStorageV1.writeJson(localStorage,DUNGEON_ECO_RULES_160'),true,'Economy rules writer raccord must remain applied');

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 6',
  indexBlob:blob,
  selected:'gensrpg_dungeon_economy_rules_160',
  selectedOwner:'dungeonEconomy160',
  selectedCoreAccesses:{reads:1,writes:1},
  sameBlock:{
    dynamicSessionCore:{reads:1,writes:1},
    heroInventoryWrites:1
  },
  deferred:['gameplay mirror','challenge library','dungeon runtime v2']
},null,2));
