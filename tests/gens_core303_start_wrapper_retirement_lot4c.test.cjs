const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');

function scriptById(id){
  const m=html.match(new RegExp('<script id="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'));
  assert.ok(m,`missing script #${id}`);
  return m[1];
}

const core=scriptById('dungeonCore303TimelineRootFix');

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
