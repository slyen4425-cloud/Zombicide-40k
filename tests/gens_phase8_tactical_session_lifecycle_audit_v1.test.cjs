'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,startSig,endSig,label)=>{
  const start=src.indexOf(startSig);
  assert.ok(start>=0,label+': missing '+startSig);
  const end=src.indexOf(endSig,start);
  assert.ok(end>start,label+': missing boundary '+endSig);
  return src.slice(start,end);
};

const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v109=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js');
const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
const singleDetection=read('tests/gens_tactical_single_detection_authority_v11411.test.cjs');

assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,
  'RuntimeBootstrap must currently load the public Tactical entry eagerly');
assert.match(bootstrap,/install\(\);\s*\}\)\(\);/,
  'RuntimeBootstrap currently auto-installs at application bootstrap');

const baseFiles=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'
];
let cursor=-1;
for(const file of baseFiles){
  const pos=entry.indexOf('"'+file+'"',cursor+1);
  assert.ok(pos>cursor,'Tactical public entry order drifted: '+file);
  cursor=pos;
}
assert.equal(baseFiles.at(-1),'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');

const finalize=block(entry,'function finalize(){','function load(i){','Tactical entry finalize');
assert.match(finalize,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'entry finalize must currently install Bridge immediately');
assert.equal((finalize.match(/setTimeout\(apply,/g)||[]).length,0,
  'public Tactical entry must keep delayed Bridge reinstalls retired');

const bridgeInstall=block(bridge,'function install(rt=R){','function status(rt=R){','Bridge install');
assert.match(bridgeInstall,/!rt\?\.GensRpgTacticalCombatV2\|\|!rt\?\.GensRpgTacticalCombatV2Adapter\|\|!rt\?\.GensRpgTacticalCombatV2Ui/,
  'Bridge install dependency guard must require engine, adapter and UI');
assert.match(bridgeInstall,/start\.__gensRpg113Start=true;start\.__gensRpg112Start=true/,
  'Bridge start wrapper must advertise V113/V112-equivalent authority');

const v113Hook=block(v113,'function hookStart(rt=R){','function scanDetection','V113 hookStart');
assert.match(v113Hook,/if\(cur\.__gensRpg113Start\)\{startHooked=true;return true\}/,
  'V113 must short-circuit when Bridge already owns the start wrapper');
assert.match(singleDetection,/Bridge global start adapter must advertise V113-equivalent scope\/detection semantics/,
  'single-detection authority guard must retain the Bridge/V113 compatibility proof');

const closeFn=block(ui,'function close(apply=false){','function getBattle(){','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove\?\.\(\)/,'close must remove the Tactical overlay');
assert.match(closeFn,/rootEl=null;battle=null/,'close must end the active battle session');
assert.doesNotMatch(closeFn,/removeEventListener|disconnect\(|clearTimeout|clearInterval/,
  'current UI close does not yet own global layer teardown; lifecycle debt must remain visible');

const autoLayers=[
  ['V108',v108],['V109',v109],['V110',v110],['V111',v111],
  ['V112',v112],['V113',v113],['V114.11',v11411]
];
for(const [label,src] of autoLayers){
  assert.match(src,/DOMContentLoaded[\s\S]*installWithRetries|else installWithRetries\(R\)/,
    label+' must currently characterize auto-install/retry behavior at load time');
}

const observerLayers=[['V108',v108],['V109',v109],['V111',v111],['V112',v112],['V113',v113]];
for(const [label,src] of observerLayers){
  assert.doesNotMatch(src,/function observe\(rt=R\)/,label+' inactive observer seam must stay retired');
  assert.doesNotMatch(src,/MutationObserver/,label+' MutationObserver authority must stay absent');
  const install=block(src,'function install(rt=R){','function installWithRetries',label+' install');
  assert.doesNotMatch(install,/observe\(rt\)/,label+' install must remain observer-free');
}

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical session lifecycle audit',
  current:{
    publicEntryLoadedEagerly:true,
    baseStackLoadedEagerly:true,
    bridgeImmediateInstalls:1,
    bridgeDelayedReinstalls:[],
    compatibilityLayersAutoInstall:true,
    historicalGlobalObserversActive:false,
    closeRemovesBattleOverlay:true,
    closeDisposesGlobalHooks:false
  },
  selectedNextSeam:'legacy observer seams retired; re-audit next lifecycle seam',
  evidence:{
    bridgeLoadedLast:true,
    dependenciesAvailableBeforeFinalize:true,
    bridgeMarksV113EquivalentStartAuthority:true,
    v113ShortCircuitsOnBridgeAuthority:true
  },
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
