const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
const progression=fs.readFileSync(path.join(root,'assets','gensrpg','dungeon','progression-runtime-v1.js'),'utf8');

const direct='assets/gensrpg/dungeon/progression-runtime-v1.js';
const perf='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const pIndex=index.indexOf(direct), pPerf=index.indexOf(perf);
assert.ok(pIndex>=0,'Dungeon progression runtime must be loaded directly by index.html');
assert.ok(pPerf>=0 && pIndex<pPerf,'progression runtime must be available before the Tactical/performance bootstrap starts');
assert.ok(!bootstrap.includes('assets/gensrpg/dungeon/progression-runtime-v1.js'),'progression must not wait for the Tactical bootstrap file chain');
assert.ok(!bootstrap.includes('GensRpgProgressionRuntimeV1?.install'),'Tactical bootstrap must not own progression installation');

let legacyCalls=0,syncs=0,levelUps=0,saves=0,renders=0,sounds=0;
const ctx={
  console,document:{},
  current:'dungeon_lyra',
  state:{xp:9,rpgLevel:1,statPoints:0,skillPoints:0},
  changeXP(){legacyCalls++},
  isDungeonHeroSheet:()=>true,
  dungeonSyncProgressionForState(id,st){syncs++;st.rpgLevel=1+Math.floor(st.xp/10);st.statPoints=Math.max(0,st.rpgLevel-1);st.skillPoints=Math.max(0,st.rpgLevel-1)},
  dungeonHandleLevelUp071(){levelUps++},
  save(){saves++},render(){renders++},z40kPlayUiSound(){sounds++}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(progression,ctx,{filename:'progression-runtime-v1.js'});
assert.equal(typeof ctx.GensRpgProgressionRuntimeV1,'object');
assert.equal(ctx.changeXP.__gensRpgProgressionRuntimeV1,true,'direct script evaluation must install the Dungeon XP owner immediately');
ctx.changeXP(1);
assert.equal(legacyCalls,0,'Dungeon +XP must not fall through to the legacy handler');
assert.equal(ctx.state.xp,10);
assert.equal(ctx.state.rpgLevel,2);
assert.equal(ctx.state.statPoints,1);
assert.equal(syncs,1);
assert.equal(levelUps,1);
assert.equal(saves,1);
assert.equal(renders,1);
assert.equal(sounds,1);
console.log('GenSrpG V114.11 progression decoupling contract OK: +XP is installed immediately and independent from Tactical bootstrap');
