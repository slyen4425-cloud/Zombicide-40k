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
const entryApi=block(entry,'R.GensTacticalV1=Object.freeze({','});\ninstall();','entry API');
assert.match(entry,/function deactivate\(/,'GensTacticalV1 must own session deactivate');
assert.match(entryApi,/\bdeactivate\b/,'GensTacticalV1 public API must expose deactivate');
assert.match(entryApi,/\bdispose\s*:\s*deactivate\b|\bdispose\b/,'GensTacticalV1 must expose dispose alias/entry point');
assert.match(entry,/active=false/,'entry deactivate must return lifecycle to cold state');
assert.match(entry,/__gensTacticalV2Loader105\s*=\s*false/,'entry deactivate must allow a clean later activation');

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const closeFn=block(ui,'function close(apply=false){','function onClick','UI close');
assert.match(closeFn,/GensTacticalV1\?\.deactivate\?\.\(\)|GensTacticalV1\.deactivate\(\)/,
  'UI.close must signal end-of-session to the unique lifecycle owner');
assert.match(ui,/function dispose\(/,'base Tactical UI must own disposal of its global polish');
assert.match(ui,/\bdispose\b/,'base Tactical UI API must expose dispose');

const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
assert.match(bridge,/function dispose\(/,'Bridge must expose a reversible teardown');
const bridgeApi=block(bridge,'return {VERSION,APP_VERSION,','};\n});','Bridge API');
assert.match(bridgeApi,/\bdispose\b/,'Bridge API must expose dispose');
assert.match(bridge,/__gensTacticalV2Default/,'Bridge wrappers must remain ownership-marked');

const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
assert.match(integration,/function deactivateCompatibilityChain\(/,'compatibility chain must expose teardown/reset');
assert.match(integration,/deactivate\s*:\s*deactivateCompatibilityChain|deactivateCompatibilityChain/,
  'compatibility chain API must expose deactivate');
assert.match(integration,/compatibilityStarted\s*=\s*false/,'compatibility activation state must reset after teardown');

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
  assert.match(src,/function dispose\(rt=R\)/,label+' must own disposal of resources it installs');
  const api=(src.match(/const api=\{[^\n]+\}/)||[''])[0];
  assert.ok(api,label+' API declaration missing');
  assert.match(api,/\bdispose\b/,label+' public API must expose dispose');
  assert.match(src,/retryTimers|pendingRetries|clearTimeout/,
    label+' must own/cancel pending install retries');
}

const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
assert.match(v113,/removeEventListener\("click"/,'V113 must remove board click listener');
assert.match(v113,/removeEventListener\("pointerup"/,'V113 must remove board pointer listener');

const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.match(v11411,/removeEventListener\("click"/,'V114.11 must remove capture menu listener');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical session teardown ownership',
  owner:'GensTacticalV1',
  requires:{
    entryDeactivate:true,
    uiCloseSignalsOwner:true,
    bridgeDispose:true,
    compatibilityReset:true,
    layerDispose:7,
    retryCancellation:true,
    documentListenerRemoval:true,
    reactivationColdState:true
  },
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
