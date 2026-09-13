const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','assets','gensrpg');
const E=require(path.join(root,'gens-rpg-tactical-combat-v2.js'));
global.GensRpgTacticalCombatV2=E;
require(path.join(root,'gens-rpg-tactical-combat-v2-rules.js'));

// Ranged target standing in cover must receive a real hit penalty.
{
  const s=E.createBattle({rngSeed:1,grid:{width:8,height:5,cover:[{x:6,y:2}]},actors:[
    {id:'h',side:'hero',x:1,y:2,hp:10,initiative:20,attacks:[{id:'bow',minRange:2,maxRange:7,hit:90,power:4}]},
    {id:'e',side:'enemy',x:6,y:2,hp:10,initiative:1,attacks:[{id:'claw',range:1,hit:70,power:2}]}
  ]});
  const p=E.attackPreview(s,'h','e','bow');
  assert.equal(p.ok,true);assert.equal(p.cellCover,20);assert.equal(p.hitChance,60);
  const r=E.resolveAttack(s,'h','e','bow',65);assert.equal(r.hit,false,'cover must affect actual resolution, not only preview');
}

// Default bridge must intercept legacy combat entry without needing a feature flag.
{
  const B=require(path.join(root,'gens-rpg-tactical-combat-v2-bridge.js'));
  let legacy=0,opened=0,lastOpts=null;
  const rt={
    isDungeonMode:()=>true,
    GensRpgTacticalCombatV2:E,
    GensRpgTacticalCombatV2Adapter:{participants:()=>['h1'],activeEnemies:()=>[{id:'e1'},{id:'e2'}]},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>null,openCurrentEncounter:o=>{opened++;lastOpts=o;return {id:'v2',winner:null}}},
    dc200StartCombat:()=>{legacy++},openDungeonCombatSetup:()=>{legacy++},dispatchEvent:()=>{}
  };
  assert.equal(B.install(rt),true);
  const out=rt.dc200StartCombat(['e2'],'detection');
  assert.equal(out.ok,true);assert.equal(opened,1);assert.equal(legacy,0);assert.deepEqual(lastOpts.enemyIds,['e2']);assert.equal(lastOpts.reason,'detection');
}

// The already-loaded stable tail must bootstrap every V2 module in order.
{
  const src=fs.readFileSync(path.join(root,'gens-mobile-combat-performance-16781022.js'),'utf8');
  const names=['gens-rpg-tactical-combat-v2.js','gens-rpg-tactical-combat-v2-adapter.js','gens-rpg-tactical-combat-v2-rules.js','gens-rpg-tactical-combat-v2-integration.js','gens-rpg-tactical-combat-v2-ui.js','gens-rpg-tactical-combat-v2-bridge.js'];
  let pos=-1;for(const n of names){const next=src.indexOf(n);assert.ok(next>pos,`loader order missing ${n}`);pos=next}
  assert.ok(src.includes('GensRpgTacticalCombatV2Bridge?.install?.(R)'));
}

console.log('GenSrpG Tactical Combat V2 default bridge/cover/loader OK');
