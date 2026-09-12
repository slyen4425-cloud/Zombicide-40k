const fs=require('fs');
const assert=require('assert');

const home=fs.readFileSync('assets/gensrpg/gens-home-modes-1678129.js','utf8');
const cleanup=fs.readFileSync('assets/gensrpg/gens-dungeon-ui-cleanup-1678100.js','utf8');

assert.match(home,/APP_VERSION="16\.78\.129"/);
assert.match(home,/MODE CAPTURE/,'Capture must be exposed as a top-level home mode');
assert.match(home,/openGensFamily\?\.\("capture"\)/,'Capture root card must route to its own family');
assert.match(home,/gensContentFamilyForProfile\?\.\(p\)==="creature"/,'Capture family must use the existing canonical content-family classifier');
assert.match(home,/filter\(p=>!isCapture\(p\)\)/,'RPG list must have an explicit non-Capture filter');
assert.match(home,/data-capture-profile/,'Capture universes must render in their own list');
assert.match(home,/openGensBuiltInGame\(\\'[^']*\\',\\'adventure\\'\)/,'Capture cards must keep the existing adventure engine route internally');
assert.match(home,/DUNGEON BUILDER/,'Dungeon Builder access must be visible again');
assert.match(home,/openDungeonAdvancedEditor/,'Dungeon Builder card must use the existing editor instead of creating another builder');
assert.match(home,/selectRpgUniverseProfile/,'Dungeon Builder must select the canonical Dungeon universe before opening');
assert.match(home,/applyRpgGameplayPreset\?\.\("creature"\)/,'New Capture universes must enter the existing Creature gameplay preset');

assert.match(cleanup,/gens-home-modes-1678129\.js\?v=1678129/,'The already-loaded cleanup runtime must bootstrap the home-mode patch');
assert.match(cleanup,/ensureHomeModes\(\)/);

// Syntax guard: parsing must succeed without executing browser-only code.
new Function(home);
new Function(cleanup);

console.log('gens_home_modes_v1678129: success');
