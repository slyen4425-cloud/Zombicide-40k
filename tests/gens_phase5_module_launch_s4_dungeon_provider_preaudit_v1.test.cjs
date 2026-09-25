'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8170472,'S4 preaudit/postaudit must track the current validated runtime');
assert.equal(gitBlob,'2232d8c1d65121758646915080bd3c17be4d4cd6','S4 preaudit/postaudit blob must track the current validated runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return {body:m[1],start:m.index};
}

const c135=block('captureFix135');
const c138=block('captureFix138');
const c139=block('captureFix139');
const d01=block('gensDungeonCore01Js');
const d200=block('dungeonCore200Rebuild');
const registry=index.indexOf('window.GensShellModuleLaunchV1=Object.freeze({');

assert.ok(registry>0&&registry<c135.start,'Shell module-launch registry must exist before historical module owners');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("survival"/g)||[]).length,1,
  'S2 Survival provider must remain registered exactly once');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("capture"/g)||[]).length,1,
  'S3 Capture provider must remain registered exactly once');
const dungeonProviderCount=(index.match(/GensShellModuleLaunchV1\.register\("dungeon"/g)||[]).length;
assert.ok(dungeonProviderCount<=1,
  'S4 preaudit/postaudit must never permit duplicate Dungeon providers');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("pvp"/g)||[]).length,0,
  'PvP must remain unrouted during S4');

assert.ok(
  c135.start<c138.start&&c138.start<c139.start&&c139.start<d01.start&&d01.start<d200.start,
  'historical launch-owner order drifted'
);

assert.match(
  d01.body,
  /const oldStart=window\.startConfiguredGame;window\.startConfiguredGame=async function\(\)\{if\(eligible\(\)\)return start\(\);return oldStart\?\.apply\(this,arguments\)\}/,
  'Dungeon Core01 must retain its historical launch boundary'
);

assert.match(
  d200.body,
  /const old=window\.DungeonCore01\|\|\{\};\s*window\.DungeonCore01=\{eligible:[\s\S]*?,start,show,render,/,
  'Core200 must remain the public DungeonCore01 runtime owner'
);
assert.match(
  d200.body,
  /function start\(\)\{[\s\S]*markSessionActive\?\.\(true\)[\s\S]*const x=newRt\(ids\);[\s\S]*saveRt\(x\);[\s\S]*show\(\);[\s\S]*return true/,
  'Core200 start must remain the runtime/session initializer used by real Dungeon launches'
);
assert.match(
  d200.body,
  /const startOutside200=window\.startConfiguredGame;\s*const gensDungeonStartConfiguredGame200V1=async function\(\)\{if\(isDungeonMode\?\.\(\)&&!\(typeof isCaptureContext138==="function"&&isCaptureContext138\(\)\)\)return start\(\);return startOutside200\?\.apply\(this,arguments\)\}/,
  'Core200 must remain the local Dungeon launch dispatcher while delegating non-Dungeon/Capture traffic'
);
assert.match(
  d200.body,
  /window\.GensShellScreenReturnV1\?\.register\?\.\("dungeon",function\(\)/,
  'Dungeon ScreenReturn provider must stay owned by the same final runtime'
);
if(dungeonProviderCount===1){
  assert.match(
    d200.body,
    /window\.GensShellModuleLaunchV1\.register\("dungeon",gensDungeonStartModuleSessionV1\)/,
    'once S4 is raccorded, the unique Dungeon provider must live in Core200'
  );
}

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const body=block(id).body;
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(
  chain,
  ['captureFix138','captureFix139','gensDungeonCore01Js'],
  'S4 preaudit must preserve the exact three-owner global chain after captureFix135 retirement'
);

assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'production button must remain on legacy startConfiguredGame during preaudit');

for(const p of [
  'gens_savequit_resume_shell_browser_v11411.test.cjs',
  'gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs',
  'gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'gens_phase5_user_regression_rollback_guard_v1.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,'tests',p)),'missing permanent Dungeon proof '+p);
}

const saveQuit=fs.readFileSync(path.join(root,'tests','gens_savequit_resume_shell_browser_v11411.test.cjs'),'utf8');
assert.match(saveQuit,/Core 2\.00 must retain the true Dungeon launch dispatcher as a stable local provider target/,
  'permanent Save & Quit E2E must continue to characterize Core200 as the local Dungeon launch dispatcher');
assert.match(saveQuit,/const core200Script=exactScript\('dungeonCore200Rebuild'\)/,
  'Save & Quit E2E must continue to execute the exact Core200 production block');

const mapCombat=fs.readFileSync(path.join(root,'tests','gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs'),'utf8');
assert.match(mapCombat,/GensRpgTacticalCombatV2Bridge/,
  'Dungeon map combat E2E must continue to protect the Tactical public bridge');

const rollback=fs.readFileSync(path.join(root,'tests','gens_phase5_user_regression_rollback_guard_v1.test.cjs'),'utf8');
assert.match(rollback,/Dungeon Core 2\.00 must retain its stable local Dungeon launch dispatcher/,
  'user-regression rollback guard must continue to protect the local Core200 dispatcher');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S4 Dungeon provider preaudit',
  runtime:{bytes:bytes.length,gitBlob},
  positions:{registry,c135:c135.start,c138:c138.start,c139:c139.start,d01:d01.start,d200:d200.start},
  chain,
  selectedSeam:{
    owner:'dungeonCore200Rebuild',
    captureReference:'gensDungeonStartConfiguredGame200V1 local dispatcher retained inside Core200',
    provider:'future routing-only Dungeon provider',
    productionRouting:'unchanged during S4',
    retirement:'none'
  }
},null,2));
