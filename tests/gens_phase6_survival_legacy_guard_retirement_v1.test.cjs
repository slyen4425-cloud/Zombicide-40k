'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const legacy=path.join(root,'assets','gensrpg','gens-survival-mode-isolation-1678104.js');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
const tacticalEntry=fs.readFileSync(path.join(root,'assets','gensrpg','tactical','entry-v1.js'),'utf8');

assert.equal(fs.existsSync(legacy),false,
  'Phase 6 must retire the legacy Survival/Dungeon isolation guard instead of moving it into survival/');

assert.doesNotMatch(bootstrap,/gens-survival-mode-isolation-1678104\.js/,
  'runtime bootstrap must stop loading the retired Survival/Dungeon guard');
assert.doesNotMatch(bootstrap,/GensSurvivalModeIsolation1678104/,
  'runtime bootstrap must stop reinstalling the retired Survival/Dungeon guard');

assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,
  'retiring the Survival guard must not disturb the Tactical public-entry handoff');
assert.match(tacticalEntry,/gens-rpg-tactical-combat-v2-bridge\.js/,
  'retiring the Survival guard must not disturb the Tactical private runtime list');
assert.match(tacticalEntry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'retiring the Survival guard must keep the existing Tactical bridge finalize path');

assert.ok(fs.existsSync(path.join(root,'tests','gens_phase6_survival_without_legacy_isolation_guard_browser_v1.test.cjs')),
  'Phase 6 browser characterization must remain as the regression contract');

console.log(JSON.stringify({
  scenario:'Phase 6 retire legacy Survival/Dungeon isolation guard',
  legacyFile:false,
  bootstrapLegacyReference:false,
  tacticalBridgePreserved:true
},null,2));
