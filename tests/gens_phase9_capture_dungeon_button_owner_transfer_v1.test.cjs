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

assert.equal(bytes.length,8166377,'pregame Dungeon-button ownership RED must inspect the current Phase 9 runtime');
assert.equal(blob,'37056722bb0a27f96e26b3ef3b05e9543dc5a223','pregame Dungeon-button ownership RED must inspect the exact verified runtime blob');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

function fn(name){
  const marker='function '+name+'(';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const open=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
    if(quote){
      if(escaped){escaped=false;continue}
      if(c==='\\'){escaped=true;continue}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){comment=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const wizard=fn('updatePregameWizard');
const c137=block('captureFix137');
const c139=block('captureFix139');
const c151=block('gensStability151');

assert.match(wizard,/sessionDungeonSetupBtn/,
  'Shell pregame owner must continue referencing the Dungeon Adventure button');
assert.match(wizard,/GAME_PROFILE_DUNGEON_ID/,
  'RED: Shell pregame owner must distinguish the real built-in Dungeon profile');
assert.match(wizard,/document\.createElement\("button"\)[\s\S]{0,500}sessionDungeonSetupBtn|sessionDungeonSetupBtn[\s\S]{0,500}document\.createElement\("button"\)/,
  'RED: updatePregameWizard must become the creation owner of the Dungeon Adventure button');
assert.match(wizard,/sessionDungeonSetup/,
  'RED: Shell pregame owner must also own hiding the Dungeon setup page outside real Dungeon');

assert.doesNotMatch(c139,/gensEnsureDungeonAdventureButton139/,
  'RED: Capture139 must stop owning Dungeon Adventure button maintenance');
assert.doesNotMatch(c139,/sessionDungeonSetupBtn/,
  'RED: Capture139 must no longer create or remove the Dungeon Adventure button');
assert.doesNotMatch(c139,/setTimeout\(gensEnsureDungeonAdventureButton139\s*,\s*50\)/,
  'RED: Capture139 must no longer maintain Dungeon UI through a timer');
assert.doesNotMatch(c139,/renderParticipantSelector[\s\S]{0,240}gensEnsureDungeonAdventureButton139/,
  'RED: Capture139 must no longer wrap participant rendering for Dungeon button maintenance');
assert.doesNotMatch(c139,/updateGameStyleUi[\s\S]{0,240}gensEnsureDungeonAdventureButton139/,
  'RED: Capture139 must no longer wrap game-style UI for Dungeon button maintenance');

assert.doesNotMatch(c151,/gensEnsureDungeonAdventureButton139/,
  'RED: Stability151 must stop calling the retired Capture-owned Dungeon button helper');

assert.match(c139,/window\.captureEnterWorld139=function\(\)/,
  'Capture139 launch/world handoff must remain intact');
assert.match(c139,/window\.startConfiguredGame=async function\(\)/,
  'Capture139 dedicated launch path must remain intact');

assert.match(c137,/openSessionDungeonSetup/,
  'Capture137 dedicated guard around Dungeon setup remains protected in this seam');
assert.match(c151,/const openD151=window\.openSessionDungeonSetup/,
  'Stability151 inverse Dungeon/Capture guard remains protected in this seam');

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs',
  'tests/gens_phase9_capture_persisted_profile_without_dungeon_style_resume_characterization_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available as protected parity proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 transfer Dungeon pregame button ownership out of Capture139',
  rule26:{bytes:bytes.length,blob},
  target:{
    shellOwner:'updatePregameWizard',
    retiredCaptureOwner:'captureFix139.gensEnsureDungeonAdventureButton139',
    protectedGuards:['captureFix137.openSessionDungeonSetup','gensStability151.openSessionDungeonSetup']
  }
},null,2));
