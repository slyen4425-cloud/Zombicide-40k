'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const finalShell=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');

function blockBody(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

function globalOwners(name){
  const scriptRe=new RegExp('<script\\b[^>]*\\bid=["\\\']([^"\\\']+)["\\\'][^>]*>([\\s\\S]*?)<\\/script>','gi');
  const blocks=[...index.matchAll(scriptRe)];
  const re=new RegExp('window\\.'+name+'\\s*=(?!=)','g');
  const ids=[];
  for(const m of blocks){
    const hits=m[2].match(re)||[];
    for(let i=0;i<hits.length;i++)ids.push(m[1]);
  }
  return ids;
}

const c135=blockBody('captureFix135');
const c138=blockBody('captureFix138');
const c139=blockBody('captureFix139');
const dc01=blockBody('gensDungeonCore01Js');
const dc200=blockBody('dungeonCore200Rebuild');

assert.doesNotMatch(
  c135,
  /window\.startConfiguredGame\s*=(?!=)/,
  'RED: captureFix135 must stop publishing startConfiguredGame globally'
);

const owners=globalOwners('startConfiguredGame');
assert.deepEqual(
  owners,
  ['captureFix138','captureFix139','gensDungeonCore01Js'],
  'after captureFix135 retirement exactly three historical global owners must remain'
);

assert.match(c135,/target135\(/,'captureFix135 ally-targeting responsibility must remain');
assert.match(c135,/render135\(/,'captureFix135 battle rendering/log responsibility must remain');
assert.match(c135,/captureBattleLiveBody/,'captureFix135 detailed combat-log UI must remain');
assert.match(c135,/captureCreatureDetailBody/,'captureFix135 creature stats/detail UX must remain');
assert.match(c135,/oldPlayerText135/,'captureFix135 player-text compatibility layer must remain');

assert.match(c138,/window\.startConfiguredGame\s*=\s*async\s+function/,'captureFix138 global owner must remain');
assert.match(c138,/isCaptureContext138/,'captureFix138 Capture-context routing must remain');
assert.match(c138,/renderCaptureWorldHub/,'captureFix138 post-launch Capture UI responsibility must remain');

assert.match(c139,/window\.startConfiguredGame\s*=\s*async\s+function/,'captureFix139 global owner must remain');
assert.match(c139,/if\(!isCaptureContext138\(\)\)return await start139\.apply/,'captureFix139 dedicated Capture launch boundary must remain');
assert.match(c139,/markSessionActive/,'captureFix139 Capture session activation must remain');

assert.match(dc01,/window\.startConfiguredGame\s*=\s*async\s+function/,'Dungeon Core01 global owner must remain');
assert.match(dc01,/eligible\(\)/,'Dungeon Core01 launch eligibility must remain');
assert.match(dc01,/return start\(\)/,'Dungeon Core01 launch action must remain');

assert.match(dc200,/const gensDungeonStartConfiguredGame200V1=async function/,'Core200 local Dungeon dispatcher must remain');
assert.doesNotMatch(dc200,/window\.startConfiguredGame\s*=(?!=)/,'Core200 global owner must remain retired');
assert.match(dc200,/GensShellModuleLaunchV1\.register\("dungeon",gensDungeonStartModuleSessionV1\)/,'Dungeon provider S4 must remain');

assert.match(index,/GensShellModuleLaunchV1\.register\("capture"/,'Capture provider S3 must remain registered');
assert.match(finalShell,/window\.startConfiguredGame=async function/,'Shell final authority must remain visible');
assert.match(finalShell,/launchService\.startModuleSession\(moduleId\)/,'Shell final authority must continue delegating through the module registry');

for(const p of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_phase1_four_modules_non_interference_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,p)),'required regression proof missing: '+p);
}

console.log(JSON.stringify({
  scenario:'Phase 5 retire captureFix135 global startConfiguredGame owner',
  owners,
  capture135BlockRetained:true,
  preservedOwners:['captureFix138','captureFix139','gensDungeonCore01Js'],
  core200LocalDispatcher:true,
  shellFinalAuthority:true
},null,2));
