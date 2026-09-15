const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');

assert.match(bridgeSource,/function ensureRuntimeRepair\(rt=R\)\{return installRepair\(rt\)\}/,'Bridge must only install an already-loaded runtime repair module');
assert.doesNotMatch(bridgeSource,/createElement\s*\(\s*["']script["']\s*\)/,'Bridge must never inject scripts');
assert.doesNotMatch(bridgeSource,/gens-rpg-runtime-repair-1678106\.js\?v=/,'Bridge must not own the runtime repair script URL');
assert.doesNotMatch(bridgeSource,/repairLoading/,'Bridge must not keep hidden script-loader state');

const bridgePos=bootstrap.indexOf('gens-rpg-tactical-combat-v2-bridge.js');
const repairPos=bootstrap.indexOf('gens-rpg-runtime-repair-1678106.js');
const survivalPos=bootstrap.indexOf('gens-survival-mode-isolation-1678104.js');
assert.ok(bridgePos>=0&&repairPos>bridgePos&&survivalPos>repairPos,'RuntimeBootstrap must load Bridge -> runtime repair -> Survival in that order');

let installs=0,created=0;
const rt={
  GensRpgRuntimeRepair1678106:{install(arg){assert.equal(arg,rt);installs++;return true}},
  document:{createElement(){created++;throw new Error('Bridge must not create scripts')}}
};
assert.equal(Bridge.ensureRuntimeRepair(rt),true);
assert.equal(installs,1,'Bridge must install the already-loaded runtime repair exactly once per explicit call');
assert.equal(created,0,'Bridge must not touch document.createElement when runtime repair is available');

const missing={document:{createElement(){created++;throw new Error('Bridge must not create scripts when runtime repair is absent')}}};
assert.equal(Bridge.ensureRuntimeRepair(missing),false,'missing runtime repair is a bootstrap/composition concern, not a Bridge loader concern');
assert.equal(created,0,'Bridge must stay loader-free when runtime repair is missing');

console.log('GenSrpG V114.11 Bridge runtime-repair hidden loader retired; RuntimeBootstrap owns composition');
