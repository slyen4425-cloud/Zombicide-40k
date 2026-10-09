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

assert.equal(bytes.length,8164674,'GREEN must inspect the exact verified Capture139 active-enemies retirement runtime');
assert.equal(blob,'644fc5d0ce5fd195c5496d42cc0204bd1f9a9831','GREEN must inspect the exact verified Capture139 active-enemies retirement blob');

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
const saveFn=functionSource('saveActiveEnemies');
const loadFn=functionSource('loadActiveEnemies');
const trackFn=functionSource('trackSpawnedEnemyInstances');
const spawnFn=functionSource('generateRealSpawn');
const newGameFn=functionSource('newGame');
const switchFn=functionSource('switchGameModeFromHome');
const builtInFn=functionSource('openGensBuiltInGame');

assert.doesNotMatch(
  c139,
  /saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,
  'RED: Capture139 launch must no longer touch the legacy Survival/Dungeon active-enemy authority'
);

assert.match(saveFn,/ACTIVE_ENEMIES_KEY/,'legacy active-enemy persistence authority must remain intact');
assert.match(saveFn,/renderActiveEnemyButtons\(\)/,'legacy active-enemy UI refresh must remain intact');
assert.match(saveFn,/updateDungeonExploreButtons/,'Dungeon UI side effect must remain untouched in this seam');
assert.match(saveFn,/z40kSchedulePush/,'legacy sync side effect must remain untouched in this seam');
assert.match(loadFn,/ACTIVE_ENEMIES_KEY/,'legacy active-enemy loader must remain intact');

assert.match(trackFn,/isDungeonMode\(\)/,'shared legacy spawner must still distinguish Dungeon');
assert.match(trackFn,/dungeonRoom:/,'Dungeon room stamping must remain intact');
assert.match(spawnFn,/trackSpawnedEnemyInstances/,'legacy Survival/wave spawning must keep using the existing active-enemy authority');

assert.match(newGameFn,/saveActiveEnemies\(\[\]\)/,'general new-game transient cleanup must remain the owner of pregame reset');
assert.match(switchFn,/saveActiveEnemies\(\[\]\)/,'active-session mode switch cleanup must remain intact');
assert.match(builtInFn,/saveActiveEnemies\(\[\]\)/,'built-in game switch cleanup must remain intact');

assert.match(c139,/captureEnsureStarterKitsForParticipants\(\)/,'Capture starter kits must remain unchanged');
assert.match(c139,/captureWorldState\(\)/,'Capture world initialization must remain unchanged');
assert.match(c139,/applyPregameGoldToParticipants\(participants\)/,'Capture pregame gold must remain unchanged');
assert.match(c139,/markSessionActive\(true\)/,'Capture session activation must remain unchanged');
assert.match(c139,/startTurnManagerForGame\(\)/,'Capture optional turn manager must remain unchanged');

assert.match(captureEntry,/GensCaptureV1/);
assert.match(captureEntry,/startModuleSession/);
assert.doesNotMatch(
  captureEntry,
  /saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY|DungeonCore|DungeonSpatial/,
  'public Capture entry must remain routing-only'
);

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_phase9_capture139_base_profile_retirement_v1.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available as parity/non-interference proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture139 active-enemy legacy dependency retirement',
  rule26:{bytes:bytes.length,blob},
  target:{
    capture139TouchesActiveEnemies:false,
    legacyAuthorityPreserved:true,
    generalPregameCleanupPreserved:true,
    trueDungeonConsumersPreserved:true,
    publicCaptureEntryRoutingOnly:true
  }
},null,2));
