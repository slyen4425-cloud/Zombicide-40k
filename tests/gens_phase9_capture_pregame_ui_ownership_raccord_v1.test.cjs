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

assert.equal(bytes.length,8168810,
  'pregame UI ownership raccord must inspect the exact verified Phase 9 base runtime');
assert.equal(blob,'a5d337ae25435d801a72333ee27e6dbc390a5175',
  'pregame UI ownership raccord must inspect the exact verified Phase 9 base blob');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

const c137=block('captureFix137');
const c138=block('captureFix138');
const c139=block('captureFix139');

assert.match(c137,/openSessionDungeonSetup/,
  'Capture137 must retain the dedicated guard around openSessionDungeonSetup in this first seam');

assert.doesNotMatch(c137,/cleanDungeonPregame137/,
  'RED: Capture137 must no longer own redundant Dungeon pregame UI cleanup');
assert.doesNotMatch(c138,/captureCleanDungeonUi138/,
  'RED: Capture138 must no longer own redundant Dungeon pregame UI cleanup');

assert.doesNotMatch(c137,/const\s+update137=window\.updateGameStyleUi/,
  'Capture137 must no longer wrap updateGameStyleUi for Dungeon pregame cleanup');
assert.doesNotMatch(c138,/const\s+rps138=window\.renderParticipantSelector/,
  'Capture138 must no longer wrap renderParticipantSelector for Dungeon pregame cleanup');
assert.doesNotMatch(c138,/const\s+ugs138=window\.updateGameStyleUi/,
  'Capture138 must no longer wrap updateGameStyleUi for Dungeon pregame cleanup');
assert.doesNotMatch(c138,/DOMContentLoaded[^\n]*captureCleanDungeonUi138|setTimeout\(captureCleanDungeonUi138/,
  'Capture138 must no longer maintain Dungeon pregame visibility with cleanup listeners/timers');

assert.match(c139,/window\.gensEnsureDungeonAdventureButton139=function\s*\(/,
  'Capture139 must remain the temporary unique owner of the Dungeon Adventure button/page boundary');
assert.match(c139,/GAME_PROFILE_DUNGEON_ID/,
  'Capture139 Adventure-button ownership must continue targeting the canonical real Dungeon profile');
assert.equal(
  (index.match(/window\.gensEnsureDungeonAdventureButton139=function\s*\(/g)||[]).length,
  1,
  'the temporary Adventure-button owner must have one declaration only'
);

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available as protected parity proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture/Dungeon pregame UI ownership raccord',
  rule26:{bytes:bytes.length,blob},
  target:{
    capture137CleanupOwner:false,
    capture138CleanupOwner:false,
    capture137OpenSessionGuard:true,
    temporaryOwner:'captureFix139.gensEnsureDungeonAdventureButton139'
  }
},null,2));
