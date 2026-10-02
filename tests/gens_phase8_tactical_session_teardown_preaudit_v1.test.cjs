'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,label+' block missing');
  return src.slice(a,b);
};

const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v109=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js');
const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const v114=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');

// A1 est déjà retiré : façade seule au bootstrap, pile privée à la première requête.
assert.match(entry,/const facadeFile="assets\/gensrpg\/gens-rpg-tactical-combat-v2-bridge\.js"/);
assert.match(entry,/function activate\(onReady\)/);
assert.match(bridge,/return \{ok:true,pending:true,reason:"tactical-activating"\}/);

// Close local : l'overlay et le battle sont démontés.
const closeFn=block(ui,'function close(apply=false){','function onClick','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove\?\.\(\)/);
assert.match(closeFn,/rootEl=null;battle=null/);
assert.doesNotMatch(closeFn,/GensTacticalV1|deactivate|dispose|removeEventListener|clearTimeout/,
  'current UI close must remain characterized as local-only before teardown migration');

// Le listener du root est session-scoped car son propriétaire DOM est retiré avec rootEl.
assert.match(ui,/rootEl\.addEventListener\("click",onClick\)/);
assert.match(closeFn,/rootEl\?\.remove\?\.\(\)/);

// L'entrée publique n'a pas encore d'autorité de teardown.
assert.doesNotMatch(entry,/function (?:deactivate|dispose)\s*\(/);
assert.doesNotMatch(entry,/\b(?:deactivate|dispose)\b[^\n]*status/);

// Bridge : wrappers globaux installés, sans uninstall/dispose.
const bridgeInstall=block(bridge,'function install(rt=R){','function status(rt=R){','Bridge install');
for(const token of ['rt.dc200StartCombat=start','rt.openDungeonCombatSetup=setup','rt.openTacticalCombatV2=']){
  assert.ok(bridgeInstall.includes(token),'Bridge persistent authority missing from characterization: '+token);
}
assert.doesNotMatch(bridge,/function (?:uninstall|dispose)\s*\(/);

// Base UI : polish Dungeon global installé avec la pile privée et non démonté par close.
assert.match(ui,/function installGlobalPolish\(\)\{[\s\S]*patchDungeonMapHtml\(\);hookDungeonRender\(\)/);
assert.match(ui,/installGlobalPolish\(\)\}\s*return api|else installGlobalPolish\(\)/);

// Couches de compatibilité : side effects globaux actifs + aucun dispose.
const layers=[
  ['V108',v108,/addEventListener\?\.\("click"/,/hookUiRender\(rt\)/],
  ['V109',v109,/addEventListener\?\.\("click"/,/hookUi\(rt\)/],
  ['V110',v110,/addEventListener\("click"/,/hookAdapter\(rt\).*hookRules\(rt\).*hookUi\(rt\)/s],
  ['V111',v111,/addEventListener\("click"/,/hookAdapter\(rt\).*hookMultiDice\(rt\).*hookUiRender\(rt\)/s],
  ['V112',v112,/addEventListener\("click"/,/hookAdapter\(rt\).*hookResultDetails\(rt\)/s],
  ['V113',v113,/addEventListener\("click",onBoard,false\).*addEventListener\("pointerup",onBoard,false\)/s,/ensureDetectionHooks\(rt\)/],
  ['V114.11',v114,/addEventListener\("click"/,/patchHitResolver\(rt\).*patchUiOpen\(rt\).*guardCombatStart\(rt\)/s]
];
for(const [label,src,listener,authority] of layers){
  assert.match(src,listener,label+' global listener/side effect must be characterized');
  assert.match(src,authority,label+' active authority must be characterized');
  assert.doesNotMatch(src,/function (?:uninstall|dispose)\s*\(/,label+' must still lack teardown before migration');
}

// Retries bornés mais non possédés par une session : ils peuvent encore tirer après close.
for(const [label,src] of [
  ['V108',v108],['V109',v109],['V110',v110],['V111',v111],['V112',v112],['V113',v113],['V114.11',v114]
]){
  assert.match(src,/function installWithRetries\(rt=R\)/,label+' installWithRetries missing');
  assert.doesNotMatch(src,/clearTimeout\s*\(/,label+' retries are not currently cancellable');
}
assert.match(v113,/\[80,220,600,1200,2500,5000,7500,10000\]/,
  'V113 longest retry window must remain visible in teardown audit');

// La chaîne installe les couches, mais ne possède aucun teardown inverse.
assert.match(integration,/GensRpgTacticalRuntimeAuthority1678113\?\.installWithRetries/);
assert.match(integration,/GensRpgTacticalVisualDice16781142[\s\S]*installWithRetries/);
assert.doesNotMatch(integration,/\.dispose\?\.\(|deactivateCompatibility|disposeCompatibility/);

// V113 reste une autorité Dungeon hors combat après le premier combat.
assert.match(v113,/rt\.dungeonMoveHero098=wrapped/);
assert.match(v113,/for\(const name of \["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"\]\)/);
assert.match(v113,/rt\?\.dc200StartCombat\?\.\(ids,reason\)/);

// Ressources bornées/locales classées B : overlay root et transition auto-retirée.
assert.match(v114,/setTimeout\(\(\)=>el\.remove\?\.\(\),TRANSITION_MS\+40\)/);

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical session teardown preaudit',
  alreadyGreen:{
    coldActivationOwnedByBridge:true,
    privateStackColdBeforeFirstCombat:true,
    localOverlayRemovedOnClose:true
  },
  blockersA:[
    'public entry has no deactivate/dispose owner',
    'Bridge global wrappers survive close',
    'V108-V114.11 global listeners/wrappers survive close',
    'installWithRetries timers are not session-cancellable',
    'V113 Dungeon detection authority survives close',
    'base UI Dungeon polish survives close'
  ],
  backlogB:[
    'loaded script elements/global API objects may remain if authority is inert',
    'overlay root click listener dies with removed overlay',
    'bounded transition-removal timer is self-cleaning'
  ],
  selectedNextSeam:{
    owner:'GensTacticalV1',
    contract:'deactivate/dispose once per closed session',
    order:'private compatibility/UI resources disposed in reverse install order',
    futureActivation:'same loaded APIs may reinstall cleanly on next request',
    bridgeFacade:'remains inert/public between combats'
  },
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
