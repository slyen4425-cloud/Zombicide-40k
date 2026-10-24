const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
// R11 removed Core 1.00's already inert tag. Restore R10 byte-exact for
// historical absence-of-authority assertions; check current DOM separately.
const historicalR10=cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r11_retired_scripts.cjs','--restore-r10'],{
  cwd:path.join(__dirname,'..'),maxBuffer:10*1024*1024,
  // Exact pre-Chrome HTML applies exclusively inside this historical rollback
  // child process; neither current runtime nor saved profiles are modified.
  env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS||'',
    '--require='+path.join(__dirname,'helpers/gens_chrome_historical_subprocess_view_20261024.cjs')]
    .filter(Boolean).join(' ')}
}).toString('utf8');

function block(id,source=html){
  const m=source.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

assert.doesNotMatch(html,/<script\b[^>]*\bid=["']dungeonCore100ResumeAndInteractionFix["']/i,
  'R11 must physically retire the non-executing Core 1.00 tag');
const core100=block('dungeonCore100ResumeAndInteractionFix',historicalR10);
const core307=block('dungeonCore307CriticalResumeFix');
const core310=block('dungeonCore310PersistenceAndTokens');

assert.doesNotMatch(core100,/window\.resumeGame\s*=/,
  'Core 1.00 must no longer own Dungeon resume routing');
assert.doesNotMatch(core307,/window\.resumeGame\s*=/,
  'Core 3.07 must no longer own Dungeon resume routing');
assert.equal((core310.match(/window\.resumeGame\s*=/g)||[]).length,1,
  'Core 3.10 must be the single inline Dungeon resume owner');

assert.match(core310,/const previousResume310=window\.resumeGame;/,
  'Core 3.10 must capture the pre-Dungeon Shell resume authority');
assert.match(core310,/const capture=typeof isCaptureContext138==="function"&&isCaptureContext138\(\);/);
assert.match(core310,/const dungeon=typeof isDungeonMode==="function"&&isDungeonMode\(\)&&!capture;/);
assert.match(core310,/return typeof previousResume310==="function"\?previousResume310\.apply\(this,arguments\):undefined/);

const resumeAssignments=[...html.matchAll(/window\.resumeGame\s*=/g)].length;
assert.equal(resumeAssignments,1,
  'Phase 5 target: one explicit inline resumeGame assignment, owned by Core 3.10');

console.log(JSON.stringify({
  scenario:'Phase 5 single Dungeon Resume owner retirement',
  retired:['dungeonCore100ResumeAndInteractionFix','dungeonCore307CriticalResumeFix'],
  owner:'dungeonCore310PersistenceAndTokens',
  explicitAssignments:resumeAssignments
}));
