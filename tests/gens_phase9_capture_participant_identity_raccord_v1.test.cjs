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
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8165794,'participant raccord must inspect the verified post-raccord runtime');
assert.equal(blob,'462abc969e7ac636f8ac4ee54c0d14fe51b83e7d','participant raccord must inspect the exact verified post-raccord index blob');

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

const captureIdentity=/GensCaptureV1\.isProfile\s*\(\s*getActiveGameProfile\(\)\s*\)/;

assert.match(normalize,captureIdentity,
  'RED: normalizeGameParticipants must select Capture strict semantics from canonical Capture identity');
assert.match(normalize,/isDungeonMode\(\)/,
  'real Dungeon must keep its existing strict participant branch');
assert.ok(normalize.indexOf('GensCaptureV1.isProfile')<normalize.indexOf('loadTurnState()?.heroes'),
  'Capture identity decision must occur before the historical turn-state merge');
assert.ok(normalize.indexOf('isDungeonMode()')<normalize.indexOf('loadTurnState()?.heroes'),
  'Dungeon strict branch must remain before the historical turn-state merge');

assert.match(available,captureIdentity,
  'RED: availableParticipantHeroIds must know canonical Capture identity before Dungeon content loading');
assert.match(available,/isDungeonMode\(\)/,
  'available participants must still preserve the real Dungeon path');
assert.match(available,/ensureDungeonContent\(\)/,
  'real Dungeon still owns Dungeon content hydration');
assert.ok(available.indexOf('GensCaptureV1.isProfile')<available.indexOf('ensureDungeonContent()'),
  'Capture identity must be resolved before any Dungeon content hydration decision');
assert.doesNotMatch(available,/if\s*\(\s*isDungeonMode\(\)\s*&&\s*typeof ensureDungeonContent===["']function["']\s*\)\s*ensureDungeonContent\(\)/,
  'legacy Dungeon-only guard is insufficient because historical Capture identity also makes isDungeonMode true');

assert.match(allowed,/if\(id===GAME_PROFILE_DUNGEON_ID\)/,
  'true Dungeon participant IDs must remain owned by the canonical Dungeon profile branch');
assert.match(allowed,/p\.heroPool\.map\(String\)/,
  'Capture participant IDs must remain owned by active profile heroPool');
assert.match(ready,/normalizeGameParticipants\(\)/);
assert.match(ready,/gensCaptureStarterIdsForHero\(id\)/,
  'Capture starter readiness must remain owned by Capture creature state');

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_phase2_full_composition_capture_browser_v11411.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain present as non-interference proof');
}

console.log(JSON.stringify({
  scenario:'Phase 9 Capture participant identity raccord',
  rule26:{bytes:bytes.length,blob},
  target:{
    captureIdentity:'GensCaptureV1.isProfile(getActiveGameProfile())',
    strictNormalization:true,
    dungeonHydrationForCapture:false,
    canonicalIds:'allowedHeroIdsForActiveProfile -> profile.heroPool'
  }
},null,2));
