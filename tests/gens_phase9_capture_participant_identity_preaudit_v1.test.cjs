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
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8165438,'participant preaudit must inspect the current verified Phase 9 runtime');
assert.equal(blob,'1a61147d5a32889fa85e6a09e846049103b9f0bf','participant preaudit must inspect the exact verified post-raccord index blob');

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

const normalize=fn('normalizeGameParticipants');
const available=fn('availableParticipantHeroIds');
const allowed=fn('allowedHeroIdsForActiveProfile');
const ready=fn('gensCaptureParticipantsReady');
const starter=fn('gensCaptureStarterIdsForHero');

assert.match(captureEntry,/function isProfile\(profile\)/);
assert.doesNotMatch(captureEntry,/gameStyle|isDungeonMode|document\.|localStorage/,
  'canonical Capture identity must remain pure and Dungeon-independent');

assert.match(normalize,/GensCaptureV1\.isProfile\(getActiveGameProfile\(\)\)/,
  'Capture strict participant normalization must now use canonical Capture identity');
assert.match(normalize,/isDungeonMode\(\)/,
  'real Dungeon must retain its strict participant branch');
assert.match(normalize,/availableParticipantHeroIds\(\)/);
assert.match(normalize,/loadTurnState\(\)\?\.heroes/,
  'non-Dungeon active sessions still merge historical turn heroes');
assert.ok(normalize.indexOf('isDungeonMode()')<normalize.indexOf('loadTurnState()?.heroes'),
  'strict Dungeon branch must precede the historical turn-state merge');

assert.match(available,/GensCaptureV1\.isProfile\(getActiveGameProfile\(\)\)/,
  'participant availability must resolve canonical Capture identity');
assert.match(available,/if\(!capture && isDungeonMode\(\) && typeof ensureDungeonContent==="function"\)ensureDungeonContent\(\)/,
  'Dungeon content hydration must be excluded for Capture while remaining for true Dungeon');
assert.match(available,/allowedHeroIdsForActiveProfile\(\)/);

assert.match(allowed,/if\(id===GAME_PROFILE_DUNGEON_ID\)/);
assert.match(allowed,/ensureDungeonContent\(\)/);
assert.match(allowed,/p\.heroPool\.map\(String\)/,
  'non-builtin RPG and Capture profiles already use profile.heroPool as participant authority');

assert.match(index,/const MC162_ID="gp_mt7ker7t_m2iw9"/);
assert.match(index,/"heroPool":\["custom_mt7lk6jv_ioga"\]/,
  'built-in Monster Capture must keep its trainer in heroPool');
assert.match(index,/"profile":"creature"/);
assert.match(index,/"capture":true/);
assert.match(index,/"controllableCreatures":true/);

assert.match(ready,/normalizeGameParticipants\(\)/);
assert.match(ready,/gensCaptureStarterIdsForHero\(id\)/);
assert.match(starter,/creatureTeam/,
  'Capture starter readiness must stay owned by Capture hero creature state');

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_phase2_full_composition_capture_browser_v11411.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available for the future participant seam');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture participant identity preaudit',
  rule26:{bytes:bytes.length,blob},
  currentCoupling:{
    normalizeViaDungeonIdentity:false,
    dungeonContentLoadedForCapture:false
  },
  canonicalParticipantSource:'active profile heroPool through allowedHeroIdsForActiveProfile',
  selectedSeam:'explicit Capture strict normalization + Dungeon-only ensureDungeonContent',
  runtimeChanged:true
},null,2));
