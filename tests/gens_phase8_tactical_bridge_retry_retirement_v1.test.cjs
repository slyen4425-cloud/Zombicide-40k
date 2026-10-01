'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/tactical/entry-v1.js');

const expectedFiles=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'
];

let cursor=-1;
for(const file of expectedFiles){
  const pos=entry.indexOf('"'+file+'"',cursor+1);
  assert.ok(pos>cursor,'base Tactical composition order drifted: '+file);
  cursor=pos;
}

assert.match(entry,/const apply=\(\)=>\{try\{R\.GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'finalize must retain one immediate Bridge install');
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0,
  'public Tactical entry must not schedule delayed Bridge reinstalls');

const loaded=[],timers=[];
let bridgeInstalls=0;
const head={appendChild(s){loaded.push(s.src);if(typeof s.onload==='function')s.onload();return s}};
const document={head,documentElement:head,createElement(){return {src:'',async:true,onload:null,onerror:null}}};
const sandbox={
  console,document,
  setTimeout(fn,ms){timers.push(ms);if(typeof fn==='function')fn();return timers.length},
  GensRpgTacticalCombatV2Bridge:{install(){bridgeInstalls++;return true}}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'tactical/entry-v1.js'});

assert.deepEqual(loaded,expectedFiles.map(f=>f+'?v=16.78.105'),
  'runtime must keep exact base load order');
assert.equal(bridgeInstalls,1,'Bridge must install exactly once after base composition');
assert.deepEqual(timers,[],'public Tactical entry must not leave Bridge retry timers');
assert.equal(sandbox.__gensTacticalV2Loader105,true,'historical idempotency guard must remain set');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical Bridge retry retirement',
  bridgeLast:true,
  immediateInstalls:1,
  delayedReinstalls:[],
  totalBridgeInstalls:1
},null,2));
