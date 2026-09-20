const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
const capture=block('builtinMonsterCapture162');
const seedStart=capture.indexOf('/* Configuration des modules du profil. */');
const seedEnd=capture.indexOf('/* Réglages Capture de démonstration',seedStart);
assert.ok(seedStart>=0&&seedEnd>seedStart,'Capture gameplay seed block must be locatable');
const seed=capture.slice(seedStart,seedEnd);

assert.match(seed,/const key="gensrpg_rpg_gameplay_by_profile_v1"/);
assert.equal((seed.match(/localStorage\.getItem\(key\)/g)||[]).length,0,'gameplay-by-profile must have no direct read after raccord');
assert.equal((seed.match(/localStorage\.setItem\(key,/g)||[]).length,0,'gameplay-by-profile must have no direct write after raccord');
assert.equal((seed.match(/GensStorageV1\.readJson\(localStorage,key,\{\}\)\|\|\{\}/g)||[]).length,1,'gameplay-by-profile must use exactly one Core read plus historical || {}');
assert.equal((seed.match(/GensStorageV1\.writeJson\(localStorage,key,map\)/g)||[]).length,1,'gameplay-by-profile must use exactly one Core write');
assert.match(seed,/if\(!map\[MC162_ID\]\)/,'seed-only-if-missing condition must remain Dungeon/Capture-owned');
assert.match(seed,/map\[MC162_ID\]=JSON\.parse\(JSON\.stringify\(MC162_GAMEPLAY\)\)/,'seed clone semantics must remain unchanged');
assert.match(seed,/try\{[\s\S]*?\}catch\(e\)\{console\.warn\("Seed gameplay Capture",e\)\}/,'outer write-error boundary must remain in Capture');

assert.equal((capture.match(/localStorage\.getItem/g)||[]).length,4,'other Capture direct reads must remain untouched');
assert.equal((capture.match(/localStorage\.setItem/g)||[]).length,6,'other Capture direct writes must remain untouched');
for(const token of [
  'gensrpg_shared_entities_v1__family__creature',
  'gensrpg_shared_entities_scoped_v1__family__creature',
  'gensrpg_ability_library_v1',
  'gensrpg_capture_wild_rules_v1_'
]) assert.ok(capture.includes(token),'other Capture seed ownership must remain visible: '+token);

assert.equal(capture.includes('gensrpg_dungeon_runtime_v2'),false,'gameplay-by-profile raccord must not touch deferred Dungeon runtime');

assert.equal(bytes.length,8174580,'post-raccord index size must match the exact gameplay-by-profile micro-diff');
assert.equal(blob,'0b9c41c39db0d073c7b9ed580f66140b8d9bcda2','post-raccord index blob must match the exact gameplay-by-profile micro-diff');

console.log(JSON.stringify({
  scenario:'Phase 4 Capture gameplay-by-profile Core storage authority',
  key:'gensrpg_rpg_gameplay_by_profile_v1',
  coreReads:1,
  coreWrites:1,
  otherCaptureDirectStorage:{reads:4,writes:6},
  indexBlob:blob
},null,2));
