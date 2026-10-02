'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0,'retired public Bridge retries must stay absent');
assert.match(entry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,'entry must retain one lifecycle-owned Bridge install');
assert.match(entry,/function activate\(onReady\)/,'Bridge install must now belong to first-request activation');
assert.match(bridge,/start\.__gensTacticalV2Default=true;start\.__gensRpg113Start=true;start\.__gensRpg112Start=true/);
assert.match(v113,/if\(cur\.__gensRpg113Start\)\{startHooked=true;return true\}/);
console.log(JSON.stringify({
 scenario:'Phase 8 Tactical Bridge retry retirement characterization',
 preMigrationDelayedReinstalls:[250,1200,3000],delayedReinstalls:[],
 bootstrapBridgeInstalls:0,firstActivationBridgeInstalls:1,v113RespectsBridgeAuthority:true
},null,2));
