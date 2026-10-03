'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8168810,'pregame UI ownership raccord must inspect the verified Phase 9 runtime');
assert.equal(blob,'a5d337ae25435d801a72333ee27e6dbc390a5175','pregame UI ownership raccord must inspect the exact verified Phase 9 runtime blob');

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

assert.match(c139,/gensEnsureDungeonAdventureButton139/,
  'Capture139 must remain the temporary unique owner of the Dungeon Adventure pregame button');
assert.match(c137,/openSessionDungeonSetup/,
  'Capture137 openSessionDungeonSetup guard is outside this first ownership seam and must remain');

assert.doesNotMatch(c137,/cleanDungeonPregame137/,
  'RED: Capture137 must retire its duplicate Dungeon pregame cleanup');
assert.doesNotMatch(c137,/cleanDungeonPregame137[\s\S]{0,500}updateGameStyleUi|updateGameStyleUi[\s\S]{0,500}cleanDungeonPregame137/,
  'RED: Capture137 must no longer wrap updateGameStyleUi to maintain Dungeon pregame visibility');

assert.doesNotMatch(c138,/captureCleanDungeonUi138/,
  'RED: Capture138 must retire its duplicate Dungeon pregame cleanup');
assert.doesNotMatch(c138,/captureCleanDungeonUi138[\s\S]{0,800}(renderParticipantSelector|updateGameStyleUi)|(renderParticipantSelector|updateGameStyleUi)[\s\S]{0,800}captureCleanDungeonUi138/,
  'RED: Capture138 must no longer wrap participant/style rendering to maintain Dungeon pregame visibility');

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available as protected parity proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture/Dungeon pregame UI ownership raccord',
  rule26:{bytes:bytes.length,blob},
  target:{
    owner:'captureFix139.gensEnsureDungeonAdventureButton139',
    capture137CleanupRetired:true,
    capture138CleanupRetired:true,
    capture137DungeonSetupGuardPreserved:true
  }
},null,2));
