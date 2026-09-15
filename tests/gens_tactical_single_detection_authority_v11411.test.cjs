const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');

function installBlock(source,label){
  const start=source.indexOf('function install(rt=R){');
  assert.ok(start>=0,`${label}: install function missing`);
  const end=source.indexOf('function installWithRetries',start);
  assert.ok(end>start,`${label}: installWithRetries boundary missing`);
  return source.slice(start,end);
}

const i108=installBlock(v108,'V108');
const i111=installBlock(v111,'V111');
const i112=installBlock(v112,'V112');
const i113=installBlock(v113,'V113');

// Historical detectors stay inspectable, but V108/V111/V112 no longer activate them.
for(const [label,source,install] of [['V108',v108,i108],['V111',v111,i111],['V112',v112,i112]]){
  assert.match(source,/function (?:hookDetection|scanDetection|scanImmediateDetection)/,`${label}: historical detection seam must remain inspectable during progressive cleanup`);
  assert.doesNotMatch(install,/hookDetection\(rt\)/,`${label}: must not install combat detection`);
}
assert.doesNotMatch(i112,/scheduleDetection\(rt,"install-vision-v112",true\)/,'V112 must not perform an install-time detection scan');
assert.doesNotMatch(i112,/hookStart\(rt\)/,'V112 must not retake combat-start authority');

// V113 is the one active owner for movement, event, board and start/scope detection.
for(const required of ['ensureDetectionHooks(rt)','bindBoardClicks(rt)']){
  assert.ok(i113.includes(required),`V113 install must keep ${required}`);
}
assert.match(v113,/function ensureDetectionHooks\(rt=R\)\{hookMovement\(rt\);for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)hookEventFunction\(rt,name\);hookStart\(rt\);hookAdapter\(rt\);return true\}/,'V113 must own movement, events, start and adapter scope');
assert.match(v113,/wrapped\.__gensRpg113Detection=true;wrapped\.__original=old;rt\.dungeonMoveHero098=wrapped/,'V113 must be the active movement detection wrapper');
assert.match(v113,/event-detection-v113:/,'V113 must own event-triggered detection');
assert.match(v113,/board-cell-detection-v113/,'V113 must own board-cell detection');
assert.match(v113,/wrapped\.__gensRpg113Start=true;wrapped\.__gensRpg112Start=true/,'V113 must remain the final combat-start wrapper while blocking historical V112 retries');
assert.match(v113,/function heroScope\(/,'V113 must own branch-aware hero scope');
assert.match(v113,/function enemyScope\(/,'V113 must own branch-aware enemy scope');
assert.match(v113,/function selectCombatants\(/,'V113 must remain final combatant selector');

// There must be no active V108/V111/V112 detection call from any install seam.
const legacyInstalls=[i108,i111,i112].join('\n');
assert.doesNotMatch(legacyInstalls,/detection-immediate|detection-v111|vision-v112|hookDetection|scheduleDetection/,'legacy detection must not be activated by install');

console.log('GenSrpG V114.11 single detection authority OK: V113 alone owns active detection and branch-aware scope');
