const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const graph=read('tests/gens_phase2_runtime_load_graph_v11411.test.cjs');
const runtime=read('assets/gensrpg/dungeon/progression-runtime-v1.js');
const main=read('.github/workflows/main.yml');
const preview=read('preview.html');
const sw=read('service-worker.js');
const dungeonChar=read('tests/gens_progression_authority_characterization_v11411.test.cjs');
const dungeonManual=read('tests/gens_manual_xp_statpoints_characterization_v11411.test.cjs');
const captureOwner=read('tests/gens_phase4_storage_capture_progress_owner_v1.test.cjs');
const captureParity=read('tests/gens_phase4_storage_capture_progress_parity_v1.test.cjs');

const legacyPath='assets/gensrpg/dungeon/progression-runtime-v1.js';

assert.match(graph,/notReachablePhase2[\s\S]*progression-runtime-v1\.js/,
  'legacy progression runtime must remain explicitly classified outside the production graph');
assert.equal(main.includes(legacyPath),false,'Pages must not inject the legacy progression wrapper');
assert.equal(preview.includes(legacyPath),false,'preview must not inject the legacy progression wrapper');
assert.equal(sw.includes('./'+legacyPath),false,'PWA cache must not make the inert legacy progression wrapper a production entry');
assert.match(runtime,/function install\(rt=R\)/,'legacy progression artifact must remain identifiable as an installable wrapper');
assert.match(runtime,/rt\.changeXP=wrapped/,'legacy artifact must remain recognized as a changeXP wrapper, not a Core candidate');
assert.match(runtime,/legacyChangeXP/,'legacy artifact owns compatibility wrapping and therefore must not be reactivated as Core');

for(const name of [
  'dungeonSyncProgressionForState',
  'dungeonRpgLevelFromXp',
  'awardDungeonDefeatXp',
  'dungeonRecordCombatReward'
]){
  assert.ok(dungeonChar.includes(name),'existing Dungeon authority characterization missing '+name);
}
assert.match(dungeonChar,/xpPerLevel/,'Dungeon progression characterization must expose configurable XP-per-level');
assert.match(dungeonChar,/statPointsPerLevel/,'Dungeon progression characterization must expose configurable stat-points-per-level');
assert.match(dungeonManual,/dungeonSyncProgressionForState/,'manual Dungeon XP must reuse canonical Dungeon sync');
assert.match(dungeonManual,/dungeonHandleLevelUp071/,'manual Dungeon XP must reuse canonical Dungeon level-up lifecycle');

assert.match(captureOwner,/Capture keeps ownership of defaults and normalization/,
  'Capture business progression rules must stay owned by Capture');
for(const key of ['xpMultiplier','statCap','statPointsPerLevel','talentEvery','maxMoves']){
  assert.ok(captureParity.includes(key),'Capture progression contract missing '+key);
}
assert.match(captureParity,/gensrpg_capture_progress_v2_/,
  'Capture progression rules must remain profile-scoped');

assert.equal(fs.existsSync(path.join(root,'assets/gensrpg/core/progression-v1.js')),false,
  'preaudit must not silently introduce a Core progression implementation');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Progression XP preaudit — structural gate',
  legacyDungeonWrapper:{path:legacyPath,productionReachable:false,reactivate:false},
  dungeon:{
    nativeAuthorities:['dungeonRpgLevelFromXp','dungeonSyncProgressionForState','awardDungeonDefeatXp','dungeonRecordCombatReward','dungeonHandleLevelUp071'],
    configurableMarkers:['xpPerLevel','statPointsPerLevel']
  },
  capture:{
    businessOwner:'Capture',
    configurableMarkers:['xpMultiplier','statCap','statPointsPerLevel','talentEvery','maxMoves'],
    profileScoped:true
  },
  conclusion:'do not promote Dungeon progression or the old wrapper as shared Core; exact inline preaudit still required',
  runtimeChanged:false
},null,2));
