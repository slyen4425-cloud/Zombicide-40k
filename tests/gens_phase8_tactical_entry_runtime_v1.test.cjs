'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/gensrpg/tactical/entry-v1.js'),'utf8');
const loaded=[],timers=[];let bridgeInstalls=0,ready=0;
const sandbox={console,setTimeout(fn,ms){timers.push(ms);return timers.length}};
const head={appendChild(s){
 loaded.push(s.src);
 if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'))sandbox.GensRpgTacticalCombatV2Bridge={install(){bridgeInstalls++;return true}};
 if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2.js'))sandbox.GensRpgTacticalCombatV2={};
 if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js'))sandbox.GensRpgTacticalCombatV2Adapter={};
 if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js'))sandbox.GensRpgTacticalCombatV2Rules={};
 if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js'))sandbox.GensRpgTacticalCombatV2Ui={};
 if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js')){
   s.onload?.();sandbox.GensTacticalV1.compatibilityReady(true);return s;
 }
 s.onload?.();return s;
}};
sandbox.document={head,documentElement:head,createElement(){return {src:'',async:true,onload:null,onerror:null}}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(src,sandbox,{filename:'tactical/entry-v1.js'});
assert.deepEqual(loaded,['assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js?v=16.78.105'],'bootstrap must load facade only');
assert.equal(bridgeInstalls,0);assert.notEqual(sandbox.__gensTacticalV2Loader105,true);
sandbox.GensTacticalV1.activate(ok=>{assert.equal(ok,true);ready++});
assert.deepEqual(loaded.slice(1),[
 'assets/gensrpg/gens-rpg-tactical-combat-v2.js?v=16.78.105',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js?v=16.78.105',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js?v=16.78.105',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js?v=16.78.105',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js?v=16.78.105'
]);
assert.equal(sandbox.__gensTacticalV2Loader105,true);
assert.equal(bridgeInstalls,1);assert.equal(ready,1);assert.deepEqual(timers,[]);
const before=loaded.length;sandbox.GensTacticalV1.activate(ok=>{assert.equal(ok,true);ready++});
assert.equal(loaded.length,before);assert.equal(bridgeInstalls,1);assert.equal(ready,2);
console.log('Phase 8 Tactical public entry runtime: facade eager, private stack first-request only');
