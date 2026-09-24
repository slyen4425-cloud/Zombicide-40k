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
},'Audit 9 must start from Challenge Library GREEN storage totals');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:151,resolved:101,unresolved:50,distinctKeys:11
},'Audit 9 must start from Challenge Library GREEN Dungeon totals');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8170730);
assert.equal(blob,'7663392f163aac32c4c3b918cbce67472856b3b6');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const c51=block('dungeonCore051ExplorationPolish');
assert.match(c51,/const hk="gensrpg_dc067_challenge_history"/);
assert.equal((c51.match(/localStorage\.getItem\(hk\)/g)||[]).length,0,'migrated Challenge History must have no direct read');
assert.equal((c51.match(/localStorage\.setItem\(hk,/g)||[]).length,0,'migrated Challenge History must have no direct write');
assert.match(c51,/let hist=\[\];try\{hist=GensStorageV1\.readJson\(localStorage,hk,\[\]\);if\(!Array\.isArray\(hist\)\)hist=\[\]\}catch\(e\)\{hist=\[\]\}/);
assert.match(c51,/const recent=new Set\(hist\.slice\(-12\)\.map\(String\)\)/);
assert.match(c51,/if\(!fresh\.length\)fresh=p/);
assert.match(c51,/hist\.push\(String\(chosen\.id\)\)/);
assert.match(c51,/GensStorageV1\.writeJson\(localStorage,hk,hist\.slice\(-24\)\)/);
assert.equal((c51.match(/GensStorageV1\.readJson\(localStorage,hk,\[\]\)/g)||[]).length,1,'Challenge History must use one Core read');
assert.equal((c51.match(/GensStorageV1\.writeJson\(localStorage,hk,hist\.slice\(-24\)\)/g)||[]).length,1,'Challenge History must use one Core write');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.equal(keys.has('gensrpg_dc067_challenge_history'),false,'migrated Challenge History key must leave direct-storage manifest');

assert.equal(keys.has('gensrpg_dungeon_scene_v1'),false,'migrated Dungeon Scene key must leave direct-storage manifest');
assert.equal(keys.has('gensrpg_dungeon_session_eco_160_'),false,'migrated Economy Session key must leave direct-storage manifest');
for(const key of [
  'gensrpg_dc048_pending_trap_v1',
  'gensrpg_dc052_special_branch_v1',
  'gensrpg_dungeon_runtime_v2',
  'gensrpg_rpg_gameplay_by_profile_v1'
]) assert.ok(keys.has(key),'deferred key missing from manifest: '+key);

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 9',
  indexBlob:blob,
  selected:'gensrpg_dc067_challenge_history',
  selectedOwner:'dungeonCore051ExplorationPolish',
  selectedDirectAccesses:{reads:0,writes:0},
  coreAccesses:{reads:1,writes:1},
  semantics:{recentWindow:12,persistedHistory:24},
  targetBlob:'7663392f163aac32c4c3b918cbce67472856b3b6',
  state:'migrated',
  migrated:['economy session'],
  deferred:['pending trap','special branch','gameplay mirror','dungeon runtime v2']
},null,2));
