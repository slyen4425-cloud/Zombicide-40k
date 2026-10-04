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

assert.equal(bytes.length,8167007,'pregame ownership raccord must start from the verified Phase 9 runtime');
assert.equal(blob,'9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4','pregame ownership raccord must start from the exact verified Phase 9 runtime blob');

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
  'Capture137 must retain its dedicated guard around openSessionDungeonSetup in this first ownership seam');

assert.equal((c137.match(/cleanDungeonPregame137/g)||[]).length,0,
  'RED: Capture137 must no longer own Dungeon pregame visibility cleanup');
assert.doesNotMatch(c137,/cleanDungeonPregame137[\s\S]{0,300}setTimeout|setTimeout[\s\S]{0,300}cleanDungeonPregame137/,
  'RED: Capture137 cleanup timer must be retired with its duplicate UI authority');

assert.equal((c138.match(/captureCleanDungeonUi138/g)||[]).length,0,
  'RED: Capture138 must no longer own Dungeon pregame visibility cleanup');
assert.doesNotMatch(c138,/captureCleanDungeonUi138[\s\S]{0,400}(renderParticipantSelector|updateGameStyleUi|DOMContentLoaded|setTimeout)|(?:renderParticipantSelector|updateGameStyleUi|DOMContentLoaded|setTimeout)[\s\S]{0,400}captureCleanDungeonUi138/,
  'RED: Capture138 wrappers/listeners/timers used only to maintain duplicate pregame visibility must be retired');

assert.match(c139,/gensEnsureDungeonAdventureButton139/,
  'Capture139 must remain the temporary unique owner of the Dungeon Adventure pregame button boundary');
assert.match(c139,/GAME_PROFILE_DUNGEON_ID/,
  'Capture139 must continue distinguishing the real built-in Dungeon profile');
assert.match(c139,/sessionDungeonSetupBtn/);
assert.match(c139,/window\.gensEnsureDungeonAdventureButton139=function\(\)\{[\s\S]*const page=document\.getElementById\("sessionDungeonSetup"\);[\s\S]*if\(!realDungeon\)\{[\s\S]*if\(page\)page\.style\.setProperty\("display","none","important"\)/,
  'RED: Capture139 must own hiding the Dungeon Adventure page when the active profile is not the real Dungeon');

assert.doesNotMatch(c139,/window\.GensCaptureV1\s*=/,
  'this seam must not create a second Capture public authority');

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain present as protected parity proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture / Dungeon pregame ownership raccord',
  rule26:{bytes:bytes.length,blob},
  target:{
    capture137CleanupOwners:0,
    capture138CleanupOwners:0,
    capture137DungeonSetupGuardPreserved:true,
    temporaryUniquePregameOwner:'captureFix139.gensEnsureDungeonAdventureButton139'
  }
},null,2));
