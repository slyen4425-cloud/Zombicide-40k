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
const expected=['builtin-seed-v1.js','entry-v1.js','hub-entry-v1.js','module-contract-v1.json','screen-return-v1.js','session-start-v1.js'];
assert.deepEqual(existing,expected,'Capture folder has new owner files; re-audit the exit matrix on any expansion');
const exportedOwnerFile=existing.filter(x=>x.endsWith('.js'));
assert.equal(exportedOwnerFile.length,5,'Capture owns four boundary JS files and one byte-exact external seed');
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
console.log(JSON.stringify({
 scenario:'Phase 9 Capture autonomy EXIT EVIDENCE gate (NOT exit-ready)',
 phaseExitReady:full.phaseExitReady,
 evidenceStatus:Object.fromEntries(Object.entries(full.criteria).map(([k,v])=>[k,v.status])),
 captureOwnedExternalRuntime:exportedOwnerFile,
 criticalAxes:full.remainingCriticalAxes,
 untouchedIndex:true
}));
