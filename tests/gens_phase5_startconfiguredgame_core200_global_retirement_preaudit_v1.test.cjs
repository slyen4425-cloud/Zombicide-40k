'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8169503,
  'Core200 global-retirement characterization must follow the exact retired runtime');
assert.equal(gitBlob,'fb8c77504ed067fb094374260b459f8d1fb7e824',
  'Core200 global-retirement characterization must use the exact retired runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return {body:m[1],start:m.index,end:m.index+m[0].length};
}

const c135=block('captureFix135');
const c138=block('captureFix138');
const c139=block('captureFix139');
const d01=block('gensDungeonCore01Js');
const d200=block('dungeonCore200Rebuild');

const core200Dispatcher=
  'const gensDungeonStartConfiguredGame200V1=async function(){if(isDungeonMode?.()&&!(typeof isCaptureContext138==="function"&&isCaptureContext138()))return start();return startOutside200?.apply(this,arguments)};';
const stableRef=core200Dispatcher;
const providerOpen='const gensDungeonStartModuleSessionV1=async()=>{';
const providerRegistration='window.GensShellModuleLaunchV1.register("dungeon",gensDungeonStartModuleSessionV1);';

const capturePreviousPos=d200.body.indexOf('const startOutside200=window.startConfiguredGame;');
const dispatcherPos=d200.body.indexOf(core200Dispatcher);
const stableRefPos=d200.body.indexOf(stableRef);
const providerPos=d200.body.indexOf(providerOpen);
const registrationPos=d200.body.indexOf(providerRegistration);

assert.ok(capturePreviousPos>=0&&dispatcherPos>capturePreviousPos,
  'Core200 must still capture the previous historical chain before its local dispatcher');
assert.equal(stableRefPos,dispatcherPos,
  'the Dungeon S4 stable reference is now the local Core200 dispatcher itself');
assert.ok(providerPos>stableRefPos&&registrationPos>providerPos,
  'the Dungeon public provider must remain downstream of the stable Core200 reference');

assert.equal((d200.body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length,0,
  'Core200 historical global startConfiguredGame assignment must remain retired');
assert.equal((index.match(/gensDungeonStartConfiguredGame200V1/g)||[]).length,2,
  'the stable Core200 reference must have exactly one declaration and one provider invocation');
assert.doesNotMatch(index,/window\.gensDungeonStartConfiguredGame200V1/,
  'the stable Core200 reference must remain local, not another global');
assert.match(
  d200.body,
  /const gensDungeonStartModuleSessionV1=async\(\)=>\{\s*if\(gensShellActiveModuleV1\(\)!=="dungeon"\)return false;\s*await gensDungeonStartConfiguredGame200V1\(\);\s*return true;\s*\}/,
  'Dungeon S4 provider must delegate only to the stable Core200 reference'
);

const providerBody=d200.body.slice(providerPos,registrationPos);
assert.doesNotMatch(providerBody,/window\.startConfiguredGame|document\.|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener/,
  'the Dungeon S4 provider itself must remain routing-only and independent of the mutable global');

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const body=block(id).body;
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(chain,
  ['captureFix138','captureFix139','gensDungeonCore01Js'],
  'characterization must preserve exactly the three remaining historical owners after captureFix135 retirement');

const afterCore200=index.slice(d200.end);
assert.doesNotMatch(afterCore200,/startConfiguredGame/,
  'no later inline production script may read or replace the Core200 historical global');

for(const p of [
  'assets/dungeon/dungeon-core-316.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js'
]){
  const src=read(p);
  assert.doesNotMatch(src,/startConfiguredGame|gensDungeonStartConfiguredGame200V1/,
    p+' must not depend on the Core200 historical launch global or its local stable reference');
}

const finalPath='assets/gensrpg/shell/module-launch-final-authority-v1.js';
const finalSrc=read(finalPath);
assert.match(finalSrc,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'the final Shell must remain the actual visible owner of window.startConfiguredGame');
assert.match(finalSrc,/launchService\.activeModule\(\)/,
  'the final Shell must continue resolving the active module publicly');
assert.match(finalSrc,/launchService\.startModuleSession\(moduleId\)/,
  'the final Shell must continue dispatching through the public registry');
assert.doesNotMatch(finalSrc,/=\s*window\.startConfiguredGame|oldStart|legacyStart|gensDungeonStartConfiguredGame200V1|\.apply\s*\(/i,
  'the final Shell must not read, capture or fallback to the previous Core200 global');

const finalTag='<script src="'+finalPath+'"></script>';
const mobileTag='<script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script>';
const finalPos=index.lastIndexOf(finalTag);
const mobilePos=index.lastIndexOf(mobileTag);
const bodyClose=index.lastIndexOf('</body>');
assert.ok(finalPos>mobilePos&&bodyClose>finalPos,
  'final Shell authority must load after all historical inline owners');
assert.equal(index.slice(finalPos+finalTag.length,bodyClose).trim(),'',
  'final Shell authority must remain the last production script before body close');

for(const p of [
  'tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs',
  'tests/dungeon_event_ambush_position_v167878.test.cjs',
  'tests/gens_core209_detection_direct_bridge_lot4e.test.cjs',
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_pvp_placeholder_shell_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,p)),'missing protected E2E/sentinel proof '+p);
}

const providerBrowser=read('tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs');
assert.match(providerBrowser,/GensShellModuleLaunchV1\?\.startModuleSession\?\.\('dungeon'\)/,
  'the S4 browser proof must launch Dungeon through the public provider independently of the visible global');

const saveQuitBrowser=read('tests/gens_savequit_resume_shell_browser_v11411.test.cjs');
assert.match(saveQuitBrowser,/Core 2\.00 must retain the true Dungeon launch dispatcher as a stable local provider target/,
  'Save & Quit fixture must now protect the local Core200 dispatcher behind the final Shell/provider path');
assert.match(saveQuitBrowser,/onclick="startConfiguredGame\(\)"/,
  'the old Save & Quit fixture still exercises the visible callsite and must be kept realistic when the Core200 assignment is retired');

for(const step of [
  'Vérifier le lancement Survie par le vrai Shell',
  'Vérifier le provider public Survival module-launch S2',
  'Vérifier le provider Dungeon module-launch S4',
  'Vérifier Save & Quit puis reprise par le vrai Shell',
  'Verrouiller Dungeon map vers Tactical V2',
  'Verrouiller Capture victoire et reprise inter-module',
  'Vérifier le provider Capture module-launch S3',
  'Vérifier le placeholder PvP par le vrai Shell',
  'Vérifier la non-interférence des quatre modules'
]){
  assert.ok(workflow.includes(step),'workflow must retain protected parity step: '+step);
}

console.log(JSON.stringify({
  scenario:'Phase 5 Core200 startConfiguredGame global-retirement characterization after retirement',
  exactIndex:{bytes:bytes.length,gitBlob},
  currentHistoricalOwners:chain,
  proved:{
    exactCore200LocalDispatcher:true,
    stableLocalCore200Reference:true,
    stableReferenceConsumers:['gensDungeonStartModuleSessionV1'],
    lateInlineReaders:0,
    lateExternalReaders:0,
    finalShellReadsPreviousGlobal:false,
    assignmentInstallationSideEffect:'retired; local dispatcher preserved without a global publication'
  },
  futureRedContract:{
    shellFinalOwnsGlobal:true,
    dungeonProviderRetained:true,
    stableCore200ReferenceRetained:true,
    core200GlobalAssignmentCount:0,
    untouchedHistoricalOwners:['captureFix138','captureFix139','gensDungeonCore01Js'],
    protectedPaths:[
      'Dungeon direct',
      'Survival -> Dungeon same page',
      'Dungeon map -> Tactical V2',
      'Save & Quit / resume',
      'ambush / detection',
      'Builder',
      'Capture',
      'Survival',
      'PvP placeholder',
      'four-module non-interference'
    ]
  },
  runtimeChanged:true
},null,2));
