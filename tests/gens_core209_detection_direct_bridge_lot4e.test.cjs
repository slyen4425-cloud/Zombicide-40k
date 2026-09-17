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

// Characterization: Core 2.09 remains owner of its detection bookkeeping only.
assert.match(detection,/if\(triggering\|\|!x\|\|Number\(x\.room\|\|0\)<=0\)return/,
  'Core 2.09 detection triggering/room guard must remain intact');
assert.match(detection,/const hid=activeId\(x\),hp=Number\(x\.positions\?\.\[hid\]\)/,
  'Core 2.09 must keep active hero position selection');
assert.match(detection,/const detectors=zones\.filter\(z=>z\.zone\.has\(hp\)\)/,
  'Core 2.09 must keep detectors that can actually see the active hero');
assert.match(detection,/x\.dc209Detected\[key\]=Date\.now\(\);save\(x\)/,
  'Core 2.09 detection de-duplication/persistence must remain intact');
assert.match(detection,/setTimeout\(\(\)=>\{/,
  'Core 2.09 detection scheduling must remain asynchronous');
assert.match(detection,/\},80\)/,
  'Core 2.09 detection delay must remain 80ms');
assert.match(detection,/setTimeout\(\(\)=>\{triggering=false\},250\)/,
  'Core 2.09 detection busy release must remain 250ms');

// Lot 4E target: only Core 2.09 detection final entry migrates to the canonical Bridge.
assert.doesNotMatch(detection,/\bdc200StartCombat\b/,
  'Core 2.09 detection must no longer depend on historical dc200StartCombat');
assert.match(detection,/GensRpgTacticalCombatV2Bridge\?\.requestCombat/,
  'Core 2.09 detection must explicitly require the canonical Bridge entry');
assert.match(detection,/requestCombat\(window,\{enemyIds:detectors\.map\(z=>String\(z\.e\.id\)\),reason:"detection",entry:"dc209EnemyDetection"\}\)/,
  'Core 2.09 must preserve detected enemyIds/reason while entering through requestCombat');

// Ambush was deliberately outside lot 4E. Keep its gameplay invariants protected here,
// while the entry mechanism itself is owned by the later dedicated lot 4F test.
assert.match(ambush,/if\(ambushStarting\|\|!x\|\|x\.last\?\.kind!=="ambush"\|\|Number\(x\.room\|\|0\)<=0\)return/,
  'Core 2.09 ambush guards must remain intact');
assert.match(ambush,/const live=living\(x\);if\(!live\.length\)return/,
  'Core 2.09 ambush must keep the exact live enemy source');
assert.match(ambush,/x\.dc209AmbushDone\[x\.room\]=true;save\(x\)/,
  'Core 2.09 ambush de-duplication/persistence must remain intact');
assert.match(ambush,/\},120\)/,
  'Core 2.09 ambush delay must remain 120ms');
assert.match(ambush,/setTimeout\(\(\)=>\{ambushStarting=false\},250\)/,
  'Core 2.09 ambush busy release must remain 250ms');

console.log('GenSrpG Core 2.09 direct detection Bridge lot 4E OK');
