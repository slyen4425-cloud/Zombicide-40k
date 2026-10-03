'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+indexBuf.length+'\0'),
  indexBuf
])).digest('hex');

assert.equal(indexBuf.length,8168382,'Phase 7 exit audit must target the exact current runtime');
assert.equal(gitBlob,'1d4bd0f6eddb6a58fa0939b666bbebdbb07dc3b1',
  'Phase 7 exit audit runtime blob drifted');

const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
assert.match(roadmap,/## Phase 7 — Isoler Dungeon exploration[\s\S]*Critère de sortie : exploration complète sans dépendance UI Tactical globale\./,
  'Phase 7 official exit criterion must remain explicit');
assert.match(roadmap,/## Phase 8 — Consolider Tactical/,
  'Phase 8 must remain the next roadmap phase after Dungeon exploration');

const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
assert.equal(contract.publicRuntimeApi,'GensDungeonV1');
for(const owned of ['Dungeon world state','exploration','movement','events','combat trigger','Dungeon persistence state']){
  assert.ok(contract.owns.includes(owned),'Dungeon contract must own '+owned);
}
assert.ok(contract.forbidden.includes('Tactical combat resolution'),
  'Dungeon must forbid Tactical combat resolution');
assert.ok(contract.consumes.includes('future Tactical public combat contract'),
  'Dungeon combat trigger boundary must target the Tactical public contract');
assert.doesNotMatch(entry,/GensRpgTactical|TacticalCombat|gtv2|tactical/i,
  'Dungeon public exploration entry must not consume Tactical UI/runtime globals');
assert.doesNotMatch(entry,/document\.|MutationObserver|setTimeout|setInterval|addEventListener/,
  'Dungeon public exploration entry must remain free of UI/timer/listener authority');

function stripComments(src){
  return src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
}
const explorationOwners=[
  'assets/dungeon/dungeon-room-runtime-167822.js',
  'assets/dungeon/dungeon-world-runtime-167823.js',
  'assets/dungeon/dungeon-authored-runtime-167839.js',
  'assets/dungeon/dungeon-world-session-bridge-167832.js',
  'assets/dungeon/dungeon-authored-return-persist-167862.js',
  'assets/dungeon/dungeon-authored-action-fix-167857.js',
  'assets/dungeon/dungeon-exact-trap-runtime-167845.js',
  'assets/dungeon/dungeon-zone-links-167846.js',
  'assets/dungeon/dungeon-authored-bootstrap-167849.js',
  'assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js',
  'assets/dungeon/dungeon-authored-cache-guard-167849.js',
  'assets/dungeon/dungeon-authored-cache-ux-167853.js',
  'assets/dungeon/dungeon-authored-cache-visual-167852.js',
  'assets/dungeon/dungeon-authored-event-cells-167877.js',
  'assets/dungeon/dungeon-authored-final-exit-167875.js',
  'assets/dungeon/dungeon-large-room-support-167834.js',
  'assets/dungeon/dungeon-event-runtime-fix-167878.js',
  'assets/dungeon/dungeon-source-render-stability-167877.js'
];
for(const rel of explorationOwners){
  const code=stripComments(read(rel));
  assert.doesNotMatch(code,/GensRpgTactical|TacticalCombat|gtv2|tactical/i,
    rel+' must not consume a global Tactical UI/runtime authority during exploration');
}

const structural=read('tests/gens_phase7_dungeon_exploration_authority_characterization_v1.test.cjs');
assert.match(structural,/Authored exploration runtime must not consume Tactical UI\/runtime directly/,
  'Phase 7 structural characterization must retain the no-Tactical dependency guard');

const browser=read('tests/gens_phase7_dungeon_exploration_authority_browser_characterization_v1.test.cjs');
for(const proof of [
  /generatedBefore\.tacticalOverlay,false/,
  /generatedBefore\.tacticalBattle,false/,
  /authoredBefore\.tacticalOverlay,false/,
  /authoredBefore\.tacticalBattle,false/,
  /authoredAfter\.tacticalOverlay,false/,
  /authoredAfter\.tacticalBattle,false/
]){
  assert.match(browser,proof,'Phase 7 browser proof must keep exploration independent from Tactical UI/battle state');
}
assert.match(browser,/generated adventure explore must delegate past Authored travel/,
  'generated exploration path must remain covered');
assert.match(browser,/Authored travel must enter the selected World Builder node/,
  'authored exploration path must remain covered');

const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
assert.match(workflow,/Caractériser l'autorité exploration Dungeon Phase 7[\s\S]*gens_phase7_dungeon_exploration_authority_characterization_v1\.test\.cjs/,
  'structural exploration characterization must remain wired to CI');
assert.match(workflow,/Caractériser l'autorité exploration Dungeon Phase 7 dans Chromium[\s\S]*gens_phase7_dungeon_exploration_authority_browser_characterization_v1\.test\.cjs/,
  'browser exploration characterization must remain wired to CI');

for(const prerequisite of [
  'gens_force_to_tactical_snapshot_v11411.test.cjs',
  'gens_agility_ranged_hit_attribution_v11411.test.cjs',
  'gens_stat_editor_game_display_semantics_v11411.test.cjs',
  'gens_phase4_stats_s9_armor_characterization_v1.test.cjs',
  'gens_v11411_final_melee_damage_contract.test.cjs'
]){
  assert.ok(workflow.includes(prerequisite),
    'Phase 8 prerequisite guard must remain wired: '+prerequisite);
}

console.log(JSON.stringify({
  scenario:'Phase 7 official exit audit',
  runtime:{bytes:indexBuf.length,gitBlob},
  criterion:'exploration complete without global Tactical UI dependency',
  dungeon:{
    publicApi:contract.publicRuntimeApi,
    explorationOwnersChecked:explorationOwners.length,
    tacticalUiGlobalDependency:false,
    tacticalCombatResolutionOwned:false,
    combatTriggerBoundaryOwned:true
  },
  browserProof:{
    generatedExplorationWithoutTacticalUi:true,
    authoredExplorationWithoutTacticalUi:true
  },
  phase8Prerequisites:{
    statsToSnapshot:true,
    hitAttribution:true,
    displaySemantics:true,
    armorSemantics:true,
    finalDamageAndExplanation:true
  },
  phase7ExitReady:true,
  nextPhase:'Phase 8 — Tactical consolidation'
},null,2));
