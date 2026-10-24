const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const match=html.match(/<script\b[^>]*\bid="dungeonCore053Stability"[^>]*>([\s\S]*?)<\/script>/i);
assert.ok(match,'dungeonCore053Stability script missing');
const src=match[1];

assert.match(src,/function\s+combatOn53\(\)[\s\S]*dc045HeroCombatEnabled/,
  'Core 0.53 must preserve the heroCombat module gate');
assert.match(src,/function\s+coreCanAct53\(\)/,
  'Core 0.53 must preserve the current-device/current-hero gate');
assert.match(src,/if\(typeof dc030EngageCombat==="function"\)dc030EngageCombat\(\);/,
  'Core 0.53 normal combat path must remain dc030EngageCombat');
assert.match(src,/else if\(typeof window\.GensRpgTacticalCombatV2Bridge\?\.requestCombat==="function"\)window\.GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{reason:"manual-setup",entry:"dc053MainActionFallback"\}\);/,
  'Core 0.53 exceptional fallback must route directly through Bridge.requestCombat');
assert.doesNotMatch(src,/openDungeonCombatSetup/,
  'Core 0.53 must no longer depend on the historical openDungeonCombatSetup fallback');

const actionStart=src.indexOf('function mainAction53()');
const gatePos=src.indexOf('if(combatOn53())',actionStart);
const turnPos=src.indexOf('b.disabled=!coreCanAct53()',gatePos);
const normalPos=src.indexOf('if(typeof dc030EngageCombat==="function")dc030EngageCombat();',turnPos);
const bridgePos=src.indexOf('GensRpgTacticalCombatV2Bridge.requestCombat',normalPos);
assert.ok(actionStart>=0&&gatePos>actionStart&&turnPos>gatePos&&normalPos>turnPos&&bridgePos>normalPos,
  'Core 0.53 gate/order contract changed unexpectedly');

console.log('GenSrpG lot 3 OK: Core 0.53 keeps dc030 normal path and uses Bridge only as its exceptional fallback');
