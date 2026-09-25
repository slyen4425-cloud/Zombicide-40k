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
},'post-Challenge-Library storage totals must match the migrated state');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8170815);
assert.equal(blob,'9c762dcb8ad3549cf7175ba9413f925b11f5396c');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

// Audit 7 blind spot: the main anonymous script owns the same gameplay mirror key.
assert.match(src,/const GENS_RPG_GAMEPLAY_BY_PROFILE_KEY="gensrpg_rpg_gameplay_by_profile_v1"/);
assert.equal((src.match(/localStorage\.getItem\(GENS_RPG_GAMEPLAY_BY_PROFILE_KEY\)/g)||[]).length,1);
assert.equal((src.match(/localStorage\.setItem\(GENS_RPG_GAMEPLAY_BY_PROFILE_KEY/g)||[]).length,2);
assert.equal((src.match(/localStorage\.removeItem\(GENS_RPG_GAMEPLAY_BY_PROFILE_KEY\)/g)||[]).length,1);
assert.match(src,/const GENS_RPG_GAMEPLAY_MIRROR_CLEARED_V1004="gensrpg_rpg_gameplay_mirror_cleared_v1004"/);

const capture=block('builtinMonsterCapture162');
const seedStart=capture.indexOf('/* Configuration des modules du profil. */');
const seedEnd=capture.indexOf('/* Réglages Capture de démonstration',seedStart);
assert.ok(seedStart>=0&&seedEnd>seedStart);
const gameplaySeed=capture.slice(seedStart,seedEnd);
assert.equal((gameplaySeed.match(/localStorage\.getItem\(key\)/g)||[]).length,1);
assert.equal((gameplaySeed.match(/localStorage\.setItem\(key,/g)||[]).length,1);

// Challenge Library is the selected homogeneous JSON family.
const c51=block('dungeonCore051ExplorationPolish');
const c200=block('dungeonCore200Rebuild');
const c202=block('dungeonCore202ContentDensity');
assert.match(c51,/const CHALLENGE_LIB_KEY_069="gensrpg_challenge_library_v1"/);
assert.equal((c51.match(/localStorage\.getItem\(CHALLENGE_LIB_KEY_069\)/g)||[]).length,0);
assert.equal((c51.match(/GensStorageV1\.readJson\(localStorage,CHALLENGE_LIB_KEY_069,\[\]\)/g)||[]).length,1);
assert.equal((c51.match(/localStorage\.setItem\(CHALLENGE_LIB_KEY_069/g)||[]).length,0);
assert.equal((c51.match(/GensStorageV1\.writeJson\(localStorage,CHALLENGE_LIB_KEY_069/g)||[]).length,2);
assert.equal((c200.match(/localStorage\.getItem\('gensrpg_challenge_library_v1'\)/g)||[]).length,0);
assert.equal((c200.match(/GensStorageV1\.readJson\(localStorage,'gensrpg_challenge_library_v1',\[\]\)/g)||[]).length,1);
assert.equal((c202.match(/localStorage\.getItem\("gensrpg_challenge_library_v1"\)/g)||[]).length,0);
assert.equal((c202.match(/GensStorageV1\.readJson\(localStorage,"gensrpg_challenge_library_v1",\[\]\)/g)||[]).length,1);

assert.match(c51,/if\(!Array\.isArray\(lib\)\)lib=\[\]/);
assert.match(c51,/DEFAULT_CHALLENGES\.forEach/);
assert.match(c200,/typeof loadChallengeLibrary069==='function'\?loadChallengeLibrary069\(\):/);
assert.match(c202,/typeof loadChallengeLibrary069==="function"\?loadChallengeLibrary069\(\):/);

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.equal(keys.has('gensrpg_challenge_library_v1'),false,'migrated Challenge Library key must leave direct-storage manifest');
assert.ok(keys.has('gensrpg_rpg_gameplay_by_profile_v1'));
assert.ok(keys.has('gensrpg_dungeon_runtime_v2'));

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 8',
  indexBlob:blob,
  deferredGameplayMirror:{
    mainAnonymous:{reads:1,writes:2,removes:1},
    captureSeed:{reads:1,writes:1},
    reason:'compatibility mirror + removeItem + scalar clear marker'
  },
  selected:'gensrpg_challenge_library_v1',
  selectedOwners:['dungeonCore051ExplorationPolish','dungeonCore200Rebuild','dungeonCore202ContentDensity'],
  selectedCoreAccesses:{reads:3,writes:2},
  targetBlob:'9c762dcb8ad3549cf7175ba9413f925b11f5396c'
},null,2));
