'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8165398,'S3 preaudit must start from the current Phase 7 generated Boss policy S2 runtime');
assert.equal(gitBlob,'18627cc0c5fc7945732c8a910504c59ef823b6ae','S3 preaudit must start from the current Phase 7 generated Boss policy S2 blob');

const registryExpose=index.indexOf('window.GensShellModuleLaunchV1=Object.freeze({');
assert.ok(registryExpose>0,'S1 registry must remain exposed');
assert.match(index,/window\.GensShellModuleLaunchV1\.register\("survival",gensSurvivalStartModuleSessionV1\);/,
  'S2 Survival provider must remain registered');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\(["']capture["']/g)||[]).length,0,
  'Phase 9 must retire the historical inline Capture registration');
assert.equal((entry.match(/shell\.register\("capture",startModuleSession\)/g)||[]).length,1,
  'Capture provider must now be registered exactly once by the public entry');

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

assert.ok(registryExpose<c139.start,'Shell launch registry must exist before Capture139 loads');
assert.ok(c135.start<c138.start&&c138.start<c139.start&&c139.start<d01.start&&d01.start<d200.start,
  'historical launch owner load order drifted');

assert.doesNotMatch(c139.body,/const\s+start139\s*=|window\.startConfiguredGame\s*=|gensCaptureStartConfiguredGame139V1/,
  'Capture139 must remain retired from global launch ownership');
assert.doesNotMatch(c139.body,/const\s+participants\s*=\s*normalizeGameParticipants\(\)/,
  'Capture139 must no longer own Capture participant initialization');
assert.match(c139.body,/captureEnterWorld139/,
  'Capture139 keeps only its deferred world-entry/screen-return debt');
assert.match(c139.body,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 must wire the dedicated Capture session owner');

assert.doesNotMatch(c135.body,/window\.startConfiguredGame\s*=(?!=)/,
  'Capture135 global launch boundary must remain retired');
assert.match(c135.body,/target135\([\s\S]*render135\([\s\S]*captureBattleLiveBody/,
  'Capture135 non-launch combat/UX responsibilities must remain');
assert.match(c138.body,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'Capture138 historical boundary must remain');
assert.match(d01.body,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'Dungeon Core01 historical boundary must remain');
assert.match(d200.body,/const gensDungeonStartConfiguredGame200V1=async function/,
  'Dungeon Core200 local launch dispatcher must remain');
assert.doesNotMatch(d200.body,/window\.startConfiguredGame\s*=(?!=)/,
  'Dungeon Core200 global launch boundary must remain retired');

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const body=block(id).body;
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(chain,['captureFix138','gensDungeonCore01Js'],
  'S3 preaudit must track the post-transfer global chain after Capture139 session-owner retirement');

assert.ok(fs.existsSync(path.join(root,'tests','gens_phase5_user_regression_rollback_guard_v1.test.cjs')),
  'the permanent user-regression rollback guard must remain');
assert.ok(fs.existsSync(path.join(root,'tests','gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs')),
  'Capture victory/resume E2E proof must remain available');
assert.ok(fs.existsSync(path.join(root,'tests','gens_phase2_full_composition_capture_browser_v11411.test.cjs')),
  'full Capture composition E2E proof must remain available');

assert.match(c139.body,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/,
  'Phase 9 must bind the dedicated session owner into the public entry');
assert.doesNotMatch(c139.body,/GensShellModuleLaunchV1\.register\("capture"/,
  'Capture139 must not register the provider directly');

const selectedSeam={
  owner:'GensCaptureV1',
  sessionOwner:'GensCaptureSessionStartV1',
  captureReference:'explicit session-start owner binding',
  registrationTiming:'Capture session owner and public entry load before Capture139 wiring',
  productionRouting:'Shell public registry path preserved',
  retirement:'captureFix135 and Capture139 global launch owners retired',
  proof:'legacy Capture shell + Capture victory/resume + full composition + four-module non-interference'
};

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S3 Capture provider preaudit',
  runtime:{bytes:bytes.length,gitBlob},
  positions:{registryExpose,c135:c135.start,c138:c138.start,c139:c139.start,d01:d01.start,d200:d200.start},
  chain,
  selectedSeam
},null,2));
