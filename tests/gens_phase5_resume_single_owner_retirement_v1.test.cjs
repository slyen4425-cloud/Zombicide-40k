const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function block(id){
  const m=html.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core100=block('dungeonCore100ResumeAndInteractionFix');
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
