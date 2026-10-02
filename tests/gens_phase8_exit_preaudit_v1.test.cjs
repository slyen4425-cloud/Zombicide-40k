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
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const v114=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
assert.match(roadmap,/## Phase 8 — Consolider Tactical[\s\S]*Critère de sortie : Tactical n’existe que pendant une session de combat et se démonte proprement\./);
assert.match(historical,/A1 — activation eager de la pile Tactical/,'historical preaudit must preserve initial blocker classification');
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/);
assert.match(entry,/function install\(\)[\s\S]*loadFacade\(\)/,'facade-only bootstrap must remain');
assert.match(entry,/function activate\(onReady\)/);assert.match(entry,/function deactivate\(/);assert.match(entry,/dispose:deactivate/);
assert.match(integration,/function deactivateCompatibilityChain\(/);
for(const [label,file] of [
 ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
 ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
 ['V110','assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js'],
 ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
 ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
 ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js'],
 ['V114.11','assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js']
]){
 const src=read(file);assert.match(src,/function installWithRetries\(rt=R\)/,label+' activation seam missing');assert.match(src,/function dispose\(rt=R\)/,label+' teardown ownership missing');
}
const closeFn=block(ui,'function close(apply=false){','function onClick','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove/);assert.match(closeFn,/GensTacticalV1\?\.deactivate\?\.\(\)/);
assert.match(bridge,/function dispose\(rt=R\)/);
assert.match(v113,/removeEventListener\("click",onBoard,false\)/);assert.match(v113,/removeEventListener\("pointerup",onBoard,false\)/);
assert.match(v114,/removeEventListener\("click",menuHandler,true\)/);
assert.ok(dungeonContract.owns.includes('combat trigger'));assert.ok(dungeonContract.forbidden.includes('Tactical combat resolution'));
assert.match(bridge,/function requestCombat\(rt=R,options=\{\}\)/);assert.match(bridge,/pending:true,reason:"tactical-activating"/);
console.log(JSON.stringify({
 scenario:'Phase 8 exit preaudit after session teardown ownership',
 resolved:['A1 eager private-stack activation','A2 session-unowned retries/listeners','A3 close lacks teardown','A4 V113 authority survives close','A5 UI/menu/start side effects survive close'],
 exitReadyCandidate:true,
 next:'run dedicated Phase 8 EXIT audit instead of legacy cleanup',
 dungeonCombatTriggerOwner:'Dungeon',explicitBoundary:'Bridge.requestCombat',indexChangeRequired:false
},null,2));
