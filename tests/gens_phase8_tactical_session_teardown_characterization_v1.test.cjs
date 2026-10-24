'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,label+' block missing');return src.slice(a,b)};
const doc=read('docs/GENSRPG_PHASE8_TACTICAL_SESSION_TEARDOWN_CHARACTERIZATION.md');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
assert.match(doc,/aucun teardown|aucun `dispose|sans propriétaire|survivent/i,'pre-migration teardown debt must remain documented');
const entryApi=block(entry,'R.GensTacticalV1=Object.freeze({','});\ninstall();','entry API');
assert.match(entryApi,/\bactivate\b/);assert.match(entryApi,/\bdeactivate\b/);assert.match(entryApi,/dispose:deactivate/);
assert.match(entry,/__gensTacticalV2Loader105=false/,'deactivate must restore cold-loader state');
assert.match(entry,/const warm=!!/,'loaded private APIs must support clean warm reactivation');
const closeFn=block(ui,'function close(apply=false){','function onClick','UI close');
assert.match(closeFn,/rootEl\?\.remove/);assert.match(closeFn,/battle=null/);assert.match(closeFn,/GensTacticalV1\?\.deactivate\?\.\(\)/);
const bridgeApi=block(bridge,'return {VERSION,APP_VERSION,','};\n});','Bridge API');
assert.match(bridgeApi,/\bdispose\b/);
assert.match(ui,/function dispose\(/);
for(const [label,file] of [
 ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
 ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
 ['V110','assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js'],
 ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
 ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
 ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js'],
 ['V114.11','assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js']
]){
 const src=read(file),api=(src.match(/const api=\{[^\n]+\}/)||[''])[0];
 assert.match(src,/function dispose\(rt=R\)/,label+' dispose missing');
 assert.match(api,/\bdispose\b/,label+' API dispose missing');
 assert.match(src,/clearTimeout/,label+' retries must be cancellable');
}
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
assert.match(v113,/D\.addEventListener\("click",onBoard,false\);D\.addEventListener\("pointerup",onBoard,false\)/);
assert.match(v113,/D\.removeEventListener\("click",onBoard,false\);D\.removeEventListener\("pointerup",onBoard,false\)/);
const v114=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.match(v114,/D\.addEventListener\("click",menuHandler=ev=>/);
assert.match(v114,/D\.removeEventListener\("click",menuHandler,true\)/);
assert.match(integration,/function deactivateCompatibilityChain\(/);
assert.match(integration,/compatibilityStarted=false/);
console.log(JSON.stringify({
 scenario:'Phase 8 Tactical session teardown ownership characterization',
 baselinePreservedInDoc:true,
 current:{entryOwnsActivation:true,entryOwnsDeactivation:true,uiCloseSignalsOwner:true,bridgeDispose:true,compatibilityLayersWithDispose:7,v113DocumentListenersRemoved:true,v11411CaptureMenuListenerRemoved:true,compatibilityActivationResettable:true},
 targetOwner:'GensTacticalV1',gameplayChangeExpected:false,indexChangeRequired:false
},null,2));
