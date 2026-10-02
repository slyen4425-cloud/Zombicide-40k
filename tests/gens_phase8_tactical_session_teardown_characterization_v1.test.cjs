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

const entryApi=block(entry,'R.GensTacticalV1=Object.freeze({','});\ninstall();','entry API');
assert.match(entryApi,/\bactivate\b/,'entry must own activation before teardown migration');
assert.doesNotMatch(entryApi,/\bdeactivate\b|\bdispose\b/,'entry must characterize missing teardown API before migration');
assert.match(entry,/let activating=false,active=false/,'entry active lifecycle state missing');
assert.doesNotMatch(entry,/function deactivate\(|function dispose\(/,'entry must not already have private teardown');

const closeFn=block(ui,'function close(apply=false){','function onClick','UI close');
assert.match(closeFn,/rootEl\?\.remove/,'UI close must remove overlay');
assert.match(closeFn,/battle=null/,'UI close must clear local battle');
assert.doesNotMatch(closeFn,/GensTacticalV1|deactivate\(|dispose\(/,'UI close currently must not own global teardown');

const bridgeApi=block(bridge,'return {VERSION,APP_VERSION,','};\n});','Bridge API');
assert.match(bridgeApi,/requestCombat/,'Bridge requestCombat contract missing');
assert.doesNotMatch(bridgeApi,/\buninstall\b|\bdispose\b|\bdeactivate\b/,'Bridge must characterize missing teardown API before migration');
const bridgeInstall=block(bridge,'function install(rt=R){','function status(rt=R){','Bridge install');
for(const globalName of ['dc200StartCombat','openDungeonCombatSetup','openTacticalCombatV2']){
  assert.ok(bridgeInstall.includes(globalName),'Bridge install global missing: '+globalName);
}

assert.match(ui,/if\(D\(\)\)\{if\(D\(\)\.readyState==="loading"\)D\(\)\.addEventListener\("DOMContentLoaded",installGlobalPolish/,
  'base UI must characterize auto-install of global polish during private activation');
assert.match(ui,/wrapped\.__original=old;R\.dungeonMapHtml=wrapped/,
  'base UI must characterize restorable dungeonMapHtml wrapper');
assert.match(ui,/wrapped\.__original=old;core\[name\]=wrapped/,
  'base UI must characterize restorable Dungeon render wrappers');

const layers=[
  ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
  ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
  ['V110','assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js'],
  ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
  ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
  ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js'],
  ['V114.11','assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js']
];

for(const [label,file] of layers){
  const src=read(file);
  assert.match(src,/function installWithRetries\(rt=R\)/,label+' installWithRetries missing');
  assert.match(src,/setTimeout\(/,label+' must characterize bounded retry/timer source before ownership migration');
  const api=(src.match(/const api=\{[^\n]+\}/)||[''])[0];
  assert.ok(api,label+' API declaration missing');
  assert.doesNotMatch(api,/\bdispose\b|\buninstall\b|\bdeactivate\b/,label+' must characterize missing layer teardown API');
}

const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
assert.match(v113,/D\.addEventListener\("click",onBoard,false\);D\.addEventListener\("pointerup",onBoard,false\)/,
  'V113 board listeners must be explicit before teardown migration');
assert.doesNotMatch(v113,/removeEventListener\("click",onBoard|removeEventListener\("pointerup",onBoard/,
  'V113 board listeners must currently survive close');

const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.match(v11411,/D\.addEventListener\("click",ev=>[\s\S]*?\},true\);menuBound=true/,
  'V114.11 capture menu listener must be explicit before teardown migration');
assert.doesNotMatch(v11411,/removeEventListener\("click"/,
  'V114.11 menu listener must currently survive close');

assert.match(integration,/let compatibilityStarted=false/,'compatibility activation state must be characterized');
assert.doesNotMatch(integration,/function deactivateCompatibility|function disposeCompatibility/,
  'compatibility chain must currently have no teardown entry point');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical session teardown ownership characterization',
  beforeMigration:{
    entryOwnsActivation:true,
    entryOwnsDeactivation:false,
    uiCloseLocalOnly:true,
    bridgeGlobalInstall:true,
    bridgeDispose:false,
    compatibilityLayersWithDispose:0,
    v113DocumentListenersSurvive:true,
    v11411CaptureMenuListenerSurvives:true,
    compatibilityActivationResettable:false
  },
  targetOwner:'GensTacticalV1',
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
