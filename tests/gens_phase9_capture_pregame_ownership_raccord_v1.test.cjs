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

assert.equal(bytes.length,8167047,
  'pregame ownership raccord must start from the verified Phase 9 runtime');
assert.equal(blob,'a98daff5b7709c8a68f148a9af2b6d8a5837265b',
  'pregame ownership raccord must inspect the exact verified Phase 9 runtime blob');

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

assert.doesNotMatch(
  c137,
  /cleanDungeonPregame137/,
  'RED: Capture137 must retire its redundant Dungeon pregame cleaner'
);
assert.doesNotMatch(
  c138,
  /captureCleanDungeonUi138/,
  'RED: Capture138 must retire its redundant Dungeon pregame cleaner'
);

assert.match(
  c137,
  /openSessionDungeonSetup/,
  'Capture137 guard around openSessionDungeonSetup must remain in this first consolidation seam'
);

assert.match(
  c139,
  /gensEnsureDungeonAdventureButton139/,
  'Capture139 must remain the temporary unique owner of the Dungeon Adventure pregame button/page'
);
assert.match(
  c139,
  /GAME_PROFILE_DUNGEON_ID/,
  'Capture139 owner must continue identifying the real Dungeon profile explicitly'
);

assert.doesNotMatch(
  c137,
  /set(?:Timeout|Interval)[\s\S]{0,240}cleanDungeonPregame137|cleanDungeonPregame137[\s\S]{0,240}set(?:Timeout|Interval)/,
  'Capture137 must not retain a timer that maintains the retired pregame cleaner'
);
assert.doesNotMatch(
  c138,
  /set(?:Timeout|Interval)[\s\S]{0,260}captureCleanDungeonUi138|captureCleanDungeonUi138[\s\S]{0,260}set(?:Timeout|Interval)/,
  'Capture138 must not retain a timer that maintains the retired pregame cleaner'
);
assert.doesNotMatch(
  c138,
  /addEventListener[\s\S]{0,320}captureCleanDungeonUi138|captureCleanDungeonUi138[\s\S]{0,320}addEventListener/,
  'Capture138 must not retain a listener that maintains the retired pregame cleaner'
);

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
  scenario:'Phase 9 Capture/Dungeon pregame ownership raccord',
  rule26:{bytes:bytes.length,blob},
  targetOwner:'captureFix139.gensEnsureDungeonAdventureButton139',
  retireOnly:[
    'captureFix137.cleanDungeonPregame137 ownership',
    'captureFix138.captureCleanDungeonUi138 ownership'
  ],
  preserve:[
    'captureFix137 openSessionDungeonSetup guard',
    'Capture139 session initializer',
    'isDungeonMode',
    'Monster Capture gameStyle migration'
  ]
},null,2));
