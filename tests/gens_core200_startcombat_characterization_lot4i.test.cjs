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

assert.equal((core200.match(/\bstartCombat\b/g)||[]).length,6,
  'Runtime 2.00 startCombat debt must stay explicit until each lexical callsite is migrated deliberately');
assert.match(core200,/function\s+startCombat\s*\(ids,reason\)/,
  'Runtime 2.00 must still expose the characterized legacy startCombat implementation');
assert.match(core200,/window\.dc200StartCombat\s*=\s*startCombat\s*;/,
  'Runtime 2.00 dc200StartCombat compatibility seed must remain explicit');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'manual'\)/,
  'Runtime 2.00 manual context action is a remaining lexical startCombat callsite');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(\[String\(target\.id\)\],'cell'\)/,
  'Runtime 2.00 cell attack context action is a remaining lexical startCombat callsite');
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'ambush'\)/,
  'Runtime 2.00 ambush context action is a remaining lexical startCombat callsite');
assert.match(core200,/if\(ids\.length\)startCombat\(ids,'stealth_fail'\);else render\(\)/,
  'Runtime 2.00 stealth failure is a remaining lexical startCombat callsite');

assert.match(core201,/function\s+requestCombat201\s*\(enemyIds,reason\).*GensRpgTacticalCombatV2Bridge\.requestCombat\(window/,
  'Core 2.01 encounter panel must already use the canonical Bridge');
assert.equal((core201.match(/requestCombat201\s*\(/g)||[]).length,3,
  'Core 2.01 must keep one helper plus exactly two Bridge-backed encounter actions');
assert.doesNotMatch(core201,/\bstartCombat\b/,
  'Core 2.01 must not reintroduce Runtime 2.00 startCombat');

console.log('GenSrpG combat lot 4I characterization OK: Runtime 2.00 has 3 context actions + definition + dc200 alias + stealth failure; Core 2.01 encounter panel is already Bridge-backed');
