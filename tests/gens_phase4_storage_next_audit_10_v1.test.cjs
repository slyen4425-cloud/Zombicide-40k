const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));

assert.deepEqual(manifest.totals,{
  totalAccesses:182,
  resolvedAccesses:117,
  unresolvedAccesses:65,
  distinctResolvedKeys:19
},'Audit 10 guard must follow the migrated Dungeon Scene storage totals');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:152,resolved:102,unresolved:50,distinctKeys:11
},'Audit 10 guard must follow the migrated Dungeon Scene Dungeon totals');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8174346);
assert.equal(blob,'8da7afa3c986f29e740eee1748dcc0ec0f8f75bc');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const mj=block('dungeonMj72_2Script');
assert.match(mj,/const GENS_DUNGEON_SCENE_KEY="gensrpg_dungeon_scene_v1"/);
assert.equal((mj.match(/localStorage\.getItem\(GENS_DUNGEON_SCENE_KEY\)/g)||[]).length,0,'migrated Dungeon Scene must have no direct read');
assert.equal((mj.match(/localStorage\.setItem\(GENS_DUNGEON_SCENE_KEY,/g)||[]).length,0,'migrated Dungeon Scene must have no direct write');
assert.equal((mj.match(/localStorage\.removeItem\(GENS_DUNGEON_SCENE_KEY\)/g)||[]).length,0,'Dungeon Scene must have no removeItem');

assert.equal((mj.match(/GensStorageV1\.readJson\(localStorage,GENS_DUNGEON_SCENE_KEY,\[\]\)/g)||[]).length,1,'Dungeon Scene must use one Core read');
assert.equal((mj.match(/GensStorageV1\.writeJson\(localStorage,GENS_DUNGEON_SCENE_KEY,a\|\|\[\]\)/g)||[]).length,1,'Dungeon Scene must use one Core write');
assert.match(mj,/function loadDungeonSceneElements\(\)\{try\{const a=GensStorageV1\.readJson\(localStorage,GENS_DUNGEON_SCENE_KEY,\[\]\);return Array\.isArray\(a\)\?a:\[\]\}catch\(e\)\{return \[\]\}\}/);
assert.match(mj,/function saveDungeonSceneElements\(a\)\{GensStorageV1\.writeJson\(localStorage,GENS_DUNGEON_SCENE_KEY,a\|\|\[\]\);try\{renderDungeonMasterScene\(\)\}catch\(e\)\{\}\}/);

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.equal(keys.has('gensrpg_dungeon_scene_v1'),false,'migrated Dungeon Scene key must leave direct-storage manifest');

assert.equal(keys.has('gensrpg_dungeon_session_eco_160_'),false,'migrated Economy Session key must leave direct-storage manifest');
for(const key of [
  'gensrpg_dc048_pending_trap_v1',
  'gensrpg_dc052_special_branch_v1',
  'gensrpg_dungeon_runtime_v2',
  'gensrpg_rpg_gameplay_by_profile_v1'
]) assert.ok(keys.has(key),'deferred key missing from manifest: '+key);

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 10',
  indexBlob:blob,
  selected:'gensrpg_dungeon_scene_v1',
  selectedOwner:'dungeonMj72_2Script',
  selectedDirectAccesses:{reads:0,writes:0,removes:0},
  coreAccesses:{reads:1,writes:1},
  state:'migrated',
  migrated:['economy session'],
  deferred:['pending trap','special branch','gameplay mirror','dungeon runtime v2']
},null,2));
