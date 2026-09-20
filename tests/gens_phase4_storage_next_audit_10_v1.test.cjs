const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));

assert.deepEqual(manifest.totals,{
  totalAccesses:189,
  resolvedAccesses:124,
  unresolvedAccesses:65,
  distinctResolvedKeys:22
},'Audit 10 must start from Challenge History GREEN storage totals');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:157,resolved:107,unresolved:50,distinctKeys:14
},'Audit 10 must start from Challenge History GREEN Dungeon totals');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8174580);
assert.equal(blob,'30487d09481e11e5883faca1a6e49727d9cecfb6');

function block(id){
  const m=src.match(new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const mj=block('dungeonMj72_2Script');
assert.match(mj,/const GENS_DUNGEON_SCENE_KEY="gensrpg_dungeon_scene_v1"/);
assert.equal((mj.match(/localStorage\.getItem\(GENS_DUNGEON_SCENE_KEY\)/g)||[]).length,1,'Dungeon Scene must have one direct read in audit');
assert.equal((mj.match(/localStorage\.setItem\(GENS_DUNGEON_SCENE_KEY,/g)||[]).length,1,'Dungeon Scene must have one direct write in audit');
assert.equal((mj.match(/localStorage\.removeItem\(GENS_DUNGEON_SCENE_KEY\)/g)||[]).length,0,'Dungeon Scene must not have removeItem');
assert.match(mj,/function loadDungeonSceneElements\(\)\{try\{const a=JSON\.parse\(localStorage\.getItem\(GENS_DUNGEON_SCENE_KEY\)\|\|"\[\]"\);return Array\.isArray\(a\)\?a:\[\]\}catch\(e\)\{return \[\]\}\}/);
assert.match(mj,/function saveDungeonSceneElements\(a\)\{localStorage\.setItem\(GENS_DUNGEON_SCENE_KEY,JSON\.stringify\(a\|\|\[\]\)\);try\{renderDungeonMasterScene\(\)\}catch\(e\)\{\}\}/);
assert.equal(mj.includes('GensStorageV1.readJson(localStorage,GENS_DUNGEON_SCENE_KEY,[])'),false,'audit must not pre-apply Dungeon Scene read raccord');
assert.equal(mj.includes('GensStorageV1.writeJson(localStorage,GENS_DUNGEON_SCENE_KEY,a||[])'),false,'audit must not pre-apply Dungeon Scene write raccord');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
const scene=keys.get('gensrpg_dungeon_scene_v1');
assert.ok(scene,'Dungeon Scene candidate must remain direct during audit');
assert.deepEqual(scene.domains,['dungeon']);
assert.deepEqual(scene.sources,['inline:dungeonMj72_2Script']);
assert.deepEqual(scene.ops,['getItem','setItem']);

for(const key of [
  'gensrpg_dc048_pending_trap_v1',
  'gensrpg_dc052_special_branch_v1',
  'gensrpg_dungeon_session_eco_160_',
  'gensrpg_dungeon_runtime_v2',
  'gensrpg_rpg_gameplay_by_profile_v1'
]) assert.ok(keys.has(key),'deferred key missing from manifest: '+key);

const sourceRead='JSON.parse(localStorage.getItem(GENS_DUNGEON_SCENE_KEY)||"[]")';
const targetRead='GensStorageV1.readJson(localStorage,GENS_DUNGEON_SCENE_KEY,[])';
const sourceWrite='localStorage.setItem(GENS_DUNGEON_SCENE_KEY,JSON.stringify(a||[]))';
const targetWrite='GensStorageV1.writeJson(localStorage,GENS_DUNGEON_SCENE_KEY,a||[])';
assert.equal(src.split(sourceRead).length-1,1);
assert.equal(src.split(sourceWrite).length-1,1);
const target=src.replace(sourceRead,targetRead).replace(sourceWrite,targetWrite);
const targetBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+Buffer.byteLength(target)+'\0'),Buffer.from(target)
])).digest('hex');
assert.equal(Buffer.byteLength(target),8174580);
assert.equal(targetBlob,'ee7b474802d8bb3b1d20e3aaf2507c4666fbd054');

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 10',
  indexBlob:blob,
  selected:'gensrpg_dungeon_scene_v1',
  selectedOwner:'dungeonMj72_2Script',
  selectedDirectAccesses:{reads:1,writes:1,removes:0},
  targetBlob,
  deferred:['pending trap','special branch','economy session dynamic','gameplay mirror','dungeon runtime v2']
},null,2));
