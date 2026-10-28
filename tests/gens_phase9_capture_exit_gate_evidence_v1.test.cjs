'use strict';
// Phase 9 exit-evidence inventory. A GREEN result means the inventory is
// honest, NOT that the Phase 9 autonomous-Capture exit gate is satisfied.
// Never modifies production index, gameplay data, or historical fixtures.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const entry=read('assets/gensrpg/capture/entry-v1.js');
const session=read('assets/gensrpg/capture/session-start-v1.js');
const hub=read('assets/gensrpg/capture/hub-entry-v1.js');
const screen=read('assets/gensrpg/capture/screen-return-v1.js');
const world=read('assets/gensrpg/capture/world-exploration-v1.js');
const roster=read('assets/gensrpg/capture/team-roster-v1.js');
const combat=read('assets/gensrpg/capture/combat-core-v1.js');
const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
const browserLaunch=read('tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs');
const browserResume=read('tests/gens_phase9_capture_persisted_profile_without_dungeon_style_resume_characterization_v1.test.cjs');
const browserVictory=read('tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs');
const full=JSON.parse(read('docs/GENSRPG_PHASE9_CAPTURE_EXIT_GATE_2026-10-09.json'));
assert.match(roadmap,/Critère de sortie : Capture peut démarrer sans runtime Dungeon\/Survie actif\./);
assert.match(roadmap,/fonctionner et se fermer comme module autonome de premier niveau/);
assert.equal(contract.module,'capture');
assert.equal(contract.status,'partial-runtime-loaded','Capture contract must not claim autonomy without an owned runtime');
assert.equal(contract.activatedPhase,9);
assert.equal(contract.publicRuntimeApi,'GensCaptureV1');
assert.deepEqual(Object.keys(contract.publicEntries).sort(),['moduleLaunch','moduleScreenReturn']);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);
assert.match(entry,/sessionStartOwner\.start\(\)/);
assert.doesNotMatch(entry,/\bDungeonCore|GensDungeon|GensSurvival|DungeonRuntime|isDungeonMode\b/);
assert.match(session,/function start\(\)/);
assert.match(session,/function dispose\(\)/);
assert.match(session,/bindings\.enterWorld\(\)/);
assert.match(session,/bindings\.saveWorld\(ws\)/);
assert.match(hub,/function enterWorld\(\)/);
assert.match(hub,/function dispose\(\)/);
assert.match(hub,/renderCaptureWorldHub/);
assert.match(screen,/shell\.register\("capture",returnToPrimaryView\)/);
assert.match(screen,/function dispose\(\)/);
assert.match(world,/function captureWorldState\(\)/);
assert.match(world,/function renderCaptureWorldHub\(\)/);
assert.match(world,/function captureGenerateEncounter\(\)/);
assert.doesNotMatch(world,/function captureAwardBattleXp\(/);
assert.match(roster,/function captureTeamEntityRoster\(/);
assert.match(roster,/function moveCreatureToReserve\(/);
assert.match(roster,/function moveCreatureToTeam\(/);
assert.match(roster,/function saveHeroCreatureState\(/);
assert.doesNotMatch(roster,/function captureStartBattleAutomatic\(/);
assert.ok(contract.owns.some(x=>x.includes('Capture Team / Reserve V1 owner')),'module contract documents the new owner');
assert.ok(contract.owns.some(x=>x.includes('Capture Combat Core V1 owner')),'module contract documents physically extracted combat core');
assert.match(combat,/function gensCreateCaptureBattle\(/);
assert.match(combat,/function gensCaptureBattleEvaluateVictory\(/);
assert.match(combat,/function gensCaptureBattleRecall\(/);
assert.match(combat,/function gensCaptureBattleTargets\(/);
assert.doesNotMatch(roster,/function gensCreateCaptureBattle\(/);
assert.match(browserLaunch,/assert\.equal\(routing\.dungeonMode,false/);
assert.match(browserLaunch,/assert\.equal\(played\.day,2/);
assert.match(browserLaunch,/assert\.notEqual\(state\.captureHub,'none'/);
assert.match(browserResume,/await startDungeonAndLeaveSavedRuntime\(page\);/);
assert.match(browserResume,/const b=captureStartBattleAutomatic\(/);
assert.match(browserResume,/captureBattleFinishAndClose\(\)/);
assert.match(browserResume,/assert\.notEqual\(resumed\.hub,'none'/);
assert.match(browserResume,/resumed\.dungeonRuntime\?\.participants/);
assert.match(browserVictory,/await startDungeonAndLeaveSavedRuntime\(page\);/);
assert.match(browserVictory,/captureBattleUseAbility\('capture_basic_attack'\)/);
assert.match(browserVictory,/resumed\.dungeonRuntime\?\.participants/);
const existing=fs.readdirSync(path.join(root,'assets/gensrpg/capture')).sort();
const staged=JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
assert.equal(staged.schemaVersion,1);assert.equal(staged.productionActivated,false);
const stagedCaptureScripts=staged.classicScripts.filter(file=>file.startsWith('assets/gensrpg/capture/'));
assert.equal(stagedCaptureScripts.length,8,'every opt-in Capture script must be audited');
assert.equal(staged.captureEsmAdapters.length,9,'Lab author, World, roster, Hub, packaged composer, consented migration and read-only diagnosis');
assert.equal(staged.stagedExplicitProfileMigration?.schema,'gensrpg-capture-lab-profile-migration-v1');
assert.equal(staged.stagedExplicitProfileMigration?.productionActivated,false);
assert.equal(staged.stagedExplicitProfileMigration?.requiresConsent,true);
assert.equal(staged.stagedExplicitProfileMigration?.oneOwner,'assets/gensrpg/capture/team-roster-v1.js');
assert.equal(staged.stagedExplicitProfileMigration?.fullCatalogMigration,false);
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/saved-profile-lab-migration-v1.mjs'));
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/capture-official-hub-composition-v1.mjs'));
assert.ok(staged.coverage.includes('tests/gens_capture_official_hub_composition_v1.test.cjs'));
const migrationContract=read('assets/gensrpg/capture/saved-profile-lab-migration-v1.mjs');
assert.ok(migrationContract.includes('saveHeroState(heroId,next)'),'only original Capture roster writes approved migration');
assert.ok(migrationContract.includes('acknowledged!==plan.consentText'),'exact owner consent before migration');
assert.doesNotMatch(migrationContract,/localStorage\.|window\.captureStartWildBattle\s*=/,
 'migration must not own storage or install a global battle override');
const officialComposer=read('assets/gensrpg/capture/capture-official-hub-composition-v1.mjs');
assert.match(officialComposer,/createCaptureWorldLabWildTransactionV1/,'Hub must reuse the original World owner transaction');
assert.match(officialComposer,/createCaptureLabHubBattleCommandV1/,'Hub must reuse the validated single command');
assert.match(officialComposer,/delivery-manifest\.json/,'Hub must require the certified delivery manifest');
assert.doesNotMatch(officialComposer,/window\.captureStartWildBattle\s*=|localStorage\./,'no second runtime or storage authority');
assert.equal(staged.authoredSourceLabPin,'65e21792ff74aea9862e528c8dbfdb22797b6693');
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/combat-lab-authored-source-v1.mjs'));
assert.ok(staged.coverage.includes('tests/gens_capture_lab_authored_source_v1.test.cjs'));
const authored=read('assets/gensrpg/capture/combat-lab-authored-source-v1.mjs');
assert.match(authored,/exportEditorDrafts\(/,'native Combat Lab exporter is the sole skill/creature projection');
assert.doesNotMatch(authored,/localStorage|createCombatSession|createCombatRuntime|startSkill|location\.reload/,'catalog consumer owns neither storage nor combat execution');
assert.equal(staged.stagedHubBattleCommand,true);
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/capture-lab-hub-battle-command-v1.mjs'));
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/capture-lab-profile-readiness-v1.mjs'));
assert.equal(staged.readOnlyProfileReadiness?.productionActivated,false);
assert.equal(staged.readOnlyProfileReadiness?.hasWriter,false);
assert.equal(staged.readOnlyProfileReadiness?.usesCanonicalBridge,'assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs');
const profileReadiness=read('assets/gensrpg/capture/capture-lab-profile-readiness-v1.mjs');
assert.match(profileReadiness,/createCaptureSavedProfileBattleBridgeV1/,'read-only profile diagnosis must delegate to canonical battle bridge');
assert.doesNotMatch(profileReadiness,/localStorage\.|window\.captureStartWildBattle\s*=|saveHeroState\(heroId/,
 'readiness must not create another save or battle authority');
const hubCommand=read('assets/gensrpg/capture/capture-lab-hub-battle-command-v1.mjs');
assert.match(hubCommand,/combatPort\.startEncounter\(/,'Hub must use the existing single Combat owner');
assert.match(hubCommand,/transaction\.prepareWild\(/,'Hub must read the original World ticket');
assert.doesNotMatch(hubCommand,/localStorage|window\.|createCombatSession|createCombatRuntime|startSkill|location\.reload/,
  'Hub cannot own another storage, global old combat override, clock or damage rules');
assert.equal(staged.stagedWorldWildTransaction,true);
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/capture-world-lab-wild-transaction-v1.mjs'));
assert.ok(staged.coverage.includes('tests/gens_capture_world_lab_wild_transaction_v1.test.cjs'));
const wildPort=read('assets/gensrpg/capture/capture-world-lab-wild-transaction-v1.mjs');
assert.match(wildPort,/saveWorldState\(/,'only the original Capture world owner persists the stamped wild identity');
assert.match(wildPort,/consumeWildEncounter\(/,'only the original Capture world owner consumes the encounter after battle');
assert.match(wildPort,/createCaptureSavedProfileBattleBridgeV1\(/,'hero saving delegated to existing Capture saved-profile owner');
assert.doesNotMatch(wildPort,/localStorage|createCombatRuntime|createCombatSession|startSkill|location\.reload|window\./,
  'Wild port cannot own another storage, clock, rules engine or globally replace the old combat');
assert.equal(staged.stagedSavedProfileMapping,true);
assert.equal(staged.productionActivated,false,'the saved-profile adapter is not a second live combat owner');
assert.ok(staged.captureEsmAdapters.includes('assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs'));
assert.ok(staged.coverage.includes('tests/gens_capture_saved_profile_bridge_v1.test.cjs'));
const savedBridge=read('assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs');
assert.match(savedBridge,/function createCaptureSavedProfileBattleBridgeV1/);
assert.match(savedBridge,/saveHeroState\(heroId,next\)/,'only the injected Capture owner writes the saved battle HP');
assert.doesNotMatch(savedBridge,/localStorage|createCombatSession|createCombatRuntime|startSkill/,'mapping owns neither storage nor combat execution');
for(const file of [...staged.classicScripts,...staged.captureEsmAdapters]){
  assert.ok(fs.statSync(path.join(root,file)).isFile(),file+' must exist');
  assert.equal(read('index.html').includes('src="'+file),false,file+' must not silently load in the saved game');
}
assert.deepEqual(fs.readdirSync(path.join(root,staged.capturePreviewDirectory)).sort(),staged.capturePreviewFiles);
assert.ok(read(staged.previewEntry).includes('assets/gensrpg/capture/preview/zone.mjs'));
const historicalEntries=['builtin-seed-v1.js','combat-core-v1.js','entry-v1.js','hub-entry-v1.js','legacy-monolith-functions-v1.js','legacy-patches','module-contract-v1.json','screen-return-v1.js','session-start-v1.js','team-roster-v1.js','world-exploration-v1.js'];
const expected=[...historicalEntries,...stagedCaptureScripts.map(file=>path.basename(file)),
 ...staged.captureEsmAdapters.map(file=>path.basename(file)),path.basename(staged.capturePreviewDirectory)].sort();
assert.deepEqual(existing,expected,'Capture folder has new owner files; re-audit the exit matrix on any expansion');

const r06Source=require('./helpers/gens_phase12_r06_capture_source_view_v1.cjs');
// Apply only the certified Chrome startup inverse first; then test the immutable R06 rollback.
const originalChromeIndex=require('./helpers/gens_chrome_hero_recursion_source_view_20261024.cjs');
const crypto=require('node:crypto');
const blob=v=>crypto.createHash('sha1').update(Buffer.from('blob '+v.length+String.fromCharCode(0))).update(v).digest('hex');
const moduleNames=["captureGameplayModalMount","capturePlaytestFix128","captureFix129","captureFix130","captureFix131","captureFix132","captureFix133","captureFix134","captureFix135","captureFix136","captureFix137","captureFix138","captureFix139","captureFix140","captureItems141","captureBuffs142","captureBuffFx143","captureAbilityTruth144"];
const archiveDir=path.join(root,'assets/gensrpg/capture/legacy-patches');
const actualPatches=fs.readdirSync(archiveDir).sort();
const expectedPatches=moduleNames.map(name=>name.replace(/([A-Z])/g,'-$1').toLowerCase().replace(/^-/, '')+'-v1.js').sort();
assert.deepEqual(actualPatches,expectedPatches,'R06 Capture patches must contain only the 18 historical active bodies, no new autonomous engine');
assert.equal(blob(r06Source(originalChromeIndex(fs.readFileSync(path.join(root,'index.html'))))),'b33542b033c5afa8a1643d99c56c21dbd4be266c',
  'R06 physical extraction must byte-restore the prior Phase9-approved source');
const stagedClassicNames=new Set(stagedCaptureScripts.map(file=>path.basename(file)));
const exportedOwnerFile=existing.filter(x=>x.endsWith('.js')&&!stagedClassicNames.has(x));
assert.equal(exportedOwnerFile.length,9,'Capture retains its eight proven owners plus the original R10 legacy-function extraction, not a second engine');
assert.match(read('assets/gensrpg/capture/legacy-monolith-functions-v1.js'),/function captureAwardBattleXp\(/,'Capture legacy XP has an explicit physical owner after R10');
assert.equal(JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json')).files['assets/gensrpg/capture/legacy-monolith-functions-v1.js'].domain,'capture');
assert.match(entry,/\bfunction dispose\s*\(/,'Capture entry now has explicit shutdown/dispose ownership');
assert.match(entry,/\bfunction stop\s*\(/,'Capture entry must implement in-game shutdown');
assert.match(hub,/\bfunction leaveWorld\s*\(/,'Capture Hub must release its owned UI');
assert.match(session,/\bfunction stop\s*\(/,'Capture save owner must preserve persisted world on shutdown');
assert.doesNotMatch(entry,/\bfunction (?:startBattle|renderWorld|saveWorld|resumeSession)\s*\(/);
assert.doesNotMatch(hub,/\bfunction (?:startBattle|resolveCombat)\s*\(/);
assert.deepEqual(Object.keys(full.criteria),[
  'publicEntry','sessionAndHub','worldExploration','teamAndBattle','saveAndResume','sessionShutdown','noForeignRuntime'
]);
assert.deepEqual(
 Object.values(full.criteria).map(x=>x.status),
 ['proven','proven','partial','partial','partial','unproven','unproven']
);
assert.equal(full.phaseExitReady,false,'do not imply Phase 9 is complete');
assert.equal(full.remainingCriticalAxes.length,3,'give a bounded list of decisive exit axes');
assert.equal(full.scope.runtimeChanges,false);
assert.equal(full.scope.indexInspectedDirectly,false,'Rule 26 forbids substitute readings of huge HTML');
assert.equal(full.evidence.baselineGreenSha,'3e47a393f9fca326bf9aab21a15ba4b4d315eddb');
// The 2026-10-09 assessment is preserved as historical evidence. The 2026-10-11
// closure must be supported by GREEN browser tests for A/B/C on a shared SHA.
const finalGate=JSON.parse(read('docs/GENSRPG_PHASE9_CAPTURE_EXIT_GATE_2026-10-11.json'));
const axisA=read('tests/gens_phase9_capture_axis_a_no_dungeon_runtime_browser_v1.test.cjs');
const axisB=read('tests/gens_phase9_capture_axis_b_clean_resume_browser_v1.test.cjs');
const axisC=read('tests/gens_phase9_capture_axis_c_shutdown_owner_browser_v1.test.cjs');
assert.equal(finalGate.phase,9);
assert.equal(finalGate.phaseExitReady,true,'Phase 9 final gate is functional closure, not code-size completion');
assert.equal(finalGate.exitKind,'functional-runtime-autonomy');
assert.equal(finalGate.runtimeSha,'9ad6a3b0a8b54e6798d095e027f1770eca54f52b');
assert.equal(finalGate.evidenceSha,'edab672d914f929becfdba93dbfd33638b75b6ff');
assert.deepEqual(Object.keys(finalGate.criteria),Object.keys(full.criteria));
assert.ok(Object.values(finalGate.criteria).every(c=>c.status==='proven'),'Every autonomy gate must be proven');
assert.deepEqual(finalGate.remainingBlockingCodeLots,[]);
assert.deepEqual(finalGate.ci.evidenceRuns.map(x=>x.conclusion),['success','success','success']);
assert.ok(finalGate.ci.evidenceRuns.every(x=>x.sha===finalGate.evidenceSha));
assert.match(axisA,/assert\.equal\(s\.shellOwner,'capture'/);
assert.match(axisA,/assert\.equal\(s\.dungeonRuntime,null/);
assert.match(axisB,/capture-second-real-combat-after-reload-and-resume/);
assert.match(axisB,/captureBattleUseAbility\('capture_basic_attack'\)/);
assert.match(axisB,/capture-second-battle-victory-after-resume/);
assert.match(axisC,/assert\.equal\(stopped\.hubOwner\?\.pendingScrolls,0/);
assert.match(axisC,/resume-after-explicit-exit-without-page-reload/);
assert.match(axisC,/assert\.equal\(afterSecondExit\.controls,1/);
assert.equal(finalGate.scope.indexInspectedDirectly,false);
assert.equal(finalGate.scope.runtimeChanges,false);
assert.equal(finalGate.scope.mainTouched,false);
assert.ok(finalGate.deferredLegacyOwners.some(x=>/XP/.test(x)),'Historical inline XP remains explicit debt');

console.log(JSON.stringify({
 scenario:'Phase 9 Capture autonomy EXIT EVIDENCE gate (NOT exit-ready)',
 phaseExitReady:full.phaseExitReady,
 evidenceStatus:Object.fromEntries(Object.entries(full.criteria).map(([k,v])=>[k,v.status])),
 captureOwnedExternalRuntime:exportedOwnerFile,
 criticalAxes:full.remainingCriticalAxes,
 untouchedIndex:true
}));
