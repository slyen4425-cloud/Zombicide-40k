const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function script(id){
  const m=html.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,`${id} script missing`);
  return m[1];
}

const core030=script('dungeonCore030HeroReturnFix');
const core034=script('dungeonCore034NavigationAndCombatHostFix');
const core045=script('dungeonCore045HeroCombatModule');
const flow171=script('gensrpgDungeonFlowFix171');
const core053=script('dungeonCore053Stability');

// One historical rollback definition may remain, but no active Core layer may own/call it.
assert.equal((html.match(/\bopenDungeonCombatSetup\b/g)||[]).length,1,
  'openDungeonCombatSetup must remain only as the single historical rollback definition');
assert.match(html,/function\s+openDungeonCombatSetup\s*\(/,
  'historical rollback definition must remain available for Bridge legacy capture');

assert.doesNotMatch(core030,/window\.dc030EngageCombat\s*=/,
  'overwritten Core 0.30 combat owner must be retired instead of modernized');
assert.doesNotMatch(core030,/openDungeonCombatSetup/,
  'Core 0.30 must no longer depend on the historical setup');

assert.match(core034,/window\.dc030EngageCombat\s*=\s*function\(\)/,
  'Core 0.34 remains the native Dungeon trigger seam used by position guards');
assert.match(core034,/GensRpgTacticalCombatV2Bridge\?\.requestCombat/,
  'Core 0.34 trigger must delegate resolution to Bridge.requestCombat');
assert.match(core034,/reason:"manual-setup",entry:"dc030EngageCombat"/,
  'Core 0.34 must preserve the manual combat reason and diagnostic entry');
assert.doesNotMatch(core034,/openDungeonCombatSetup|renderDungeonCombatSetup/,
  'Core 0.34 must not reopen/render the historical combat setup');

assert.match(core045,/window\.dc030EngageCombat=function\(\)/,
  'heroCombat module gate must still protect the native Dungeon trigger');
assert.match(core045,/dc045HeroCombatEnabled\(\)/,
  'heroCombat module gate must remain authoritative');
assert.doesNotMatch(core045,/openDungeonCombatSetup/,
  'Core 0.45 must not wrap the retired historical setup');

assert.doesNotMatch(flow171,/window\.openDungeonCombatSetup\s*=/,
  'Flow 171 must not reinstall the legacy combat engine over the Tactical owner');

assert.doesNotMatch(core053,/openDungeonCombatSetup/,
  'Core 0.53 must stay on dc030/Bridge only');

const ambush=html.match(/window\.dc076StartAmbushCombat=function\(\)\{[\s\S]*?\n\};/);
assert.ok(ambush,'Core 0.76 ambush entry missing');
assert.match(ambush[0],/if\(typeof dc030EngageCombat==='function'\)dc030EngageCombat\(\);/,
  'ambush normal path must preserve the position-bypass dc030 chain');
assert.match(ambush[0],/GensRpgTacticalCombatV2Bridge\?\.requestCombat/,
  'ambush exceptional fallback must use Bridge.requestCombat');
assert.match(ambush[0],/enemyIds:living\.map\(e=>String\(e\.id\)\),reason:'embuscade',entry:'dc076AmbushFallback'/,
  'ambush fallback must preserve enemy scope and explicit ambush reason');
assert.doesNotMatch(ambush[0],/openDungeonCombatSetup/,
  'ambush must no longer depend on historical setup');

console.log('GenSrpG lot 3 target OK: active Dungeon combat triggers use Bridge; openDungeonCombatSetup is rollback-only');
