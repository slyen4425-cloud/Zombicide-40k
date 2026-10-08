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

assert.equal(bytes.length,8165794,'pregame ownership raccord must inspect the transferred-owner Phase 9 runtime');
assert.equal(blob,'462abc969e7ac636f8ac4ee54c0d14fe51b83e7d','pregame ownership raccord must inspect the exact transferred-owner runtime blob');

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

const c137=block('captureFix137');
const c138=block('captureFix138');
const c139=block('captureFix139');
const wizard=fn('updatePregameWizard');

assert.doesNotMatch(c137,/openSessionDungeonSetup/,
  'Capture137 setup guard was transferred to the native owner in its dedicated follow-up seam');
assert.match(fn('openSessionDungeonSetup'),/GensCaptureV1\?\.isProfile\?\.\(p\)/,
  'native setup owner must retain the canonical Capture exclusion');

assert.equal((c137.match(/cleanDungeonPregame137/g)||[]).length,0,
  'RED: Capture137 must no longer own Dungeon pregame visibility cleanup');
assert.doesNotMatch(c137,/cleanDungeonPregame137[\s\S]{0,300}setTimeout|setTimeout[\s\S]{0,300}cleanDungeonPregame137/,
  'RED: Capture137 cleanup timer must be retired with its duplicate UI authority');

assert.equal((c138.match(/captureCleanDungeonUi138/g)||[]).length,0,
  'RED: Capture138 must no longer own Dungeon pregame visibility cleanup');
assert.doesNotMatch(c138,/captureCleanDungeonUi138[\s\S]{0,400}(renderParticipantSelector|updateGameStyleUi|DOMContentLoaded|setTimeout)|(?:renderParticipantSelector|updateGameStyleUi|DOMContentLoaded|setTimeout)[\s\S]{0,400}captureCleanDungeonUi138/,
  'RED: Capture138 wrappers/listeners/timers used only to maintain duplicate pregame visibility must be retired');

assert.match(wizard,/GAME_PROFILE_DUNGEON_ID/,
  'Shell pregame owner must distinguish the real built-in Dungeon profile');
assert.match(wizard,/sessionDungeonSetupBtn/);
assert.match(wizard,/document\.createElement\("button"\)/,
  'Shell pregame owner must create the Dungeon Adventure button');
assert.match(wizard,/sessionDungeonSetup/,
  'Shell pregame owner must hide the Dungeon setup page outside real Dungeon');

assert.doesNotMatch(c139,/gensEnsureDungeonAdventureButton139/,
  'Capture139 must no longer own Dungeon Adventure button maintenance');
assert.doesNotMatch(c139,/sessionDungeonSetupBtn/,
  'Capture139 must no longer create or remove the Dungeon Adventure button');

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
    nativeDungeonSetupGuardPreserved:true,
    canonicalPregameOwner:'updatePregameWizard'
  }
},null,2));
