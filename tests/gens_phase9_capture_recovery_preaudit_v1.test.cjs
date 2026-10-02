'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const captureContract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const shellFinal=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');
const launchContract=JSON.parse(read('assets/gensrpg/shell/module-launch-contract-v1.json'));
const currentCaptureTest=read('tests/gens_capture_current_shell_browser_v11411.test.cjs');
const providerTest=read('tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs');
const recovery=read('docs/GENSRPG_PHASE9_CAPTURE_RECOVERY_PREAUDIT.md');

assert.match(roadmap,/## Phase 9 — Séparer Monster Capture[\s\S]*Critère de sortie : Capture peut démarrer sans runtime Dungeon\/Survie actif\./,
  'Phase 9 official autonomy criterion must remain explicit');
assert.match(roadmap,/module autonome de premier niveau/i,
  'Capture must remain a first-class top-level module');
assert.match(roadmap,/aucun besoin de `gameStyle="dungeon"` ou de `isDungeonMode\(\)` comme identité fonctionnelle de Capture/,
  'Capture must not keep Dungeon identity as its target architecture');

assert.equal(captureContract.status,'contract-only-not-loaded',
  'Capture target entry must still be inert before the first Phase 9 runtime seam');
assert.ok(captureContract.owns.includes('Monster Capture runtime'));
assert.ok(captureContract.owns.includes('Capture combat'));
assert.ok(captureContract.forbidden.includes('Dungeon private runtime'));
assert.ok(captureContract.forbidden.includes('Survival private runtime'));
assert.doesNotMatch(captureEntry,/window\.|document\.|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener/,
  'Phase 9 recovery audit must not silently turn the inert Capture entry into runtime');

assert.match(shellFinal,/GensShellModuleLaunchV1/);
assert.match(shellFinal,/activeModule\s*\(/);
assert.match(shellFinal,/startModuleSession\s*\(/);
assert.doesNotMatch(shellFinal,/gensCapture|DungeonCore|isDungeonMode|localStorage|document\.|setTimeout|MutationObserver/,
  'final Shell launch owner must remain routing-only');
assert.ok(launchContract.providers.includes('capture'));
assert.ok(launchContract.invariants.some(x=>/selected module owns its launch preconditions/i.test(x)));

for(const proof of [
  /style,'dungeon'/,
  /family,'adventure'/,
  /contentFamily,'creature'/,
  /dungeonMode,true/,
  /current Capture intentionally reuses the dungeon-style RPG substrate/,
  /V137\/V138 own the Capture pre-game Dungeon cleanup\/context/,
  /V139 owns Capture launch/
]){
  assert.match(currentCaptureTest,proof,
    'current Capture historical substrate characterization must remain visible');
}

assert.match(providerTest,/GensShellModuleLaunchV1\?\.startModuleSession\?\.\('capture'\)/,
  'Capture public provider real path must remain covered');
assert.match(providerTest,/publicLaunch\.handled,true/,
  'Capture public provider must remain proven handled=true');
assert.match(providerTest,/Capture launch must show the current Capture hub/,
  'Capture provider proof must reach the real hub');

for(const ref of [
  '3414ad1e23a2204daf79f26cdd4e381982b713c6',
  '5aed8b3c9a7963edb06b5cca17fa676c924451c6',
  'cd6d8ceab41785fb915c4f790022fb439c9063d8',
  'e7d462ca3e75b0aa53e46fc89d86f7ff933d7fe1',
  '6a2392f00fa5129f2e25647464d4613da86582e1',
  'ebf1134e070458e225cc05d7d17fb07b74779d7c',
  '783c824625f1785e86cabffe9eec8f09ba2b2aa0',
  '5bc2da5fa6595ece89ed527ba6e55f0446f12c34',
  'c7445b868445ade97f12b1575ac508bb3f159880',
  'adf504bdb9ef5c12a192e46de8ef2247967a7afc'
]){
  assert.ok(recovery.includes(ref),'recovery audit must preserve reviewed lab ref '+ref);
}
assert.match(recovery,/Database Export\/Import R2[\s\S]*diverge/i,
  'divergent database files/UI branch must remain explicitly quarantined');
assert.match(recovery,/Ancien checkpoint 1v1 \/ 2v2[\s\S]*divergente/i,
  'old diverged 2v2 prevalidation must not become an integration base');
assert.match(recovery,/laboratoire_dynamique_exploration-/,
  'Phase 9 recovery must include the Exploration laboratory');
assert.ok(recovery.includes('f9209d4b55506b1fc3cab438ed8b7429551f8cad'),
  'recovery audit must preserve the reviewed Exploration work cutoff');
assert.ok(recovery.includes('3f6cc88b39d99e62589182cdee28f89538e7f3e8'),
  'recovery audit must preserve the reviewed Exploration technical runtime head');
assert.ok(recovery.includes('80e6468eda0261e0f7db12c81f98beb13df339ab'),
  'recovery audit must preserve the Exploration GREEN base');
assert.match(recovery,/Map Actor reste \*\*non GREEN utilisateur\*\*/i,
  'Map Actor must not be promoted to final GREEN before smartphone validation');
assert.match(recovery,/Capture Exploration[\s\S]*Encounter Bridge[\s\S]*Capture Combat/,
  'Exploration must remain below Capture runtime and bridge to Capture Combat');
assert.match(recovery,/premier seam à traiter est :[\s\S]*ownership de l'entrée publique Capture/i,
  'Phase 9 must begin at the public Capture ownership boundary, not with a lab merge');
assert.match(recovery,/Rule 26/,
  'next inline-owner audit must preserve the exact-index rule');

console.log(JSON.stringify({
  scenario:'Phase 9 Monster Capture recovery preaudit',
  genSrpg:{
    finalShellPublicRouting:true,
    captureTargetEntryLoaded:false,
    currentCaptureHistoricalSubstrate:true
  },
  laboratory:{
    reviewedCheckpoint:'3414ad1e23a2204daf79f26cdd4e381982b713c6',
    blindMergeAllowed:false,
    divergentBranchesQuarantined:true
  },
  selectedNext:'Capture public-entry ownership preaudit',
  runtimeChanged:false
},null,2));
