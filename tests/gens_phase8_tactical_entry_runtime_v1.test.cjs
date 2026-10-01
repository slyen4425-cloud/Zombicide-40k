'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/gensrpg/tactical/entry-v1.js'),'utf8');
const loaded=[];
const timers=[];
let bridgeInstalls=0;

const head={appendChild(s){loaded.push(s.src);if(typeof s.onload==='function')s.onload();return s}};
const document={head,documentElement:head,createElement(tag){assert.equal(tag,'script');return {src:'',async:true,onload:null,onerror:null}}};
const sandbox={
  console,document,
  setTimeout(fn,ms){timers.push(ms);if(typeof fn==='function')fn();return timers.length},
  GensRpgTacticalCombatV2Bridge:{install(){bridgeInstalls++}}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'tactical/entry-v1.js'});

const expected=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js?v=16.78.105'
];
assert.deepEqual(loaded,expected,'Tactical public entry must preserve the exact historical private-module order');
assert.equal(sandbox.__gensTacticalV2Loader105,true,'Tactical public entry must own the historical idempotency guard');
assert.equal(bridgeInstalls,4,'Tactical entry must preserve immediate + 3 bridge installs');
assert.deepEqual(timers,[250,1200,3000],'Tactical entry must preserve historical bridge retry timings');
assert.ok(sandbox.GensTacticalV1,'Tactical public API missing');
assert.deepEqual(Array.from(sandbox.GensTacticalV1.files),expected.map(x=>x.replace('?v=16.78.105','')),
  'Tactical public API must expose its ordered private composition');

const before={loads:loaded.length,timers:timers.length,bridges:bridgeInstalls};
sandbox.GensTacticalV1.install();
assert.equal(loaded.length,before.loads,'Tactical install must be idempotent after the historical guard is set');
assert.equal(timers.length,before.timers,'idempotent Tactical install must not schedule duplicate bridge retries');
assert.equal(bridgeInstalls,before.bridges,'idempotent Tactical install must not duplicate bridge installation');

console.log('Phase 8 Tactical public entry runtime handoff OK');
