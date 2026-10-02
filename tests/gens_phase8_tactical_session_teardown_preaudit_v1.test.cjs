'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,label+' block missing');return src.slice(a,b)};
const doc=read('docs/GENSRPG_PHASE8_TACTICAL_SESSION_TEARDOWN_PREAUDIT.md');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
assert.match(doc,/GensTacticalV1/,'historical teardown preaudit must remain documented');
assert.match(entry,/function activate\(onReady\)/);
assert.match(entry,/function deactivate\(/,'selected teardown owner must now be implemented');
assert.match(entry,/dispose:deactivate/);
const closeFn=block(ui,'function close(apply=false){','function onClick','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove/);assert.match(closeFn,/battle=null/);
assert.match(closeFn,/GensTacticalV1\?\.deactivate\?\.\(\)/,'UI close must signal teardown owner');
assert.match(bridge,/function dispose\(rt=R\)/,'Bridge must now own reversible global wrappers');
assert.match(ui,/function dispose\(/,'base UI global polish must now be reversible');
assert.match(integration,/function deactivateCompatibilityChain\(/,'compatibility chain must now teardown in reverse order');
for(const [label,file] of [
 ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
 ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
 ['V110','assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js'],
 ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
 ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
 ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js'],
 ['V114.11','assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js']
]){
 const src=read(file);
 assert.match(src,/function installWithRetries\(rt=R\)/,label+' activation retries must remain bounded/explicit');
 assert.match(src,/function dispose\(rt=R\)/,label+' must now own teardown of its resources');
 assert.match(src,/clearTimeout\s*\(/,label+' pending retries must be session-cancellable');
}
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
assert.match(v113,/removeEventListener\("click",onBoard,false\)/);
assert.match(v113,/removeEventListener\("pointerup",onBoard,false\)/);
const v114=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.match(v114,/removeEventListener\("click",menuHandler,true\)/);
console.log(JSON.stringify({
 scenario:'Phase 8 Tactical session teardown preaudit',
 historicalBlockerPreservedInDoc:true,
 selectedSeamImplemented:true,
 owner:'GensTacticalV1',
 reverseCompatibilityTeardown:true,
 retryCancellation:true,
 documentListenerRemoval:true,
 next:'re-audit exit criterion',
 gameplayChangeExpected:false,indexChangeRequired:false
},null,2));
