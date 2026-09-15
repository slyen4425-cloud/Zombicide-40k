const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const block=(source,startSig,nextSig,label)=>{
  const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);
  const end=source.indexOf(nextSig,start);assert.ok(end>start,`${label}: missing boundary ${nextSig}`);
  return source.slice(start,end);
};

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v109=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const doc=read('docs/GENSRPG_VISUAL_AUTHORITY_INVENTORY.md');

// Canonical base UI owns direct wall emission + live Dungeon repair.
assert.match(ui,/const WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/,'base Tactical UI must own the validated wall asset');
assert.match(ui,/function wallTileHtml\(\).*gtv2WallTile/,'base Tactical UI must emit a real wall image tile');
assert.match(ui,/function ensureWallTile\(el\)/,'base Tactical UI must own idempotent wall tile attachment');
const renderGrid=block(ui,'function renderGrid(){','function renderRosterGroup','base Tactical UI renderGrid');
assert.match(renderGrid,/blocked\.has\(k\)\?wallTileHtml\(\)/,'blocked Tactical cells must render their wall tile directly');
assert.match(ui,/function patchDungeonMapHtml\(\)/,'base Tactical UI must own Dungeon wall HTML patching');
assert.match(ui,/function paintLiveWalls\(\)/,'base Tactical UI must own live wall repair');
assert.match(ui,/function hookDungeonRender\(\)/,'base Tactical UI must own Dungeon render hookup');
const globalPolish=block(ui,'function installGlobalPolish(){','const api=','base Tactical UI installGlobalPolish');
for(const required of ['preloadWall()','patchDungeonMapHtml()','hookDungeonRender()','paintLiveWalls()'])assert.ok(globalPolish.includes(required),`base Tactical UI canonical wall pipeline missing ${required}`);

// Remaining active historical wall debt after retiring V113.
const i108=block(v108,'function install(rt=R){','function installWithRetries','V108 install');
for(const required of ['patchDungeonMapHtml(rt)','hookDungeonRender(rt)','paintWalls(rt)'])assert.ok(i108.includes(required),`V108 wall debt changed unexpectedly: missing ${required}`);

const i109=block(v109,'function install(rt=R){','function installWithRetries','V109 install');
assert.ok(i109.includes('hookDungeonRender(rt)'),'V109 wall debt changed unexpectedly: Dungeon render hook missing');
assert.ok(i109.includes('enhance(rt)'),'V109 wall debt changed unexpectedly: enhance missing');
const enhance109=block(v109,'function enhance(rt=R){','function hookUi','V109 enhance');
assert.ok(enhance109.includes('paintBuilderWalls(rt)'),'V109 enhance must still characterize active wall repaint debt');

const i111=block(v111,'function install(rt=R){','function installWithRetries','V111 install');
assert.ok(i111.includes('maintain(rt)'),'V111 maintenance must still be active before wall retirement');
const maintain111=block(v111,'function maintain(rt=R){','function queueMaintain','V111 maintain');
assert.ok(maintain111.includes('paintWalls(rt)'),'V111 maintenance must characterize active wall repaint debt');

const i112=block(v112,'function install(rt=R){','function installWithRetries','V112 install');
assert.ok(i112.includes('maintain(rt)'),'V112 maintenance must still be active before wall retirement');
const maintain112=block(v112,'function maintain(rt=R){','function queueMaintain','V112 maintain');
assert.ok(maintain112.includes('markWallCells(rt)'),'V112 maintenance must characterize active wall repaint debt');

// V113 historical painter remains inspectable, but it is no longer an active wall owner.
assert.match(v113,/function paintWalls\(rt=R\)/,'V113 historical wall painter must remain inspectable for rollback');
const maintain113=block(v113,'function maintain(rt=R){','function queueMaintain','V113 maintain');
const i113=block(v113,'function install(rt=R){','function installWithRetries','V113 install');
assert.doesNotMatch(maintain113,/paintWalls\(rt\)/,'V113 maintenance must no longer repaint walls');
assert.doesNotMatch(i113,/paintWalls\(rt\)/,'V113 install must no longer repaint walls');
assert.ok(i113.includes('ensureDetectionHooks(rt)'),'V113 detection authority must remain active');
assert.ok(i113.includes('bindBoardClicks(rt)'),'V113 board detection must remain active');

for(const name of ['V108','V109','V111','V112','V113'])assert.match(doc,new RegExp(name),`visual authority inventory must document ${name}`);
assert.match(doc,/V113 \| \*\*retirée\*\*/,'visual authority inventory must mark V113 wall authority retired');
assert.match(doc,/GensRpgTacticalCombatV2Ui/,'visual authority inventory must name base Tactical UI as target authority');

console.log('GenSrpG V114.11 visual authority: base Tactical UI canonical; V113 wall repaint retired; V108/V109/V111/V112 debt remains');
