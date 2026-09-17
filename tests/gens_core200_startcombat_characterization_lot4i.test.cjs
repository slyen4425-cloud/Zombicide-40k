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

assert.equal((core200.match(/\bstartCombat\b/g)||[]).length,5,
  'Runtime 2.00 startCombat debt must be exactly definition + dc200 alias + manual/cell/ambush after lot 4I');
assert.match(core200,/function\s+startCombat\s*\(ids,reason\)/,
  'Runtime 2.00 must still expose the characterized legacy startCombat implementation');
assert.match(core200,/window\.dc200StartCombat\s*=\s*startCombat\s*;/,
  'Runtime 2.00 dc200StartCombat compatibility seed must remain explicit');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'manual'\)/,
  'Runtime 2.00 manual context action remains a lexical startCombat callsite');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(\[String\(target\.id\)\],'cell'\)/,
  'Runtime 2.00 cell attack context action remains a lexical startCombat callsite');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'ambush'\)/,
  'Runtime 2.00 ambush context action remains a lexical startCombat callsite');

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

assert.match(core201,/function\s+requestCombat201\s*\(enemyIds,reason\).*GensRpgTacticalCombatV2Bridge\.requestCombat\(window/,
  'Core 2.01 encounter panel must already use the canonical Bridge');
assert.equal((core201.match(/requestCombat201\s*\(/g)||[]).length,3,
  'Core 2.01 must keep one helper plus exactly two Bridge-backed encounter actions');
assert.doesNotMatch(core201,/\bstartCombat\b/,
  'Core 2.01 must not reintroduce Runtime 2.00 startCombat');

console.log('GenSrpG combat lot 4I OK: stealth failure is Bridge-backed; Runtime 2.00 retains only manual/cell/ambush + definition + dc200 alias');
