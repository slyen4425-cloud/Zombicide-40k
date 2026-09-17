const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}
function between(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>=0,`missing start marker: ${start}`);
  assert.ok(b>a,`missing end marker: ${end}`);
  return src.slice(a,b);
}

const core200=scriptBody('dungeonCore200Rebuild');
const core209=scriptBody('dungeonCore209TacticalSense');
const startCombat=between(core200,'function startCombat(ids,reason){','window.dc200StartCombat=startCombat;');
const ambush209=between(core209,'function resolveAmbush(x)','function panel(x,detectedTraps,zones)');

// Runtime 2.00 ambush is intentionally still a lexical legacy entry after lot 4K.
assert.match(core200,/b\.onclick\s*=\s*\(\)=>startCombat\(live\.map\(e=>String\(e\.id\)\),'ambush'\)/,
  'Runtime 2.00 ambush must remain on its characterized lexical startCombat path until semantic parity is explicit');
assert.match(startCombat,/let chosen=liveEnemies\(\)\.filter\(e=>ids\.map\(String\)\.includes\(String\(e\.id\)\)\)/,
  'legacy Runtime 2.00 ambush must preserve the requested live-enemy set');
assert.doesNotMatch(startCombat,/reason\s*===\s*['"]ambush['"]/,
  'legacy Runtime 2.00 startCombat must not silently gain detection-specific ambush filtering');

// Core 2.09 already owns a canonical Bridge-backed ambush contract with reason="ambush".
assert.match(ambush209,/GensRpgTacticalCombatV2Bridge\?\.requestCombat/,
  'Core 2.09 ambush must stay Bridge-backed');
assert.match(ambush209,/requestCombat\(window,\{enemyIds:live\.map\(e=>String\(e\.id\)\),reason:"ambush",entry:"dc209Ambush"\}\)/,
  'Core 2.09 canonical ambush reason/entry must remain unchanged');

// The Bridge deliberately classifies ambush as V113 detection semantics. Demonstrate
// why replacing the Runtime 2.00 lexical call by a direct requestCombat would not be
// behavior-preserving: an explicitly requested but non-detected enemy is removed.
assert.equal(Bridge.isV113DetectionReason('ambush'),true,
  'Bridge ambush must remain a V113 detection reason because Core 2.09 already depends on that contract');
const authority={
  detectionPairs(){return [{enemyId:'visible',heroId:'h1',scope:{room:1}}];}
};
const prepared=Bridge.prepareV113Detection({},authority,{
  enemyIds:['visible','hidden'],reason:'ambush',entry:'dc200AmbushAction'
});
assert.equal(prepared.ok,true);
assert.deepEqual(prepared.options.enemyIds,['visible'],
  'direct Bridge ambush filters a requested hidden enemy, unlike the Runtime 2.00 lexical liveEnemies path');
assert.deepEqual(prepared.options.sourceHeroIds,['h1']);

console.log('GenSrpG combat lot 4L characterization OK: Runtime 2.00 ambush migration is deferred because direct Bridge ambush has different V113 detection semantics');
