'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

const allowed=new Map([
  [8172742,'95f8c96e7e221eb743f7c8013ffa8af499eca1c8'],
  [8170150,'ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9']
]);
assert.equal(allowed.get(bytes.length),gitBlob,
  'Core200 retirement RED/runtime must stay on the exact reviewed base or exact one-line retirement target');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const d200=block('dungeonCore200Rebuild');

assert.match(
  d200,
  /const startOutside200=window\.startConfiguredGame;/,
  'Core200 must retain the previous historical launch reference'
);

assert.match(
  d200,
  /const gensDungeonStartConfiguredGame200V1=async function\(\)\{if\(isDungeonMode\?\.\(\)&&!\(typeof isCaptureContext138==="function"&&isCaptureContext138\(\)\)\)return start\(\);return startOutside200\?\.apply\(this,arguments\)\};/,
  'Core200 dispatcher must survive as the stable local S4 reference'
);

assert.doesNotMatch(
  d200,
  /window\.startConfiguredGame\s*=(?!=)/,
  'RED: Core200 must no longer publish a historical global startConfiguredGame assignment'
);

assert.match(
  d200,
  /const gensDungeonStartModuleSessionV1=async\(\)=>\{\s*if\(gensShellActiveModuleV1\(\)!=="dungeon"\)return false;\s*await gensDungeonStartConfiguredGame200V1\(\);\s*return true;\s*\}/,
  'Dungeon S4 provider must keep calling the stable Core200 reference'
);
assert.match(
  d200,
  /window\.GensShellModuleLaunchV1\.register\("dungeon",gensDungeonStartModuleSessionV1\);/,
  'Dungeon provider registration must remain intact'
);

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js']){
  const body=block(id);
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(chain,
  ['captureFix138','captureFix139','gensDungeonCore01Js'],
  'retirement lot must preserve exactly the three remaining historical owners after captureFix135 retirement');

const finalSrc=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');
assert.match(finalSrc,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'final Shell must remain the visible global owner');
assert.match(finalSrc,/launchService\.activeModule\(\)/,
  'final Shell must keep public active-module routing');
assert.match(finalSrc,/launchService\.startModuleSession\(moduleId\)/,
  'final Shell must keep public provider dispatch');
assert.doesNotMatch(finalSrc,/oldStart|legacyStart|gensDungeonStartConfiguredGame200V1|\.apply\s*\(/i,
  'final Shell must remain independent of the retired Core200 global');

for(const p of [
  'tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/dungeon_event_ambush_position_v167878.test.cjs',
  'tests/gens_core209_detection_direct_bridge_lot4e.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs',
  'tests/gens_survival_shell_launch_browser_v11411.test.cjs',
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_pvp_placeholder_shell_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,p)),'missing protected proof '+p);
}

console.log(JSON.stringify({
  scenario:'Phase 5 Core200 startConfiguredGame global retirement',
  expected:'RED on pre-retirement base, GREEN after local-reference conversion',
  exactIndex:{bytes:bytes.length,gitBlob},
  retiredOwner:'dungeonCore200Rebuild global assignment only',
  preservedOwners:chain,
  stableReference:'gensDungeonStartConfiguredGame200V1',
  publicProvider:'gensDungeonStartModuleSessionV1'
},null,2));
