const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const Core=require(path.join(root,'assets','gensrpg','core','rpg-rules.js'));
const Stats=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));
const Visual=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));
const statsSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');

const state={
  rpgAttributes:{force:17,agilite:13,intelligence:16,esprit:12,endurance:15,initiative:8,defense:12,armor:2,movement:4},
  mana:6,
};
const profile={
  id:'dungeon_profile',
  gameStyle:'dungeon',
  rpgUniverse:{
    stats:{active:['force','agilite','intelligence','esprit','endurance','initiative','defense','armor','movement'],dynamicDefinitions:[],dynamicEffects90:[],legacyEffectsMigrated94:true,nativeCoreMigrated95:true},
    movement:{defaults:{hero:3}},
  },
};
const customRules={
  physicalDamageFormula:'step',physicalDamageStep:5,physicalDamageGain:2,
  magicDamageFormula:'step',magicDamageStep:8,magicDamageGain:3,
  magicResistFormula:'perPoint',magicResistPerPoint:0.5,
  armorZeroBlockChance:25,minPhysicalDamage:2,critMultiplier:2,
};

function legacyArmorCore(){
  return {
    isPhysicalDamageType:type=>String(type||'physical').toLowerCase()==='physical',
    resolveArmorFloor(incoming,reduction,configuredMin,damageType,rules,roll){
      const reduced=Math.max(0,Number(incoming)||0)-Math.max(0,Number(reduction)||0);
      if(String(damageType)==='physical'&&reduced<=0){
        const chance=Math.max(0,Math.min(100,Number(rules?.armorZeroBlockChance??75)));
        const min=Math.max(0,Number(rules?.minPhysicalDamage??configuredMin??1));
        return Number(roll)<chance?0:min;
      }
      return Math.max(0,reduced);
    },
  };
}

const ctx={
  console,
  current:'hero',state,
  GensRpgCoreRules:Core,
  DungeonCore317:legacyArmorCore(),
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profile,
  getActiveGameProfile:()=>profile,
  loadGameProfiles:()=>[profile],saveGameProfiles:()=>true,
  loadState:id=>id==='hero'?state:{},
  CHARS:{hero:{id:'hero',name:'Hero',dungeonStats:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:0,defense:10,armor:0,movement:3}}},
  dungeonAttributeValue:()=>0,
  changeDungeonAttribute:()=>true,
  dungeonEquipmentBonus:id=>id==='force'?2:id==='defense'?3:id==='magicDefense'?2:0,
  dungeonSkillEffectTotal:(kind,_unused,id)=>kind==='attribute'&&id==='force'?1:kind==='defense'?2:kind==='magicDefense'?1:0,
  dungeonChallengeDebuffTotal067:id=>id==='force'?-1:0,
  dungeonDodgeChance:()=>9,dungeonCriticalChance:()=>7,
  // Deliberately wrong legacy seams: once Core owns the rule path, these must be ignored.
  dungeonMagicResistance:()=>77,
  dungeonPhysicalDamageBonus:()=>99,
  dungeonMagicDamageBonus:()=>88,
  dungeonMaxMana:()=>12,
  dungeonHeroMoveValue083:()=>4,dungeonDerivedInitiative:()=>8,dungeonDerivedDefense:()=>17,dungeonArmorScore:()=>2,
  effectiveMaxWounds:()=>25,
  loadDungeonRpgRules:()=>customRules,
  setTimeout:fn=>{fn();return 1},clearTimeout:()=>{},
};

vm.createContext(ctx);
vm.runInContext(statsSource,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
assert.ok(ctx.GensCleanRpgStats167874,'canonical stats API must install');
ctx.GensCleanRpgStats167874.installRuntime();

const actor={id:'hero',side:'hero',hp:24,maxHp:25,movement:0,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'hero'}};
const snap=Stats.buildHeroSnapshot(ctx,'hero',actor);

assert.equal(snap.values.force,19,'real canonical Force must include equipment/talent/debuff path');
assert.equal(snap.values.intelligence,16);
assert.equal(snap.values.esprit,12);
assert.equal(snap.derived.physicalDamageBonus,6,'Force 19 with custom 5/+2 rule must produce +6, not legacy helper output');
assert.equal(snap.derived.magicDamageBonus,6,'Intelligence 16 with custom 8/+3 rule must produce +6');
assert.equal(snap.derived.magicResistance,9,'Spirit 12 × 0.5 + equipment 2 + talent 1 must produce 9 magic resistance');
assert.equal(snap.rules.physicalDamageStep,5);
assert.equal(snap.rules.physicalDamageGain,2);
assert.equal(snap.rules.magicDamageStep,8);
assert.equal(snap.rules.magicDamageGain,3);
assert.equal(snap.rules.magicResistFormula,'perPoint');
assert.equal(snap.rules.magicResistPerPoint,0.5);
assert.equal(snap.rules.armorZeroBlockChance,25);
assert.equal(snap.rules.minPhysicalDamageOnArmorFail,2);

Stats.applyHeroSnapshot(actor,snap);
const sword={power:2,damageType:'physical',tags:['melee'],ignoreArmor:false};
const skeleton={armor:5};
const physicalPreview={damageType:'physical',armor:5,damage:0,rawDamage:2};
const physical=Visual.resolvePhysicalDamage(ctx,null,actor,skeleton,sword,physicalPreview,0);
assert.equal(physical.statDamageBonus,6,'Tactical attack must consume the canonical snapshot bonus');
assert.equal(physical.rawDamage,8,'2 weapon + 6 Force-derived damage must reach the damage resolver');
assert.equal(physical.damage,3,'8 raw - 5 armor must deal 3');

const magicPreview={ok:true,attack:{power:12,damageType:'magic'},damage:12};
const magic=Stats.adjustedDamage(magicPreview,actor);
assert.equal(magic.resistance,9,'Tactical magic damage must consume canonical Spirit/equipment/talent resistance');
assert.equal(magic.damage,3,'12 magic - 9 resistance must deal 3');

assert.equal(ctx.current,'hero','snapshot builder must restore active hero context');
assert.equal(ctx.state,state,'snapshot builder must restore active hero state');
console.log('GenSrpG canonical stats -> Core rules -> Tactical snapshot -> damage/resistance contract OK');
