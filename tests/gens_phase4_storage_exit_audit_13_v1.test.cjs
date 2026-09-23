const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));
const inline=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8'));
const runtime=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_RUNTIME_OWNERS.json'),'utf8'));
const storageSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','storage-v1.js'),'utf8');

function gitBlob(buffer){
  return crypto.createHash('sha1').update(Buffer.concat([
    Buffer.from('blob '+buffer.length+'\0'),buffer
  ])).digest('hex');
}

const BLOB='0aaafb2eaf42b7bce6520efa633b6b6a6ffbe92a';
assert.equal(bytes.length,8174315);
assert.equal(gitBlob(bytes),BLOB);
assert.equal(manifest.sourceIndexBlob,BLOB);
assert.deepEqual(manifest.totals,{
  totalAccesses:182,resolvedAccesses:117,unresolvedAccesses:65,distinctResolvedKeys:19
});

const classification={
  'gensrpg_dc048_pending_trap_v1':'phase7-dungeon',
  'gensrpg_dc052_special_branch_v1':'phase7-dungeon',
  'gensrpg_dc064_door_challenge_':'phase7-dungeon',
  'gensrpg_dc064_door_challenge_*':'phase7-dungeon',
  'gensrpg_dungeon_core01_device_hero_v1':'phase7-dungeon',
  'gensrpg_dungeon_core02_v1':'phase7-dungeon',
  'gensrpg_dungeon_runtime_v2':'phase7-dungeon',
  'gensrpg_session_profile_100_v1':'phase7-dungeon',
  'z40k_session_active_v1':'phase7-dungeon',

  'gensrpg_forced_mode_reload_155':'phase5-shell',
  'gensrpg_game_profile_active_v1':'phase5-shell-session',

  'gensrpg_dungeon_tactical098_v1':'phase8-tactical',
  'gensrpg_game_profiles_v1':'phase8-compat-repair',

  'gensrpg_rpg_gameplay_by_profile_v1':'phase9-capture',
  'gensrpg_shared_entities_scoped_v1__*':'phase9-capture',
  'gensrpg_shared_entities_scoped_v1__family__creature':'phase9-capture',
  'gensrpg_shared_entities_v1__':'phase9-capture',
  'gensrpg_shared_entities_v1__family__creature':'phase9-capture',

  'gensrpg_last_html_build':'core-diagnostic-scalar'
};

const manifestKeys=(manifest.resolvedKeys||[]).map(x=>x.key).sort();
const classifiedKeys=Object.keys(classification).sort();
assert.deepEqual(classifiedKeys,manifestKeys,'Audit 13 must classify every remaining resolved direct-storage family exactly once');

const counts={};
for(const category of Object.values(classification)) counts[category]=(counts[category]||0)+1;
assert.equal(Object.keys(classification).length,19);
assert.equal(Object.values(classification).filter(x=>x==='phase7-dungeon').length,9);
assert.equal(Object.values(classification).filter(x=>x.startsWith('phase5-')).length,2);
assert.equal(Object.values(classification).filter(x=>x.startsWith('phase8-')).length,2);
assert.equal(Object.values(classification).filter(x=>x==='phase9-capture').length,5);
assert.equal(Object.values(classification).filter(x=>x==='core-diagnostic-scalar').length,1);

function assertInlineDomain(source,domain){
  const id=source.replace(/^inline:/,'');
  const entry=inline.blocks[id];
  assert.ok(entry,'missing inline owner '+id);
  assert.equal(entry.status,'active','owner must remain active: '+id);
  assert.equal(entry.primaryDomain,domain,'unexpected owner domain: '+id);
}

for(const entry of manifest.resolvedKeys){
  const cat=classification[entry.key];
  assert.ok(cat,'unclassified key '+entry.key);
  for(const source of entry.sources||[]){
    if(source.startsWith('inline:')){
      if(cat.startsWith('phase7-')) assertInlineDomain(source,'dungeon');
      if(cat==='phase5-shell') assertInlineDomain(source,'shell');
      if(cat==='phase9-capture') assertInlineDomain(source,'capture');
      if(cat==='core-diagnostic-scalar') assertInlineDomain(source,'core');
    }
    if(source.startsWith('file:')){
      const file=source.slice(5);
      const owner=runtime.files[file];
      assert.ok(owner,'missing runtime owner '+file);
      if(entry.key==='gensrpg_dungeon_runtime_v2'||entry.key==='z40k_session_active_v1') assert.equal(owner.domain,'dungeon');
      if(entry.key==='gensrpg_game_profiles_v1') assert.equal(owner.domain,'tactical');
    }
  }
}

// Two cross-seam families are intentionally not forced into a misleading current-domain rule.
assert.equal(classification['gensrpg_game_profile_active_v1'],'phase5-shell-session');
assert.equal(classification['gensrpg_dungeon_tactical098_v1'],'phase8-tactical');

// Generic Core Storage stays deliberately small; Audit 13 must not grow it merely
// to make remove/scalar/session families convenient.
assert.match(storageSrc,/function readJson\(/);
assert.match(storageSrc,/function writeJson\(/);
assert.equal(/function\s+remove/.test(storageSrc),false,'Audit 13 must not extend Core Storage with remove semantics');
assert.equal(/readScalar|writeScalar|migrate/i.test(storageSrc),false,'Audit 13 must not invent scalar/migration APIs');

const autonomousCommonCandidates=Object.entries(classification)
  .filter(([,category])=>category==='core-json-autonomous')
  .map(([key])=>key);
assert.deepEqual(autonomousCommonCandidates,[],
  'No remaining family is proven to be an autonomous common JSON Storage micro-lot');

console.log(JSON.stringify({
  scenario:'Phase 4 Storage exit Audit 13',
  indexBlob:BLOB,
  totals:manifest.totals,
  remainingFamilies:19,
  classificationCounts:counts,
  autonomousCommonCandidates,
  decision:'close common Storage extraction; defer remaining state to Phase 5/7/8/9 owners and continue Phase 4 with Core Stats'
},null,2));
