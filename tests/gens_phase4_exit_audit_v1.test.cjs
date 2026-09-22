'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));

const proofs=[
  ['assets','tests/gens_asset_resolver_final_audit_v1.test.cjs'],
  ['storage','tests/gens_phase4_storage_exit_audit_13_v1.test.cjs'],
  ['stats','tests/gens_phase4_stats_s11_core_snapshot_raccord_v1.test.cjs'],
  ['inventory-equipped','tests/gens_phase4_inventory_equipped_view_raccord_v1.test.cjs'],
  ['equipment-bonus-sets','tests/gens_phase4_inventory_equipment_bonus_raccord_v1.test.cjs'],
  ['equipment-evolution','tests/gens_phase4_inventory_equipment_evolution_raccord_v1.test.cjs'],
  ['dice-threshold','tests/gens_phase4_dice_first_raccord_v1.test.cjs'],
  ['dice-d10048','tests/gens_phase4_dice_d10048_raccord_v1.test.cjs'],
  ['progression-level','tests/gens_phase4_progression_xp_first_raccord_v1.test.cjs'],
  ['progression-xp-into-level','tests/gens_phase4_progression_xp_into_level_raccord_v1.test.cjs'],
  ['progression-earned-points','tests/gens_phase4_progression_earned_skill_points_raccord_v1.test.cjs'],
  ['text-utils','tests/gens_phase4_text_utils_u1_room_creator_raccord_v1.test.cjs']
];

const proofResults=[];
for(const [domain,rel] of proofs){
  assert.equal(exists(rel),true,'missing Phase 4 proof: '+rel);
  const run=spawnSync(process.execPath,[path.join(root,rel)],{
    cwd:root,encoding:'utf8',maxBuffer:16*1024*1024
  });
  assert.equal(run.status,0,
    'Phase 4 proof failed for '+domain+' via '+rel+'\n'+String(run.stdout||'')+'\n'+String(run.stderr||''));
  proofResults.push(domain);
}

const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');
const sw=read('service-worker.js');
const graph=read('tests/gens_phase2_runtime_load_graph_v11411.test.cjs');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));

const connected=[
  'assets/gensrpg/core/asset-resolver-v1.js',
  'assets/gensrpg/core/storage-v1.js',
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/progression-v1.js',
  'assets/gensrpg/core/stats-normalization-v1.js',
  'assets/gensrpg/core/stats-value-engine-v1.js',
  'assets/gensrpg/core/stats-hero-values-v1.js',
  'assets/gensrpg/core/stats-modifier-provider-v1.js',
  'assets/gensrpg/core/stats-derived-values-v1.js',
  'assets/gensrpg/core/stats-snapshot-v1.js',
  'assets/gensrpg/core/inventory-equipped-view-v1.js',
  'assets/gensrpg/core/equipment-bonus-sets-v1.js',
  'assets/gensrpg/core/equipment-evolution-v1.js',
  'assets/gensrpg/core/text-utils-v1.js'
];

for(const rel of connected){
  assert.equal(exists(rel),true,'connected Phase 4 Core service missing: '+rel);
  assert.ok(owners.files?.[rel],'connected Phase 4 Core owner missing: '+rel);
  const name=path.basename(rel);
  if(rel.endsWith('dice-v1.js')||rel.endsWith('asset-resolver-v1.js')||rel.endsWith('progression-v1.js')){
    const sourceIndex=read('index.html');
    assert.ok(sourceIndex.includes(rel),'source index must load direct Core boundary service: '+rel);
  }else if(rel.endsWith('storage-v1.js')){
    assert.ok(read('index.html').includes(rel),'source index must bootstrap Core storage');
  }else{
    assert.ok(pages.includes(rel),'Pages must load connected Core service: '+rel);
    assert.ok(preview.includes(rel),'preview must load connected Core service: '+rel);
  }
  assert.ok(graph.includes("'"+rel+"'"),'runtime graph must mention connected Phase 4 service: '+rel);
}

for(const rel of [
  'assets/gensrpg/core/text-utils-v1.js',
  'assets/gensrpg/core/inventory-equipped-view-v1.js',
  'assets/gensrpg/core/equipment-bonus-sets-v1.js',
  'assets/gensrpg/core/equipment-evolution-v1.js'
]){
  assert.ok(sw.includes('./'+rel),'PWA must precache connected Phase 4 service: '+rel);
}

const coreDir=path.join(root,'assets','gensrpg','core');
const eventBusFiles=fs.readdirSync(coreDir).filter(name=>/event[-_]?bus/i.test(name));
assert.deepEqual(eventBusFiles,[],'Phase 4 decision forbids introducing a generic Core Event Bus');
assert.doesNotMatch(pages,/GensEventBus|event-bus-v1/i,'Pages must not load an unapproved generic Event Bus');
assert.doesNotMatch(preview,/GensEventBus|event-bus-v1/i,'preview must not load an unapproved generic Event Bus');

const storageExit=read('tests/gens_phase4_storage_exit_audit_13_v1.test.cjs');
assert.match(storageExit,/autonomousCommonCandidates,\[\]/,
  'Storage exit proof must keep zero autonomous common candidates');
assert.match(storageExit,/close common Storage extraction/,
  'Storage exit proof must explicitly close common Storage extraction');

const assetExit=read('tests/gens_asset_resolver_final_audit_v1.test.cjs');
assert.match(assetExit,/remainingResolverDebts:\{\}/,
  'Asset Resolver final audit must keep zero remaining resolver debts');
assert.match(assetExit,/nextSubLots:\[\]/,
  'Asset Resolver final audit must keep no remaining Phase 4 resolver sublot');

const dice=read('tests/gens_phase4_dice_d10048_raccord_v1.test.cjs');
assert.match(dice,/otherDiceSeams:'deferred'/,
  'remaining Dice seams must stay explicitly deferred rather than silently treated as common Core work');

const progression=read('tests/gens_phase4_progression_earned_skill_points_raccord_v1.test.cjs');
assert.match(progression,/target:'GensProgressionV1\.earnedSkillPointsFromLevel'/,
  'Progression runtime owner must keep the Core earned-points target');

const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
assert.match(roadmap,/Critère de sortie : index\.html ne contient plus les moteurs communs\./,
  'Phase 4 exit criterion missing from roadmap');

console.log(JSON.stringify({
  scenario:'Phase 4 exit audit',
  proofs:proofResults,
  connectedCoreServices:connected.length,
  genericEventBusCreated:false,
  storageAutonomousCommonCandidates:0,
  assetResolverRemainingDebts:0,
  decision:'phase4-exit-ready'
},null,2));
