const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

assert.match(source,/function observe\(rt=R\)/,'historical V113 observer seam should remain inspectable during progressive cleanup');
assert.match(source,/observer\.observe\(D\.body,\{childList:true,subtree:true\}\)/,'characterization must identify the historical V113 body observer');
const install=(source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(install,'V113 install function missing');
assert.doesNotMatch(install,/observe\(rt\)/,'V113 must no longer activate a document.body MutationObserver');
for(const required of ['ensureStyle(rt)','ensureDetectionHooks(rt)','animateDiceOverlay(rt)'])assert.ok(install.includes(required),`observer retirement must preserve V113 behavior: missing ${required}`);
assert.ok(!install.includes('bindBoardClicks(rt)'),'V113 install must not restore board click/pointer movement detection');
assert.doesNotMatch(install,/paintWalls\(rt\)/,'V113 wall authority retirement must stay compatible with observer retirement');
assert.match(source,/function paintWalls\(rt=R\)/,'historical V113 wall painter should remain inspectable during progressive cleanup');
assert.match(source,/function animateDiceOverlay\(rt=R\)\{return false\}/,'V113 must remain non-authoritative for dice animation');
assert.match(source,/for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)/,'V113 event detection hooks must remain explicit');
assert.doesNotMatch(source,/D\.addEventListener\("click",onBoard,false\);D\.addEventListener\("pointerup",onBoard,false\)/,'V113 must not retain board click/pointer movement detection');

assert.match(integration,/GensRpgTacticalRuntimeAuthority1678113\?\.installWithRetries\?\.\(R\)/,'clean V113 must install directly');
assert.doesNotMatch(integration,/installWithoutGlobalObserver|R\.MutationObserver\s*=/,'V113 must no longer require or trigger a global observer shim');
console.log('GenSrpG V114.11: V113 observer retired, wall repaint inactive, canonical detection hooks preserved without board-click duplication');
