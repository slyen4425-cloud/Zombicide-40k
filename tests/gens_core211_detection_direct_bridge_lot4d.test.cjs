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
function between(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>=0,`missing start marker: ${start}`);
  assert.ok(b>a,`missing end marker: ${end}`);
  return src.slice(a,b);
}

const core=scriptById('dungeonCore211Consolidation');
const detection=between(core,'function resolveEnemyDetection211','function sensePanel211');

// Characterization: Core 2.11 remains owner of its own visual detection bookkeeping.
assert.match(detection,/ex\.enemyDetection===false\|\|detectBusy211/,
  'Core 2.11 detection enable/busy guard must remain intact');
assert.match(detection,/DungeonSpatial313\?\.sameView\(x,id\)!==false/,
  'Core 2.11 must keep same-view filtering');
assert.match(detection,/x\.dc211EnemyDetection\[sig\]=Date\.now\(\);saveRt211\(x\)/,
  'Core 2.11 detection de-duplication/persistence must remain intact');
assert.match(detection,/const ids=\[\.\.\.new Set\(spotted\.flatMap\(s=>s\.by\.map\(z=>String\(z\.e\.id\)\)\)\)\]/,
  'Core 2.11 must keep the exact detected enemy id selection');
assert.match(detection,/setTimeout\(.*80\)/s,
  'Core 2.11 detection scheduling must remain intact');
assert.match(detection,/setTimeout\(\(\)=>detectBusy211=false,250\)/,
  'Core 2.11 detection busy release must remain intact');

// Lot 4D target: only the final combat entry changes to the canonical Bridge contract.
assert.doesNotMatch(detection,/\bdc200StartCombat\b/,
  'Core 2.11 detection must no longer depend on historical dc200StartCombat');
assert.match(detection,/GensRpgTacticalCombatV2Bridge\?\.requestCombat/,
  'Core 2.11 detection must explicitly require the canonical Bridge entry');
assert.match(detection,/requestCombat\(window,\{enemyIds:ids,reason:"detection",entry:"dc211EnemyDetection"\}\)/,
  'Core 2.11 must preserve enemyIds/reason while entering through requestCombat');

// V113 scope/detection remains centralized in the Bridge, not reimplemented in Core 2.11.
assert.match(bridge,/function prepareV113Detection\(/,
  'Bridge must retain V113 detection preparation');
assert.match(bridge,/const prepared=prepareV113Detection\(rt,authority,options\)/,
  'Bridge scopedRequest must still pass detection through V113 preparation');
assert.match(bridge,/authority\.selectCombatants\(rt,prepared\.options\|\|\{\}\)/,
  'Bridge must retain V113 participant selection');

console.log('GenSrpG Core 2.11 direct detection Bridge lot 4D OK');
