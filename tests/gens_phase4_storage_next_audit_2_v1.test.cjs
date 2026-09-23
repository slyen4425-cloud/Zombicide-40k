const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const manifest=JSON.parse(read('docs/GENSRPG_PHASE2_STORAGE_OWNERS.json'));
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const index=read('index.html');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');

assert.deepEqual(manifest.totals,{
  totalAccesses:181,
  resolvedAccesses:116,
  unresolvedAccesses:65,
  distinctResolvedKeys:19
},'current Phase 4 storage totals must include the Dungeon Primary Selection, Dungeon Deck, Manual MJ and Economy Rules and Challenge Library Core raccords');

const primary=manifest.resolvedKeys.find(x=>x.key==='gensrpg_dungeon_primary_selection_v167833');
assert.equal(primary,undefined,'migrated primary Dungeon selection key must leave the direct-storage manifest');

for(const rel of [
  'assets/dungeon/dungeon-authored-action-fix-167857.js',
  'assets/dungeon/dungeon-authored-bootstrap-167849.js',
  'assets/dungeon/dungeon-large-room-support-167834.js',
  'assets/dungeon/dungeon-world-session-bridge-167832.js'
]){
  assert.equal(owners.files?.[rel]?.domain,'dungeon',rel+' must remain Dungeon-owned');
}

const storage='assets/gensrpg/core/storage-v1.js';
const large='assets/dungeon/dungeon-large-room-support-167834.js';
assert.equal((index.match(/assets\/gensrpg\/core\/storage-v1\.js/g)||[]).length,1,'Source index must bootstrap Core storage exactly once');
assert.ok(workflow.indexOf(storage)>=0&&workflow.indexOf(large)>=0,'Pages fallback composition must contain Core storage and Large Room Support');
assert.ok(workflow.indexOf(storage)<workflow.indexOf(large),'Pages fallback must keep Core storage before Large Room Support');
assert.ok(preview.indexOf(large)>=0,'Preview must still inject Large Room Support');
assert.equal(preview.indexOf(storage),-1,'Preview must inherit Core storage from source index instead of injecting a duplicate');

for(const rel of [
  'assets/dungeon/dungeon-room-runtime-167822.js',
  'assets/dungeon/dungeon-world-runtime-167823.js',
  'assets/dungeon/dungeon-authored-event-cells-167877.js',
  'assets/dungeon/dungeon-authored-runtime-167839.js'
]){
  const src=read(rel);
  assert.match(src,/gensrpg_dungeon_runtime_v2/,rel+' must remain excluded while the Dungeon runtime key is deferred');
  assert.match(src,/localStorage/,rel+' is intentionally not migrated in this audit');
}

const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
assert.match(stats,/localStorage\.setItem\(R\.key\(hero\)/,'Core Stats still owns a dynamic hero-state persistence seam');
assert.equal(owners.files?.['assets/gensrpg/gens-rpg-stats-clean-167874.js']?.owner,'Core Stats','stats seam must remain with the future Stats service lot');

const tactical=read('assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js');
assert.match(tactical,/gensrpg_dungeon_runtime_v2/,'Tactical adapter reads the deferred Dungeon runtime key');
assert.match(tactical,/rt\.key\(id\)/,'Tactical adapter also writes dynamic hero state and is not a storage-only micro-lot');

const repair=read('assets/gensrpg/gens-rpg-runtime-repair-1678106.js');
assert.match(repair,/gensrpg_game_profiles_v1/,'runtime repair still owns profile repair storage');
assert.match(repair,/gensrpg_game_profile_active_v1/,'runtime repair mixes JSON profile repair with scalar active-profile storage');
assert.match(repair,/gensrpg_session_family_guard_v1/,'runtime repair mixes JSON profile repair with scalar family storage');

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 2',
  baseTotals:manifest.totals,
  deferred:{
    dungeonRuntimeKey:'gensrpg_dungeon_runtime_v2',
    stats:'future Phase 4 Stats lot',
    tactical:'runtime state + dynamic hero state',
    runtimeRepair:'mixed JSON and scalar profile repair',
    primarySelection:'migrated through Core Storage; Dungeon remains business owner; runtime_v2 remains deferred'
  },
  nextInspection:'continue with remaining isolated storage families; keep runtime_v2, Stats and Tactical deferred'
},null,2));
