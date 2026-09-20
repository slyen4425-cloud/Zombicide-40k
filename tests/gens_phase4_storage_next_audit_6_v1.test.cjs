const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));

assert.deepEqual(manifest.totals,{
  totalAccesses:198,
  resolvedAccesses:133,
  unresolvedAccesses:65,
  distinctResolvedKeys:25
},'post-Manual-MJ storage totals drifted');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:166,resolved:116,unresolved:50,distinctKeys:17
},'post-Manual-MJ Dungeon storage totals drifted');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8174580,'audit 6 must target the exact post-Manual-MJ index size');
assert.equal(blob,'a070af09f9cb1fcda78987e83bc117d7544d1b6c','audit 6 must target the exact post-Manual-MJ index blob');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const economy=block('dungeonEconomy160');
assert.match(economy,/const DUNGEON_ECO_RULES_160="gensrpg_dungeon_economy_rules_160"/);
assert.equal((economy.match(/localStorage\.getItem\(DUNGEON_ECO_RULES_160\)/g)||[]).length,1,'Economy rules must still have one direct read in audit');
assert.equal((economy.match(/localStorage\.setItem\(DUNGEON_ECO_RULES_160/g)||[]).length,1,'Economy rules must still have one direct write in audit');

assert.equal((economy.match(/localStorage\.getItem\(key\)/g)||[]).length,1,'dynamic Economy session read must remain distinct');
assert.equal((economy.match(/localStorage\.setItem\(key,/g)||[]).length,1,'dynamic Economy session write must remain distinct');
assert.equal((economy.match(/localStorage\.setItem\(key\(heroId\),/g)||[]).length,1,'hero inventory persistence must remain distinct');
assert.match(economy,/const key="gensrpg_dungeon_session_eco_160_"+id/,'dynamic Economy session key must remain profile-scoped');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.ok(keys.has('gensrpg_dungeon_economy_rules_160'),'Economy rules candidate must remain in direct-storage manifest during audit');
assert.ok(keys.has('gensrpg_rpg_gameplay_by_profile_v1'),'gameplay mirror must remain deferred');
assert.ok(keys.has('gensrpg_challenge_library_v1'),'challenge library must remain deferred');
assert.ok(keys.has('gensrpg_dungeon_runtime_v2'),'Dungeon runtime must remain deferred');

assert.equal(economy.includes('GensStorageV1.readJson(localStorage,DUNGEON_ECO_RULES_160,{})'),false,'audit must not pre-apply Economy rules raccord');
assert.equal(economy.includes('GensStorageV1.writeJson(localStorage,DUNGEON_ECO_RULES_160'),false,'audit must not pre-apply Economy rules raccord');

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 6',
  indexBlob:blob,
  selected:'gensrpg_dungeon_economy_rules_160',
  selectedOwner:'dungeonEconomy160',
  selectedDirectAccesses:{reads:1,writes:1},
  untouchedSameBlock:{
    dynamicSession:{reads:1,writes:1},
    heroInventoryWrites:1
  },
  deferred:['gameplay mirror','challenge library','dungeon runtime v2']
},null,2));
