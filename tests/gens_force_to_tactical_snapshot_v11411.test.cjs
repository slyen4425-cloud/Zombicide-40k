const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.join(__dirname,'..');
const cleanSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const tacticalStatsSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'),'utf8');

let profiles=[{
  id:'dungeon',name:'Dungeon',gameStyle:'dungeon',
  rpgUniverse:{stats:{
    dynamicDefinitions:[],
    active:['force'],
    dynamicEffects90:[
      {id:'force_phys',source:'force',target:'damage:physical',mode:'step',step:10,gain:1,enabled:true}
    ],
    legacyEffectsMigrated94:true,
    nativeCoreMigrated95:true
  }}
}];

const heroState={rpgAttributes:{force:20},wounds:0,mana:0};
const ctx={
  console,Math,Date,JSON,
  setTimeout:()=>0,clearTimeout:()=>{},
  current:'hero',state:heroState,
  CHARS:{hero:{dungeonStats:{force:10}}},
  currentRpgProfile:()=>profiles[0],
  getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,
  saveGameProfiles:a=>{profiles=JSON.parse(JSON.stringify(a))},
  activeGameProfileId:()=>profiles[0].id,
  getActiveGameProfileId:()=>profiles[0].id,
  isDungeonMode:()=>true,
  loadState:()=>heroState,
  save:()=>true,
  saveState:()=>true,
  dungeonEquipmentBonus:()=>0,
  dungeonSkillEffectTotal:()=>0,
  dungeonChallengeDebuffTotal067:()=>0,
  dungeonPhysicalDamageBonus:()=>0,
  dungeonMagicDamageBonus:()=>0,
  dungeonCriticalChance:()=>0,
  dungeonDodgeChance:()=>0,
  dungeonMagicResistance:()=>0,
  dungeonDerivedDefense:()=>0,
  dungeonArmorScore:()=>0,
  dungeonDerivedInitiative:()=>0,
  dungeonHeroMoveValue083:()=>3,
  effectiveMaxWounds:()=>10,
  loadDungeonRpgRules:()=>({
    physicalDamageStep:10,physicalDamageGain:0,
    magicDamageStep:10,magicDamageGain:0,
    meleeHitStep:10,meleeHitGain:0,
    rangedHitStep:10,rangedHitGain:0,
    magicHitStep:10,magicHitGain:0,
    critCap:100,critMultiplier:2
  }),
  saveDungeonRpgRules:()=>{},
  renderDungeonAttributes:()=>{},
  renderRpgUniverseEditor:()=>{},
  saveRpgUniverseStats:()=>{},
  showToast:()=>{}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);

vm.runInContext(cleanSrc,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
const clean=ctx.GensCleanRpgStats167874;
assert.ok(clean,'canonical stats API missing');
clean.installRuntime();

assert.equal(clean.value('hero','force'),20,'canonical Force must come from the hero runtime value');
assert.equal(clean.extraTotal('damage:physical','hero'),2,'Force 20 with +1 physical damage per 10 Force must produce +2');
assert.equal(ctx.dungeonPhysicalDamageBonus(),2,'legacy-compatible Dungeon bridge must expose the canonical damage effect');

vm.runInContext(tacticalStatsSrc,ctx,{filename:'gens-rpg-tactical-combat-v2-stats-1678110.js'});
const tactical=ctx.GensRpgTacticalStats1678110;
assert.ok(tactical,'Tactical stats bridge missing');

const actor={id:'hero',side:'hero',hp:10,maxHp:10,movement:3,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'hero'}};
const snap=tactical.buildHeroSnapshot(ctx,'hero',actor);
assert.ok(snap,'Tactical snapshot missing');
assert.equal(snap.values.force,20,'Tactical snapshot must contain canonical Force 20');
assert.equal(snap.derived.physicalDamageBonus,2,'canonical Force effect must reach the Tactical snapshot through the real runtime bridge');

heroState.rpgAttributes.force=30;
const snap30=tactical.buildHeroSnapshot(ctx,'hero',actor);
assert.equal(snap30.values.force,30,'updated canonical Force must be read on a rebuilt snapshot');
assert.equal(snap30.derived.physicalDamageBonus,3,'Force 30 must produce +3 physical damage in the rebuilt Tactical snapshot');

console.log('GenSrpG V114.11 canonical Force -> effects -> Dungeon bridge -> Tactical snapshot OK');
