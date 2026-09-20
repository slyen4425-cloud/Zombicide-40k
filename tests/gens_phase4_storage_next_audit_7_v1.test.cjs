const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));

assert.deepEqual(manifest.totals,{
  totalAccesses:196,
  resolvedAccesses:131,
  unresolvedAccesses:65,
  distinctResolvedKeys:24
},'post-Economy-Rules storage totals drifted');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8174580,'audit 7 must target the exact post-Economy-Rules index size');
assert.equal(blob,'16deeb169abbc31a7db04161902e9381fd6888ad','audit 7 must target the exact post-Economy-Rules index blob');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const capture=block('builtinMonsterCapture162');
const seedStart=capture.indexOf('/* Configuration des modules du profil. */');
const seedEnd=capture.indexOf('/* Réglages Capture de démonstration',seedStart);
assert.ok(seedStart>=0&&seedEnd>seedStart,'Capture gameplay seed block must be locatable');
const gameplaySeed=capture.slice(seedStart,seedEnd);

assert.match(gameplaySeed,/const key="gensrpg_rpg_gameplay_by_profile_v1"/);
assert.equal((gameplaySeed.match(/localStorage\.getItem\(key\)/g)||[]).length,1,'gameplay mirror must have one direct read in audit');
assert.equal((gameplaySeed.match(/localStorage\.setItem\(key,/g)||[]).length,1,'gameplay mirror must have one direct conditional write in audit');
assert.match(gameplaySeed,/try\{map=JSON\.parse\(localStorage\.getItem\(key\)\|\|"\{\}"\)\|\|\{\}\}catch\(e\)\{\}/);
assert.match(gameplaySeed,/if\(!map\[MC162_ID\]\)/);
assert.match(gameplaySeed,/map\[MC162_ID\]=JSON\.parse\(JSON\.stringify\(MC162_GAMEPLAY\)\)/);

assert.equal(gameplaySeed.includes('GensStorageV1.'),false,'audit must not pre-apply gameplay mirror Core raccord');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
const mirror=keys.get('gensrpg_rpg_gameplay_by_profile_v1');
assert.ok(mirror,'gameplay mirror candidate must remain in direct-storage manifest during audit');
assert.deepEqual(mirror.domains,['capture']);
assert.deepEqual(mirror.sources,['inline:builtinMonsterCapture162']);
assert.deepEqual(mirror.ops,['getItem','setItem']);

assert.ok(keys.has('gensrpg_challenge_library_v1'),'Challenge Library must remain deferred');
assert.ok(keys.has('gensrpg_dungeon_runtime_v2'),'Dungeon runtime must remain deferred');

for(const token of [
  'gensrpg_shared_entities_v1__family__creature',
  'gensrpg_skill_library_v1',
  'gensrpg_capture_wild_rules_v1_'
]){
  assert.ok(capture.includes(token),'other Capture seed ownership must remain visible: '+token);
}

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 7',
  indexBlob:blob,
  selected:'gensrpg_rpg_gameplay_by_profile_v1',
  selectedOwner:'builtinMonsterCapture162',
  selectedDirectAccesses:{reads:1,writes:1},
  semantics:'seed-only-if-profile-missing',
  deferred:['challenge library','dungeon runtime v2','Stats dynamic state','Tactical mixed state','Runtime Repair mixed scalar/JSON']
},null,2));
