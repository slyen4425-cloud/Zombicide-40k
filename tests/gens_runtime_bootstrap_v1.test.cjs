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

const expected=['assets/gensrpg/tactical/entry-v1.js?v=1'];
assert.deepEqual(loaded,expected,'RuntimeBootstrap must delegate only to the Tactical public entry');
assert.equal('__gensTacticalV2Loader105' in sandbox,false,'Core RuntimeBootstrap must not own Tactical private idempotency');
assert.equal(progressionInstalls,0,'progression-runtime-v1 must stay inactive; native changeXP owns manual XP');
assert.equal(bridgeInstalls,0,'Core RuntimeBootstrap must not install the Tactical bridge');
assert.deepEqual(timers,[],'Core RuntimeBootstrap must not own Tactical bridge retry timings');
assert.ok(sandbox.GensRuntimeBootstrapV1,'RuntimeBootstrap API missing');
const ownedFiles=Array.from(sandbox.GensRuntimeBootstrapV1.files);
assert.deepEqual(ownedFiles,['assets/gensrpg/tactical/entry-v1.js'],'RuntimeBootstrap API must expose only the public Tactical entry handoff');
assert.equal(ownedFiles.some(file=>/gens-rpg-tactical-combat-v2/.test(file)),false,'bootstrap must not expose Tactical private base files');

const before=loaded.length;
sandbox.GensRuntimeBootstrapV1.install();
assert.equal(loaded.length,before,'RuntimeBootstrap install must stay idempotent after the public entry is loaded');

console.log('GenSrpG RuntimeBootstrap V1 OK: generic bootstrap delegates to the Tactical public entry');
