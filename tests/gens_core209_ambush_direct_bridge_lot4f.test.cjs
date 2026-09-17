const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

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

const core=scriptById('dungeonCore209TacticalSense');
const detection=between(core,'function resolveDetection(x,zones,dom)','let ambushStarting=false');
const ambush=between(core,'function resolveAmbush(x)','function panel(x,detectedTraps,zones)');

// Lot 4E stays protected: detection already owns only its bookkeeping and enters through the Bridge.
assert.doesNotMatch(detection,/\bdc200StartCombat\b/,
  'Core 2.09 detection must stay independent from historical dc200StartCombat');
assert.match(detection,/requestCombat\(window,\{enemyIds:detectors\.map\(z=>String\(z\.e\.id\)\),reason:"detection",entry:"dc209EnemyDetection"\}\)/,
  'Core 2.09 detection Bridge contract must remain unchanged during lot 4F');

// Characterization: Core 2.09 remains owner of ambush bookkeeping/timing only.
assert.match(ambush,/if\(ambushStarting\|\|!x\|\|x\.last\?\.kind!=="ambush"\|\|Number\(x\.room\|\|0\)<=0\)return/,
  'Core 2.09 ambush guard must remain intact');
assert.match(ambush,/const live=living\(x\);if\(!live\.length\)return/,
  'Core 2.09 ambush must keep the exact living enemy source');
assert.match(ambush,/x\.dc209AmbushDone=x\.dc209AmbushDone\|\|\{\}/,
  'Core 2.09 ambush persistence map initialization must remain intact');
assert.match(ambush,/if\(x\.dc209AmbushDone\[x\.room\]\)return/,
  'Core 2.09 ambush de-duplication guard must remain intact');
assert.match(ambush,/x\.dc209AmbushDone\[x\.room\]=true;save\(x\)/,
  'Core 2.09 ambush de-duplication/persistence must remain intact');
assert.match(ambush,/ambushStarting=true/,
  'Core 2.09 ambush busy lock must remain intact');
assert.match(ambush,/\},120\)/,
  'Core 2.09 ambush scheduling delay must remain 120ms');
assert.match(ambush,/setTimeout\(\(\)=>\{ambushStarting=false\},250\)/,
  'Core 2.09 ambush busy release must remain 250ms');

// Lot 4F target: only the final ambush combat entry migrates to the canonical Bridge.
assert.doesNotMatch(ambush,/\bdc200StartCombat\b/,
  'Core 2.09 ambush must no longer depend on historical dc200StartCombat');
assert.match(ambush,/GensRpgTacticalCombatV2Bridge\?\.requestCombat/,
  'Core 2.09 ambush must explicitly require the canonical Bridge entry');
assert.match(ambush,/requestCombat\(window,\{enemyIds:live\.map\(e=>String\(e\.id\)\),reason:"ambush",entry:"dc209Ambush"\}\)/,
  'Core 2.09 ambush must preserve enemyIds/reason while entering through requestCombat');

// The final Core 2.x compatibility alias is deliberately outside lot 4F.
assert.match(html,/window\.dc200StartCombat=startCombat;/,
  'Core 2.x dc200StartCombat compatibility alias must remain for a separate lot');

console.log('GenSrpG Core 2.09 direct ambush Bridge lot 4F OK');
