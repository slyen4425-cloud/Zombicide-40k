const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/gensrpg/core/runtime-bootstrap-v1.js'),'utf8');
const loaded=[];
const timers=[];
let progressionInstalls=0,bridgeInstalls=0;

const head={appendChild(s){loaded.push(s.src);if(typeof s.onload==='function')s.onload();return s}};
const document={head,documentElement:head,createElement(tag){assert.equal(tag,'script');return {src:'',async:true,onload:null,onerror:null}}};
const sandbox={
  console,document,
  setTimeout(fn,ms){timers.push(ms);if(typeof fn==='function')fn();return timers.length},
  GensRpgProgressionRuntimeV1:{install(){progressionInstalls++}},
  GensRpgTacticalCombatV2Bridge:{install(){bridgeInstalls++}}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'runtime-bootstrap-v1.js'});

const expected=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js?v=16.78.105',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js?v=16.78.105'
];
assert.deepEqual(loaded,expected,'RuntimeBootstrap must preserve Tactical order without loading retired Survival isolation or a second changeXP owner');
assert.equal(sandbox.__gensTacticalV2Loader105,true,'historical loader guard must remain active');
assert.equal(progressionInstalls,0,'progression-runtime-v1 must stay inactive; native changeXP owns manual XP');
assert.equal(bridgeInstalls,4,'Tactical bridge must keep immediate + 3 retry installs');
assert.deepEqual(timers,[250,1200,3000],'RuntimeBootstrap Tactical bridge retry timings must remain unchanged');
assert.ok(sandbox.GensRuntimeBootstrapV1,'RuntimeBootstrap API missing');
const ownedFiles=Array.from(sandbox.GensRuntimeBootstrapV1.files);
assert.deepEqual(ownedFiles,expected.map(x=>x.replace('?v=16.78.105','')),'RuntimeBootstrap API must expose the owned composition');
assert.equal(ownedFiles.some(file=>/progression-runtime-v1/.test(file)),false,'bootstrap composition must not reclaim native manual XP ownership');

const before=loaded.length;
sandbox.GensRuntimeBootstrapV1.install();
assert.equal(loaded.length,before,'RuntimeBootstrap install must be idempotent after the guard is set');

console.log('GenSrpG RuntimeBootstrap V1 OK: native manual XP owner + deterministic Tactical load order');
