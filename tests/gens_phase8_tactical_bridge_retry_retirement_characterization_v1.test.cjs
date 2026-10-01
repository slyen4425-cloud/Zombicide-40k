'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');

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
assert.equal(expectedFiles.at(-1),'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js',
  'Bridge must remain the last base file before finalize');

assert.match(entry,/const apply=\(\)=>\{try\{R\.GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'current finalize must own immediate Bridge install');
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0,
  'retired public-entry Bridge retries must not reappear');

assert.match(bridge,/if\(!rt\?\.GensRpgTacticalCombatV2\|\|!rt\?\.GensRpgTacticalCombatV2Adapter\|\|!rt\?\.GensRpgTacticalCombatV2Ui\)return false/,
  'Bridge install dependency guard drifted');
assert.match(bridge,/start\.__gensTacticalV2Default=true;start\.__gensRpg113Start=true;start\.__gensRpg112Start=true/,
  'Bridge start wrapper must retain V113/V112 authority markers');
assert.match(v113,/if\(cur\.__gensRpg113Start\)\{startHooked=true;return true\}/,
  'V113 must keep short-circuiting when Bridge already owns start authority');

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
  'runtime characterization must keep exact base load order');
assert.equal(bridgeInstalls,1,'current runtime must keep one immediate Bridge install');
assert.deepEqual(timers,[],'retired public-entry Bridge retry timers must stay absent');
assert.equal(sandbox.__gensTacticalV2Loader105,true,'historical idempotency guard must remain set');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical Bridge retry retirement characterization',
  bridgeLast:true,
  immediateInstalls:1,
  preMigrationDelayedReinstalls:[250,1200,3000],
  delayedReinstalls:[],
  totalBridgeInstalls:1,
  v113RespectsBridgeAuthority:true,
  nextTarget:'retired'
},null,2));
