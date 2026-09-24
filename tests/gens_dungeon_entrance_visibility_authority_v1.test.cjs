const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const core=fs.readFileSync(path.join(root,'assets/dungeon/dungeon-core-318.js'),'utf8');
const browser=fs.readFileSync(path.join(root,'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs'),'utf8');

assert.match(core,/const RT_KEY="gensrpg_dungeon_runtime_v2"/,'Core 3.18 must read the canonical Dungeon runtime');
assert.match(core,/function syncEntranceVisibility\(\)\{[\s\S]*?const x=readRuntime\(\);[\s\S]*?classList\.toggle\("dc054AtEntrance",normRoom\(x\.room\)<=0\);[\s\S]*?return true;[\s\S]*?\}/,'entrance visibility must follow canonical runtime.room');
assert.match(core,/for\(const name of \["render","show"\]\)/,'authority must synchronize on canonical Dungeon render/show');
assert.match(core,/__dc318EntranceAuthority/,'entrance visibility owner must be identifiable and idempotent');

const syncBlock=(core.match(/function syncEntranceVisibility\(\)\{[\s\S]*?\n\}/)||[''])[0];
assert.ok(syncBlock,'syncEntranceVisibility block must exist');
assert.doesNotMatch(syncBlock,/setTimeout|setInterval|MutationObserver|location\.reload|location\.href/,'entrance visibility correction must not use retry, observer, or reload');
assert.doesNotMatch(syncBlock,/loadDungeonState/,'modern visibility authority must not fall back to legacy Dungeon state');

assert.match(browser,/#dc047RoomBoard \.dc047Grid/,'browser regression must assert the canonical Dungeon movement grid');
assert.match(browser,/runSameOpenSurvivalToDungeonScenario/,'browser regression must keep the same-page Survival -> Dungeon path');
assert.match(browser,/dc054AtEntrance/,'browser regression must fail if stale entrance state hides a generated room');

console.log('gens_dungeon_entrance_visibility_authority_v1: GREEN');
