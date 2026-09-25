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

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8169047,'repaired Phase 5 Dungeon grid index byte size drifted');
assert.equal(blob,'afc271f9e038f77c5c78caa9f4445d0e49eaea5d','audit 5 must target the exact repaired Dungeon grid index blob');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const manual=block('dungeonCore046ManualMjAssist');
assert.match(manual,/const KEY="gensrpg_manual_mj_effects_v1"/);
assert.equal((manual.match(/localStorage\.getItem\(KEY\)/g)||[]).length,0);
assert.equal((manual.match(/localStorage\.setItem\(KEY/g)||[]).length,0);
assert.equal((manual.match(/GensStorageV1\.readJson\(localStorage,KEY,\[\]\)/g)||[]).length,1);
assert.equal((manual.match(/GensStorageV1\.writeJson\(localStorage,KEY,a\|\|\[\]\)/g)||[]).length,1);
assert.match(manual,/Array\.isArray\(a\)\?a:\[\]/);
assert.equal(manual.includes('gensrpg_dungeon_runtime_v2'),false);

const economy=block('dungeonEconomy160');
assert.match(economy,/gensrpg_dungeon_economy_rules_160/);
assert.match(economy,/gensrpg_dungeon_session_eco_160_/);

const capture=block('builtinMonsterCapture162');
assert.match(capture,/gensrpg_rpg_gameplay_by_profile_v1/);

for(const id of ['dungeonCore051ExplorationPolish','dungeonCore200Rebuild','dungeonCore202ContentDensity']){
  assert.match(block(id),/gensrpg_challenge_library_v1/);
}

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.equal(keys.has('gensrpg_manual_mj_effects_v1'),false,'migrated Manual MJ key must leave the direct-storage manifest');
assert.equal(keys.has('gensrpg_dungeon_economy_rules_160'),false,'migrated Economy rules key must leave the direct-storage manifest');
assert.equal(keys.has('gensrpg_challenge_library_v1'),false,'migrated Challenge Library key must leave the direct-storage manifest');
for(const key of [
  'gensrpg_rpg_gameplay_by_profile_v1',
  'gensrpg_dungeon_runtime_v2'
]) assert.ok(keys.has(key),'candidate/deferred key missing from manifest: '+key);

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 5',
  indexBlob:blob,
  selected:'gensrpg_manual_mj_effects_v1',
  selectedOwner:'dungeonCore046ManualMjAssist',
  selectedCoreAccesses:{reads:1,writes:1},
  migrated:['economy rules','economy session'],
  deferred:['gameplay mirror','challenge library','dungeon runtime v2']
},null,2));
