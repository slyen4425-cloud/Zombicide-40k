const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const core318=fs.readFileSync(path.join(root,'assets/dungeon/dungeon-core-318.js'),'utf8');
const browser=fs.readFileSync(path.join(root,'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs'),'utf8');

const core200=(index.match(/<script[^>]*id=["']dungeonCore200Rebuild["'][^>]*>([\s\S]*?)<\/script>/i)||[])[1]||'';
assert.ok(core200,'Dungeon Core 2.00 block must exist');

assert.match(core200,/function syncEntranceState200\(x\)\{document\.body\?\.classList\?\.toggle\('dc054AtEntrance',Number\(x\?\.room\|\|0\)<=0\)\}/,'Core 2.00 must own entrance visibility from canonical runtime room');
assert.match(core200,/function render\(\)\{const x=spatialEnsure\(rt\(\)\);if\(!active200\|\|!x\)return;syncEntranceState200\(x\);syncChestAuthority208\(x\);/,'Core 2.00 render must synchronize entrance state before rendering room surfaces');

const syncBlock=(core200.match(/function syncEntranceState200\(x\)\{[^}]+\}/)||[''])[0];
assert.ok(syncBlock,'Core 2.00 entrance visibility function must exist');
assert.doesNotMatch(syncBlock,/setTimeout|setInterval|MutationObserver|location\.reload|location\.href|loadDungeonState/,'canonical entrance visibility must not use retry, observer, reload, or legacy state');

assert.doesNotMatch(core318,/syncEntranceVisibility|installEntranceVisibilityAuthority|__dc318EntranceAuthority/,'Core 3.18 must not duplicate Core 2.00 entrance visibility authority');

assert.match(browser,/#dc047RoomBoard \.dc047Grid/,'browser regression must assert the canonical Dungeon movement grid');
assert.match(browser,/runSameOpenSurvivalToDungeonScenario/,'browser regression must keep the same-page Survival -> Dungeon path');
assert.match(browser,/same-open Survival -> Dungeon must clear the obsolete entrance-only body state/,'browser regression must fail if stale entrance state hides the generated room');

console.log('gens_dungeon_entrance_visibility_authority_v1: GREEN');
