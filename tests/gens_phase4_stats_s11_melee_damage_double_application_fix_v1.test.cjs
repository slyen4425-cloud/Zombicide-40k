const assert=require('node:assert/strict');
const path=require('node:path');

const root=path.join(__dirname,'..');
const Adapter=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'));
const V110=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));
const V11411=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

const values={force:10,agilite:10,intelligence:10,esprit:5,endurance:5,initiative:10,defense:0,armor:0,movement:3};
const items={
  sword:{id:'sword',name:'Sword',type:'Arme',range:0,dice:1,accuracy:'3+',strength:5,rpgScaling:{attribute:'force'}},
  bow:{id:'bow',name:'Bow',type:'Arme',range:5,dice:1,accuracy:'3+',strength:5,rpgScaling:{attribute:'agilite'}},
  staff:{id:'staff',name:'Staff',type:'Arme',range:4,dice:1,accuracy:'3+',strength:5,rpgScaling:{attribute:'intelligence',magic:true}}
};
const states={hero:{rightHand:0,leftHand:null,inventory:[{itemId:'sword'}],mana:0,wounds:0}};

function runtime(){
  return {
    current:'hero',
    state:states.hero,
    CHARS:{hero:{name:'Hero',dungeonStats:{...values}}},
    loadState:id=>states[id],
    getItemFromEntry:e=>items[e?.itemId],
    itemById:id=>items[id],
    effectiveAttackStats(it){
      const melee=Number(it.range||0)<=1;
      const magic=!!it.rpgScaling?.magic;
      const rpgDamageBonus=magic?4:3;
      return {
        dice:1,accuracy:3,strength:Number(it.strength)+rpgDamageBonus,
        range:it.range,melee,magic,rpgDamageBonus,mods:[]
      };
    },
    dungeonAttributeValue:id=>Number(values[id]||0),
    dungeonHitBonusForMode:()=>0,
    GensCleanRpgStats167874:{
      runtimeDefs:()=>Object.keys(values).map(id=>({id,name:id,icon:'',defaultValue:0})),
      value:(_hero,id)=>values[id]
    },
    effectiveMaxWounds:()=>10,
    dungeonHeroMoveValue083:()=>3,
    dungeonDerivedInitiative:()=>10,
    dungeonDerivedDefense:()=>0,
    dungeonArmorScore:()=>0,
    dungeonDodgeChance:()=>0,
    dungeonCriticalChance:()=>0,
    dungeonMagicResistance:()=>0,
    dungeonMaxMana:()=>0,
    dungeonPhysicalDamageBonus:()=>3,
    dungeonMagicDamageBonus:()=>4,
    loadDungeonRpgRules:()=>({critMultiplier:2,armorZeroBlockChance:75})
  };
}

const rt=runtime();

function buildAttack(itemId){
  states.hero.inventory=[{itemId}];
  states.hero.rightHand=0;
  return Adapter.heroAttacks(rt,'hero')[0];
}

const snap=V110.buildHeroSnapshot(rt,'hero',{hp:10,maxHp:10,movement:3,initiative:10,defense:0,armor:0,dodge:0});
assert.equal(snap.derived.physicalDamageBonus,3);
assert.equal(snap.derived.magicDamageBonus,4);

const sword=buildAttack('sword');
assert.equal(sword.power,8,'Adapter preview power must stay fully scaled');
assert.equal(sword.meta.rpgDamageBonus,3,'Adapter must transport the canonical damage bonus already embedded in power');

const melee=V11411.resolvePhysicalDamage(
  rt,{rngSeed:1},
  {id:'hero',meta:{rpgStats:snap}},
  {id:'enemy',armor:2},
  sword,
  {damageType:'physical',armor:2,rawDamage:8,damage:6},
  0
);
assert.deepEqual(
  {
    baseWeaponDamage:melee.baseWeaponDamage,
    statDamageBonus:melee.statDamageBonus,
    rawDamage:melee.rawDamage,
    armor:melee.armor,
    damage:melee.damage
  },
  {baseWeaponDamage:5,statDamageBonus:3,rawDamage:8,armor:2,damage:6},
  'melee canonical damage bonus must be applied exactly once'
);
const formula=V11411.damageCalculationFormula({hit:true,...melee,damagePerHit:melee.damage,hits:1});
assert.match(formula,/Puissance arme 5 \+ bonus stat 3 = 8 brut/);
assert.match(formula,/8 brut − armure 2 = 6 dégât\(s\) par touche/);

const bow=buildAttack('bow');
assert.equal(bow.power,8,'ranged preview power must stay unchanged');
assert.equal(bow.meta.rpgDamageBonus,3);
const ranged=V11411.resolvePhysicalDamage(
  rt,{rngSeed:1},
  {id:'hero',meta:{rpgStats:snap}},
  {id:'enemy',armor:2},
  bow,
  {damageType:'physical',armor:2,rawDamage:8,damage:6},
  0
);
assert.deepEqual(
  {baseWeaponDamage:ranged.baseWeaponDamage,statDamageBonus:ranged.statDamageBonus,rawDamage:ranged.rawDamage,damage:ranged.damage},
  {baseWeaponDamage:8,statDamageBonus:0,rawDamage:8,damage:6},
  'physical ranged semantics must remain unchanged'
);

const staff=buildAttack('staff');
assert.equal(staff.power,9,'magic preview power must stay unchanged');
assert.equal(staff.meta.rpgDamageBonus,4);
const magic=V11411.resolveDamagePerHit(
  rt,null,
  {id:'hero',meta:{rpgStats:snap}},
  {id:'enemy',armor:0},
  staff,
  {damageType:'magic',armor:0,rawDamage:9,damage:9}
);
assert.deepEqual(
  {baseWeaponDamage:magic.baseWeaponDamage,statDamageBonus:magic.statDamageBonus,rawDamage:magic.rawDamage,damage:magic.damage},
  {baseWeaponDamage:9,statDamageBonus:0,rawDamage:9,damage:9},
  'magic semantics must remain unchanged'
);

console.log(JSON.stringify({
  scenario:'S11 melee damage double-application fix contract',
  melee:{weapon:5,canonicalBonus:3,raw:8,armor:2,final:6},
  rangedUnchanged:true,
  magicUnchanged:true
},null,2));
