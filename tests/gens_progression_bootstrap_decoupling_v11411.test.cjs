const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
const progression=fs.readFileSync(path.join(root,'assets','gensrpg','dungeon','progression-runtime-v1.js'),'utf8');

assert.match(bootstrap,/PROGRESSION_SRC\s*=\s*["']assets\/gensrpg\/dungeon\/progression-runtime-v1\.js["']/,'bootstrap must declare progression as an explicit prerequisite');
const filesBlock=bootstrap.match(/const files=\[([\s\S]*?)\];/);
assert.ok(filesBlock,'RuntimeBootstrap files list missing');
assert.ok(!filesBlock[1].includes('progression-runtime-v1.js'),'progression must not wait inside the Tactical/Survival file chain');
const finalize=bootstrap.match(/function finalize\(\)\{([\s\S]*?)\n\}/);
assert.ok(finalize,'RuntimeBootstrap finalize missing');
assert.ok(!finalize[1].includes('GensRpgProgressionRuntimeV1'),'delayed retry finalize must not reinstall progression');
assert.match(bootstrap,/loadProgression\([^)]*\)[\s\S]*load\(0\)/,'progression prerequisite must complete before Tactical loading starts');

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
assert.equal(ctx.changeXP.__gensRpgProgressionRuntimeV1,true,'browser load must install the Dungeon XP owner immediately, without a retry timer');
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
console.log('GenSrpG V114.11 progression decoupling contract OK: XP installs before Tactical and +XP uses the canonical lifecycle immediately');
