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
const c51=block('dungeonCore051ExplorationPolish');
const c200=block('dungeonCore200Rebuild');
const c202=block('dungeonCore202ContentDensity');

assert.match(c51,/const CHALLENGE_LIB_KEY_069="gensrpg_challenge_library_v1"/);

assert.equal((c51.match(/localStorage\.getItem\(CHALLENGE_LIB_KEY_069\)/g)||[]).length,0,'Core 0.51 challenge library direct read must be gone');
assert.equal((c51.match(/localStorage\.setItem\(CHALLENGE_LIB_KEY_069/g)||[]).length,0,'Core 0.51 challenge library direct writes must be gone');
assert.equal((c200.match(/localStorage\.getItem\('gensrpg_challenge_library_v1'\)/g)||[]).length,0,'Core 2.00 fallback direct read must be gone');
assert.equal((c202.match(/localStorage\.getItem\("gensrpg_challenge_library_v1"\)/g)||[]).length,0,'Core 2.02 fallback direct read must be gone');

assert.equal((c51.match(/GensStorageV1\.readJson\(localStorage,CHALLENGE_LIB_KEY_069,\[\]\)/g)||[]).length,1,'Core 0.51 must use one Core read');
assert.equal((c51.match(/GensStorageV1\.writeJson\(localStorage,CHALLENGE_LIB_KEY_069,lib\)/g)||[]).length,1,'Core 0.51 merged library must use one Core write');
assert.equal((c51.match(/GensStorageV1\.writeJson\(localStorage,CHALLENGE_LIB_KEY_069,Array\.isArray\(lib\)\?lib:\[\]\)/g)||[]).length,1,'Core 0.51 save must use one normalized Core write');
assert.equal((c200.match(/GensStorageV1\.readJson\(localStorage,'gensrpg_challenge_library_v1',\[\]\)/g)||[]).length,1,'Core 2.00 fallback must use one Core read');
assert.equal((c202.match(/GensStorageV1\.readJson\(localStorage,"gensrpg_challenge_library_v1",\[\]\)/g)||[]).length,1,'Core 2.02 fallback must use one Core read');

assert.match(c51,/if\(!Array\.isArray\(lib\)\)lib=\[\]/,'Dungeon must retain array normalization');
assert.match(c51,/DEFAULT_CHALLENGES\.forEach/,'Dungeon must retain built-in challenge merge');
assert.match(c51,/try\{GensStorageV1\.writeJson\(localStorage,CHALLENGE_LIB_KEY_069,lib\)\}catch\(e\)\{\}/,'merged write error boundary must remain');
assert.match(c51,/function saveChallengeLibrary069\(lib\)\{\s*try\{GensStorageV1\.writeJson\(localStorage,CHALLENGE_LIB_KEY_069,Array\.isArray\(lib\)\?lib:\[\]\)\}catch\(e\)\{\}\s*\}/,'save normalization/error boundary must remain');
assert.match(c200,/typeof loadChallengeLibrary069==='function'\?loadChallengeLibrary069\(\):GensStorageV1\.readJson/,'Core 2.00 loader preference must remain');
assert.match(c202,/typeof loadChallengeLibrary069==="function"\?loadChallengeLibrary069\(\):GensStorageV1\.readJson/,'Core 2.02 loader preference must remain');

assert.equal(bytes.length,8171854);
assert.equal(blob,'97f0e060d8bffcde2baaf5aa42c1e16b8544263f','Challenge Library raccord must match deterministic target blob');

console.log(JSON.stringify({
  scenario:'Phase 4 Challenge Library Core storage authority',
  key:'gensrpg_challenge_library_v1',
  coreReads:3,
  coreWrites:2,
  owners:['dungeonCore051ExplorationPolish','dungeonCore200Rebuild','dungeonCore202ContentDensity'],
  indexBlob:blob
},null,2));
