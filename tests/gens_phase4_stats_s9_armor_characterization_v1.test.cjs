const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const core317Src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-core-317.js'),'utf8');
const tactical110=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));
const tactical11411=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

function sliceFunction(src,startMarker,nextMarker){
  const start=src.indexOf(startMarker);
  assert.notEqual(start,-1,'missing source owner: '+startMarker);
  const end=src.indexOf(nextMarker,start+startMarker.length);
  assert.notEqual(end,-1,'missing next owner marker: '+nextMarker);
  return src.slice(start,end);
}

const reductionSrc=sliceFunction(
  index,
  'function dungeonArmorReductionFromScore(score){',
  'function dungeonArmorReduction(){'
);
const dungeonCtx={Math,Number,loadDungeonRpgRules:()=>({armorReductionStep:2,armorReductionGain:1})};
vm.createContext(dungeonCtx);
vm.runInContext(reductionSrc,dungeonCtx,{filename:'index.html#dungeonArmorReductionFromScore'});

const defaultMatrix=[
  [0,0],[1,0],[2,1],[3,1],[4,2],[5,2],[6,3]
];
for(const [score,expected] of defaultMatrix){
  assert.equal(dungeonCtx.dungeonArmorReductionFromScore(score),expected,'Dungeon default armor reduction score '+score);
}

dungeonCtx.loadDungeonRpgRules=()=>({armorReductionStep:3,armorReductionGain:2});
const customMatrix=[[0,0],[1,0],[2,0],[3,2],[4,2],[6,4]];
for(const [score,expected] of customMatrix){
  assert.equal(dungeonCtx.dungeonArmorReductionFromScore(score),expected,'Dungeon custom armor reduction score '+score);
}

const coreCtx={console,Math,Number,JSON};
coreCtx.window=coreCtx;
coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(core317Src,coreCtx,{filename:'dungeon-core-317.js'});
assert.ok(coreCtx.DungeonCore317,'DungeonCore317 owner missing');
assert.equal(coreCtx.DungeonCore317.resolveArmorFloor(3,3,1,'physical',{armorZeroBlockChance:75},74),0,'physical zero floor blocks below 75');
assert.equal(coreCtx.DungeonCore317.resolveArmorFloor(3,3,1,'physical',{armorZeroBlockChance:75},75),1,'physical zero floor lets one damage through at 75');
assert.equal(coreCtx.DungeonCore317.resolveArmorFloor(3,2,3,'physical',{armorZeroBlockChance:75},0),3,'configured Dungeon min remains distinct from score/reduction');

const rt110={
  CHARS:{hero:{dungeonStats:{}}},
  loadState:()=>({}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[]},
  effectiveMaxWounds:()=>10,
  dungeonHeroMoveValue083:()=>3,
  dungeonDerivedInitiative:()=>0,
  dungeonDerivedDefense:()=>0,
  dungeonArmorScore:()=>7,
  dungeonDodgeChance:()=>0,
  dungeonCriticalChance:()=>0,
  dungeonMagicResistance:()=>0,
  dungeonMaxMana:()=>0,
  dungeonPhysicalDamageBonus:()=>0,
  dungeonMagicDamageBonus:()=>0,
  loadDungeonRpgRules:()=>({critMultiplier:2})
};
const snap=tactical110.buildHeroSnapshot(rt110,'hero',{hp:10,maxHp:10,armor:0,movement:3,initiative:0,defense:0,dodge:0});
assert.equal(snap.derived.armor,7,'V110 must transport dungeonArmorScore, not Dungeon armorReduction');
const actor={armor:0,meta:{}};
tactical110.applyHeroSnapshot(actor,snap);
assert.equal(actor.armor,7,'V110 actor armor must receive the transported armorScore');

const attacker={meta:{rpgStats:{derived:{physicalDamageBonus:0,magicDamageBonus:0}}}};
const attack={power:10,damageType:'physical',tags:['melee'],ignoreArmor:false};
const target={armor:4};
const preview={damageType:'physical',armor:4,rawDamage:10,damage:6};
const rt11411={DungeonCore317:coreCtx.DungeonCore317,loadDungeonRpgRules:()=>({armorZeroBlockChance:75,armorReductionStep:99,armorReductionGain:99,minPhysicalDamage:9})};
const direct=tactical11411.resolvePhysicalDamage(rt11411,{rngSeed:1},attacker,target,attack,preview,0);
assert.equal(direct.rawDamage,10);
assert.equal(direct.armor,4);
assert.equal(direct.damage,6,'Tactical V114.11 must subtract armorScore directly 1:1');

const fullArmorAttack={...attack,power:4};
const fullArmorPreview={damageType:'physical',armor:4,rawDamage:4,damage:0};
const blocked=tactical11411.resolvePhysicalDamage(rt11411,{rngSeed:1},attacker,target,fullArmorAttack,fullArmorPreview,74);
const floor=tactical11411.resolvePhysicalDamage(rt11411,{rngSeed:1},attacker,target,fullArmorAttack,fullArmorPreview,75);
assert.equal(blocked.damage,0,'Tactical 75% armor-zero block must remain current behavior');
assert.equal(floor.damage,1,'Tactical failed armor-zero block must remain one damage');
assert.equal(floor.armorZeroBlockChance,75);

assert.match(
  fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8'),
  /resolveArmorFloor\(rawDamage,armor,1,"physical",rules,armorRoll\)/,
  'Tactical V114.11 must keep hard-coded configuredMin=1 visible during S9 characterization'
);

assert.notEqual(
  dungeonCtx.dungeonArmorReductionFromScore(4),
  tactical11411.resolvePhysicalDamage(rt11411,{rngSeed:1},attacker,{armor:4},attack,{damageType:'physical',armor:4,rawDamage:10,damage:6},0).armor,
  'S9 must keep Dungeon reduction and Tactical armorScore semantics visibly distinct'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S9 armor semantics characterization',
  dungeonDefault:defaultMatrix,
  dungeonCustom:customMatrix,
  tacticalArmorIsDirectScore:true,
  tacticalUsesDungeonReductionStepGain:false,
  armorZeroBlockChance:75,
  tacticalConfiguredMin:1,
  gameplayChanged:false
},null,2));
