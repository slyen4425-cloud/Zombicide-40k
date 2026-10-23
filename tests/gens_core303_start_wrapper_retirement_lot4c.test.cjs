const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');

// R16 externalizes Core303 byte-identically at the original classic parser slot.
const owner='assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js';
const tag='<script id="dungeonCore303TimelineRootFix" src="'+owner+'"></script>';
assert.equal(html.split(tag).length-1,1,'Core303 classic owner must load once');
assert.doesNotMatch(html,/<script id="dungeonCore303TimelineRootFix">/,'No second inline Core303 writer');
assert.ok(html.indexOf('src="assets/dungeon/dungeon-core-316.js"')<html.indexOf(tag),'Core303 stays after Core316');
assert.ok(html.indexOf(tag)<html.indexOf('id="dungeonCore304DefeatExit"'),'Core303 stays before Core304');
const core=fs.readFileSync(path.join(root,owner),'utf8');
const bytes=Buffer.from(core,'utf8');
const crypto=require('node:crypto');
const sha=crypto.createHash('sha1').update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex');
assert.equal(sha,'fe7c0cff03f7e19f49d3c743257c5fe717f40593','Core303 original code must remain byte-exact');

// Core 3.03 stays active as the timeline/turn owner.
assert.match(core,/let T=\{sig:"",order:\[\],index:0,aiBusy:false,pendingHero:false\}/,
  'Core 3.03 timeline state must remain intact');
assert.match(core,/function init\(force=false\)/,
  'Core 3.03 timeline initialization must remain intact');
assert.match(core,/function advance\(\)/,
  'Core 3.03 turn advance must remain intact');
assert.match(core,/function applyTurnUi\(\)/,
  'Core 3.03 turn UI authority must remain intact');
assert.match(core,/window\.dungeonDebug303=function\(\)/,
  'Core 3.03 debug surface must remain intact');

// But Core 3.03 must no longer reclaim the combat-start global after Core 2.x.
assert.doesNotMatch(core,/oldStart301\s*=\s*window\.dc200StartCombat/,
  'Core 3.03 must not capture the historical dc200StartCombat entry');
assert.doesNotMatch(core,/window\.dc200StartCombat\s*=\s*function/,
  'Core 3.03 must not wrap/reinstall dc200StartCombat');
assert.doesNotMatch(core,/\bdc200StartCombat\b/,
  'Core 3.03 must contain no historical combat-start entry reference after lot 4C');

// Tactical Bridge remains the final Dungeon combat entry owner.
assert.match(bridge,/rememberLegacy\(rt\.dc200StartCombat,"start"\)/,
  'Bridge must keep rollback capture for the pre-Bridge entry');
assert.match(bridge,/rt\.dc200StartCombat=start/,
  'Bridge install must remain the final dc200StartCombat owner');
assert.match(bridge,/return requestCombat\(rt,\{enemyIds:arr\(enemyIds\)\.map\(str\),reason,entry:"dc200StartCombat"\}\)/,
  'Bridge dc200StartCombat compatibility entry must still route to requestCombat');

console.log('GenSrpG Core 3.03 combat-start wrapper retirement lot 4C OK');
