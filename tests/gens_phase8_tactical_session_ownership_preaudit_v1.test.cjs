'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const inventory=read('tests/gens_combat_callsite_inventory_v11411.test.cjs');
const core200=read('tests/gens_core200_startcombat_characterization_lot4i.test.cjs');
const nativeUi=read('tests/gens_combat_ui_direct_entry_migration_1.test.cjs');
const preauditDoc=read('docs/GENSRPG_PHASE8_TACTICAL_SESSION_OWNERSHIP_PREAUDIT.md');
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/);
assert.doesNotMatch(bootstrap,/gens-rpg-tactical-combat-v2(?:-adapter|-rules|-integration|-ui|-bridge)?\.js/);
assert.match(preauditDoc,/Façade Bridge chargée \/ pile Tactical privée activée à la première requête de combat/);
assert.match(entry,/const facadeFile="assets\/gensrpg\/gens-rpg-tactical-combat-v2-bridge\.js"/);
assert.match(entry,/function activate\(onReady\)/);
assert.match(entry,/function install\(\)[\s\S]*loadFacade\(\)/);
assert.match(bridge,/function requestCombat\(rt=R,options=\{\}\)/);
assert.match(bridge,/GensTacticalV1\?\.activate/,'Bridge must now request cold activation');
assert.match(bridge,/pending:true,reason:"tactical-activating"/);
assert.match(inventory,/final raw dc200StartCombat occurrence is an intentional compatibility[\s\S]*not an active Dungeon callsite/);
assert.match(core200,/all active Runtime 2\.00 combat actions are Bridge-backed/);
assert.match(nativeUi,/two native manual buttons -> Bridge\.requestCombat/);
console.log(JSON.stringify({
 scenario:'Phase 8 Tactical session ownership preaudit',
 selectedSeamImplemented:true,
 keepLoaded:['Core RuntimeBootstrap -> public Tactical entry','canonical Bridge facade'],
 deferredUntilFirstCombat:['engine','adapter','rules','integration','UI','compatibility chain activation'],
 trigger:'Bridge.requestCombat',indexChangeRequired:false
},null,2));
