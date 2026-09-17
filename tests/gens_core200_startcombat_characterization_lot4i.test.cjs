const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core200=scriptBody('dungeonCore200Rebuild');
const core201=scriptBody('dungeonCore201Stability');

assert.equal((core200.match(/\bstartCombat\b/g)||[]).length,3,
  'Runtime 2.00 startCombat debt must be exactly definition + dc200 alias + cell after lot 4L');
assert.match(core200,/function\s+startCombat\s*\(ids,reason\)/,
  'Runtime 2.00 must still expose the characterized legacy startCombat implementation');
assert.match(core200,/window\.dc200StartCombat\s*=\s*startCombat\s*;/,
  'Runtime 2.00 dc200StartCombat compatibility seed must remain explicit');
assert.doesNotMatch(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'manual'\)/,
  'Lot 4K must remove the Runtime 2.00 manual lexical startCombat callsite');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>window\.GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:live\.map\(e=>String\(e\.id\)\),reason:'manual',entry:'dc200ManualAction'\}\)/,
  'Lot 4K manual action must enter through the canonical Tactical Bridge');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(\[String\(target\.id\)\],'cell'\)/,
  'Runtime 2.00 cell attack context action remains the sole lexical startCombat callsite');
assert.doesNotMatch(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'ambush'\)/,
  'Lot 4L must remove the Runtime 2.00 ambush lexical startCombat callsite');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>window\.GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:live\.map\(e=>String\(e\.id\)\),reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true\}\)/,
  'Lot 4L ambush action must enter through the canonical Tactical Bridge with its already-selected enemy seed preserved');

const stealthLine=core200.split('\n').find(line=>line.includes('window.dc047ResolveStealth=function(success)'));
assert.ok(stealthLine,'Runtime 2.00 stealth resolver must remain present');
assert.doesNotMatch(stealthLine,/startCombat\(ids,'stealth_fail'\)/,
  'Lot 4I must remove the stealth-failure lexical dependency on startCombat');
assert.match(stealthLine,/const enemies=liveEnemies\(\),ids=enemies\.map\(e=>String\(e\.id\)\)/,
  'Lot 4I must preserve the exact live-enemy source before opening combat');
assert.match(stealthLine,/modal\('🥷 REPÉRAGE ÉCHOUÉ'/,
  'Lot 4I must preserve the stealth-failure confirmation popup');
assert.match(stealthLine,/window\.GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:ids,reason:'stealth_fail',entry:'dc200StealthFailure'\}\)/,
  'Lot 4I stealth failure must enter combat through the canonical Tactical Bridge with the preserved reason and explicit entry');
assert.match(stealthLine,/else render\(\)\};$/,
  'Lot 4I must keep the no-enemy fallback render path');
assert.equal((core200.match(/entry:'dc200StealthFailure'/g)||[]).length,1,
  'Runtime 2.00 must expose exactly one canonical stealth-failure Bridge entry');
assert.equal((core200.match(/entry:'dc200ManualAction'/g)||[]).length,1,
  'Runtime 2.00 must expose exactly one canonical manual Bridge entry after lot 4K');
assert.equal((core200.match(/entry:'dc200AmbushAction'/g)||[]).length,1,
  'Runtime 2.00 must expose exactly one canonical ambush Bridge entry after lot 4L');

assert.match(core201,/function\s+requestCombat201\s*\(enemyIds,reason\).*GensRpgTacticalCombatV2Bridge\.requestCombat\(window/,
  'Core 2.01 encounter panel must already use the canonical Bridge');
assert.equal((core201.match(/requestCombat201\s*\(/g)||[]).length,3,
  'Core 2.01 must keep one helper plus exactly two Bridge-backed encounter actions');
assert.doesNotMatch(core201,/\bstartCombat\b/,
  'Core 2.01 must not reintroduce Runtime 2.00 startCombat');

console.log('GenSrpG combat lot 4I/4K/4L OK: stealth failure, manual and ambush are Bridge-backed; Runtime 2.00 retains only cell + definition + dc200 alias');
