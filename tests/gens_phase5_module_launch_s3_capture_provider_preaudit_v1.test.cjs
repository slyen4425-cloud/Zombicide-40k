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

assert.equal(bytes.length,8172118,'S3 preaudit must start from the exact user-validated S2 runtime');
assert.equal(gitBlob,'198207e3f52730498831f196caa35c4a0283e934','S3 preaudit must start from the exact S2 blob');

const registryExpose=index.indexOf('window.GensShellModuleLaunchV1=Object.freeze({');
assert.ok(registryExpose>0,'S1 registry must remain exposed');
assert.match(index,/window\.GensShellModuleLaunchV1\.register\("survival",gensSurvivalStartModuleSessionV1\);/,
  'S2 Survival provider must remain registered');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\(["']capture["']/g)||[]).length,1,
  'Capture provider must be registered exactly once after S3 runtime raccord');

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

assert.match(c139.body,/const\s+start139\s*=\s*window\.startConfiguredGame/,
  'Capture139 must capture the previous launch chain');
assert.match(c139.body,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'Capture139 must remain a real launch owner');
assert.match(c139.body,/if\(!isCaptureContext138\(\)\)return await start139\.apply\(this,arguments\)/,
  'Capture139 must delegate only outside Capture context');
assert.match(c139.body,/normalizeGameParticipants/,
  'Capture139 must still own Capture participant initialization');
assert.match(c139.body,/captureEnterWorld139/,
  'Capture139 must still own Capture world entry');

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
assert.deepEqual(chain,['captureFix138','captureFix139','gensDungeonCore01Js'],
  'S3 preaudit must track the exact three-owner global chain after Capture135 retirement');

assert.ok(fs.existsSync(path.join(root,'tests','gens_phase5_user_regression_rollback_guard_v1.test.cjs')),
  'the permanent user-regression rollback guard must remain');
assert.ok(fs.existsSync(path.join(root,'tests','gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs')),
  'Capture victory/resume E2E proof must remain available');
assert.ok(fs.existsSync(path.join(root,'tests','gens_phase2_full_composition_capture_browser_v11411.test.cjs')),
  'full Capture composition E2E proof must remain available');

const selectedSeam={
  owner:'captureFix139',
  captureReference:'capture window.startConfiguredGame immediately after Capture139 installs its wrapper',
  registrationTiming:'registry already exists before Capture139 loads',
  productionRouting:'unchanged during S3',
  retirement:'captureFix135 global retired by dedicated proof; captureFix138/139 and Dungeon global owners remain',
  proof:'legacy Capture shell + Capture victory/resume + full composition + four-module non-interference'
};

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S3 Capture provider preaudit',
  runtime:{bytes:bytes.length,gitBlob},
  positions:{registryExpose,c135:c135.start,c138:c138.start,c139:c139.start,d01:d01.start,d200:d200.start},
  chain,
  selectedSeam
},null,2));
