'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8166967,'pregame ownership raccord must start from the exact verified Rule 26 runtime');
assert.equal(blob,'1d09d3d810485b206afb677ccd0be275212f912f','pregame ownership raccord must inspect the exact verified Rule 26 blob');

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing '+id);
  return m[1];
}

const c137=block('captureFix137');
const c138=block('captureFix138');
const c139=block('captureFix139');

/* Capture137: keep only its explicit openSessionDungeonSetup guard for this seam. */
assert.match(
  c137,
  /window\.openSessionDungeonSetup=\(function\(old\)\{[\s\S]*?gensCapturePregameMode\(\)[\s\S]*?return old\.apply\(this,arguments\)/,
  'Capture137 openSessionDungeonSetup guard must remain protected in this first seam'
);
assert.doesNotMatch(
  c137,
  /cleanDungeonPregame137/,
  'RED: Capture137 must no longer own Dungeon adventure pregame cleanup'
);
assert.doesNotMatch(
  c137,
  /const update137=window\.updateGameStyleUi/,
  'RED: Capture137 cleanup wrapper around updateGameStyleUi must be retired'
);

/* Capture138: retire only the redundant Dungeon adventure UI cleanup authority. */
assert.doesNotMatch(
  c138,
  /captureCleanDungeonUi138/,
  'RED: Capture138 must no longer own or invoke Dungeon adventure UI cleanup'
);
assert.doesNotMatch(
  c138,
  /const rps138=window\.renderParticipantSelector/,
  'RED: Capture138 cleanup wrapper around renderParticipantSelector must be retired'
);
assert.doesNotMatch(
  c138,
  /const ugs138=window\.updateGameStyleUi/,
  'RED: Capture138 cleanup wrapper around updateGameStyleUi must be retired'
);
assert.doesNotMatch(
  c138,
  /DOMContentLoaded["']?\s*,?\s*\(\)=>setTimeout\(captureCleanDungeonUi138|setTimeout\(captureCleanDungeonUi138/,
  'RED: Capture138 cleanup listener/timers must be retired'
);

/* Other Capture138 responsibilities stay in place. */
assert.match(c138,/window\.isCaptureContext138=function/);
assert.match(c138,/const turnMgr138=window\.startTurnManagerForGame/);
assert.match(c138,/const start138=window\.startConfiguredGame/);
assert.match(c138,/window\.captureElementLabel138=function/);
assert.match(c138,/window\.captureBattleSelectDefaultTarget=function/);

/* Capture139 remains the single temporary owner of this UI boundary. */
assert.match(c139,/window\.gensEnsureDungeonAdventureButton139=function/);
assert.match(c139,/const p=getActiveGameProfile\(\)/);
assert.match(c139,/String\(p\.id\)===String\(GAME_PROFILE_DUNGEON_ID\)/);
assert.match(c139,/if\(!realDungeon\)\{b\?\.remove\(\);return\}/);
assert.match(c139,/b\.id="sessionDungeonSetupBtn"/);
assert.match(c139,/b\.onclick=\(\)=>openSessionDungeonSetup\(\)/);
assert.match(c139,/const r139=window\.renderParticipantSelector/);
assert.match(c139,/gensEnsureDungeonAdventureButton139\(\)/);
assert.match(c139,/const u139=window\.updateGameStyleUi/);

/* No new owner or alternate service is introduced by the seam. */
assert.equal((index.match(/gensEnsureDungeonAdventureButton139/g)||[]).length>=4,true);
assert.doesNotMatch(c137,/gensEnsureDungeonAdventureButton139/);
assert.doesNotMatch(c138,/gensEnsureDungeonAdventureButton139/);

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain present as protected parity proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture / Dungeon pregame adventure ownership raccord',
  rule26:{bytes:bytes.length,blob},
  owner:'captureFix139.gensEnsureDungeonAdventureButton139',
  retired:{
    capture137Cleanup:true,
    capture138Cleanup:true
  },
  protected:{
    capture137OpenSessionDungeonSetupGuard:true,
    capture138OtherResponsibilities:true,
    capture139SessionInit:true
  }
},null,2));
