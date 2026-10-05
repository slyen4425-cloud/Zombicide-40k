'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167094,'Capture139 base-profile retirement must start from the exact preaudit GREEN runtime');
assert.equal(blob,'4eee0fd1cc1b932cb7cb8b33ca357cf2d55bafeb','Capture139 base-profile retirement must start from the exact preaudit GREEN blob');

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing '+id);
  return m[1];
}

function functionSource(name){
  const marker='function '+name+'(';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing function '+name);
  const open=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<index.length;i++){
    const ch=index[i],next=index[i+1]||'';
    if(line){if(ch==='\n')line=false;continue}
    if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==='/'&&next==='/'){line=true;i++;continue}
    if(ch==='/'&&next==='*'){comment=true;i++;continue}
    if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0)return index.slice(start,i+1);
  }
  assert.fail('unterminated function '+name);
}

const c139=block('captureFix139');
const ensureFn=functionSource('ensureBaseGameProfile');

assert.doesNotMatch(
  c139,
  /ensureBaseGameProfile\(\)/,
  'RED: Capture139 launch must no longer invoke the Base/Dungeon profile preparation authority'
);

assert.match(
  ensureFn,
  /GAME_PROFILE_BASE_ID/,
  'ensureBaseGameProfile must remain available for Base profile ownership'
);
assert.match(
  ensureFn,
  /GAME_PROFILE_DUNGEON_ID/,
  'ensureBaseGameProfile must remain available for Dungeon profile ownership'
);
assert.match(
  ensureFn,
  /ensureDungeonContent\(\)/,
  'true Dungeon preparation must remain inside ensureBaseGameProfile'
);

assert.doesNotMatch(
  c139,
  /saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,
  'Capture139 active-enemy dependency must remain retired after the dedicated follow-up seam'
);
assert.match(c139,/captureEnsureStarterKitsForParticipants\(\)/,
  'Capture starter-kit initialization must remain unchanged');
assert.match(c139,/captureWorldState\(\)/,
  'Capture world initialization must remain unchanged');
assert.match(c139,/applyPregameGoldToParticipants\(participants\)/,
  'Capture pregame gold flow must remain unchanged');

assert.match(captureEntry,/GensCaptureV1/);
assert.match(captureEntry,/startModuleSession/);
assert.doesNotMatch(
  captureEntry,
  /ensureBaseGameProfile|ensureDungeonContent|saveActiveEnemies|DungeonCore|DungeonSpatial/,
  'public Capture entry must stay routing-only and must not absorb the retired dependency'
);

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_phase2_full_composition_capture_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available as parity/non-interference proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture139 Base/Dungeon profile preparation retirement',
  rule26:{bytes:bytes.length,blob},
  target:{
    capture139EnsureBaseGameProfileCall:false,
    ensureBaseGameProfileDefinitionPreserved:true,
    saveActiveEnemiesResetRetired:true,
    publicCaptureEntryRoutingOnly:true
  }
},null,2));
