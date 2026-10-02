'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,label+' block missing');return src.slice(a,b)};
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const singleDetection=read('tests/gens_tactical_single_detection_authority_v11411.test.cjs');
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/);
assert.match(entry,/const facadeFile="assets\/gensrpg\/gens-rpg-tactical-combat-v2-bridge\.js"/);
assert.match(entry,/function activate\(onReady\)/);
assert.match(entry,/function install\(\)[\s\S]*loadFacade\(\)/,'bootstrap install must now load only the facade');
assert.match(bridge,/return \{ok:true,pending:true,reason:"tactical-activating"\}/,'cold Bridge request must own activation');
assert.match(integration,/GensRpgTacticalCompatibilityChainPhase8/);
assert.match(integration,/if\(!lifecycle\?\.activating\)activateCompatibilityChain\(\)/);
const bridgeInstall=block(bridge,'function install(rt=R){','function status(rt=R){','Bridge install');
assert.match(bridgeInstall,/start\.__gensRpg113Start=true;start\.__gensRpg112Start=true/);
const v113Hook=block(v113,'function hookStart(rt=R){','function scanDetection','V113 hookStart');
assert.match(v113Hook,/if\(cur\.__gensRpg113Start\)\{startHooked=true;return true\}/);
assert.match(singleDetection,/Bridge global start adapter must advertise V113-equivalent scope\/detection semantics/);
const closeFn=block(ui,'function close(apply=false){','function getBattle(){','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove\?\.\(\)/);assert.match(closeFn,/rootEl=null;battle=null/);
assert.doesNotMatch(closeFn,/removeEventListener|disconnect\(|clearTimeout|clearInterval|dispose/,'teardown debt must remain visible after A1');
console.log(JSON.stringify({
 scenario:'Phase 8 Tactical session lifecycle audit',
 current:{publicEntryLoadedAtBootstrap:true,bridgeFacadeLoadedAtBootstrap:true,privateStackLoadedAtBootstrap:false,privateStackActivatesOnFirstCombat:true,closeDisposesGlobalHooks:false},
 selectedNextSeam:'A1 resolved; teardown ownership remains blocking',
 gameplayChangeExpected:false,indexChangeRequired:false
},null,2));
