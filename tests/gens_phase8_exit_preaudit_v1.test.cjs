'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,label+' block missing');return src.slice(a,b)};
const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
const historical=read('docs/GENSRPG_PHASE8_EXIT_PREAUDIT.md');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v109=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js');
const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const cartography=read('docs/GENSRPG_PHASE2_RUNTIME_CARTOGRAPHY.md');
assert.match(roadmap,/## Phase 8 — Consolider Tactical[\s\S]*Critère de sortie : Tactical n’existe que pendant une session de combat et se démonte proprement\./);
assert.match(historical,/A1 — activation eager de la pile Tactical/,'historical preaudit must preserve the original A1 finding');
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/);
assert.match(entry,/function install\(\)[\s\S]*loadFacade\(\)/,'A1 must now be resolved by facade-only bootstrap');
assert.match(entry,/function activate\(onReady\)/);
assert.match(integration,/GensRpgTacticalCompatibilityChainPhase8/);
assert.match(integration,/if\(!lifecycle\?\.activating\)activateCompatibilityChain\(\)/);
for(const [label,src] of [['V108',v108],['V109',v109],['V110',v110],['V111',v111],['V112',v112],['V113',v113],['V114.11',v11411]]){
 assert.match(src,/function installWithRetries\(rt=R\)/,label+' retry lifecycle debt missing');
 assert.doesNotMatch(src,/function dispose\(rt=R\)|function dispose\(/,label+' unexpectedly gained dispose in A1 lot');
}
const closeFn=block(ui,'function close(apply=false){','function getBattle(){','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove\?\.\(\)/);assert.match(closeFn,/rootEl=null;battle=null/);
assert.doesNotMatch(closeFn,/removeEventListener|clearTimeout|clearInterval|\.dispose/,'A3 teardown debt must remain visible');
const v113Install=block(v113,'function install(rt=R){','function installWithRetries','V113 install');
for(const call of ['ensureDetectionHooks(rt)','bindBoardClicks(rt)'])assert.ok(v113Install.includes(call),'A4 authority missing: '+call);
assert.match(v113,/rt\.dungeonMoveHero098=wrapped/);assert.match(v113,/D\.addEventListener\("click",onBoard,false\);D\.addEventListener\("pointerup",onBoard,false\)/);
assert.match(v11411,/D\.addEventListener\("click",[\s\S]*?stopImmediatePropagation/);assert.match(v11411,/function guardCombatStart[\s\S]*rt\.dc200StartCombat=wrapped/);
assert.ok(dungeonContract.owns.includes('combat trigger'));assert.ok(dungeonContract.forbidden.includes('Tactical combat resolution'));
assert.match(bridge,/function requestCombat\(rt=R,options=\{\}\)/);assert.match(bridge,/pending:true,reason:"tactical-activating"/);
for(const dead of ['gens-rpg-tactical-hotfix-1678114.js','gens-rpg-tactical-session-guard-16781144.js','gens-rpg-tactical-wall-dice-stats-16781145.js']){
 assert.ok(cartography.includes(dead));assert.ok(!integration.includes(dead));
}
console.log(JSON.stringify({
 scenario:'Phase 8 exit preaudit post-A1',
 resolved:['A1 eager private-stack activation'],
 stillBlocking:['A2 retries/auto-install resources lack session disposal','A3 close lacks teardown','A4 V113 exploration authority survives session','A5 UI/menu/start side effects survive session'],
 dungeonCombatTriggerOwner:'Dungeon',explicitBoundary:'Bridge.requestCombat',exitReady:false,indexChangeRequired:false
},null,2));
