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

// Phase 12 D5: this exact classic owner was moved from inline HTML to an
// unchanged synchronous JS file. Verify the owner and its immutable body.
const crypto=require('node:crypto');
const ownerPath=path.join(root,'assets/gensrpg/dungeon/core211-consolidation-v1.js');
const ownerBytes=fs.readFileSync(ownerPath);
const hash=crypto.createHash('sha1').update(Buffer.from('blob '+ownerBytes.length+'\0')).update(ownerBytes).digest('hex');
assert.equal(ownerBytes.length,17511,'D5 original detection owner length');
assert.equal(hash,'bba60d921df20a114b489e17f9222e0c4f310871','D5 original detection owner Git blob');
assert.equal(html.split('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>').length-1,1,'single classic owner at parser time');
const core=ownerBytes.toString('utf8');
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
assert.match(bridge,/const preparedOptions=prepared\.options\|\|\{\},selection=authority\.selectCombatants\(rt,preparedOptions\)/,
  'Bridge must retain V113 participant selection through the prepared options contract');

console.log('GenSrpG Core 2.11 direct detection Bridge lot 4D OK');
