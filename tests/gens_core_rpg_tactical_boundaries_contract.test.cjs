const assert=require('node:assert/strict');
const path=require('node:path');

const root=path.join(__dirname,'..');
const Core=require(path.join(root,'assets','gensrpg','core','rpg-rules.js'));
const Visual=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

const stepRules=Core.normalizeRules({
  physicalDamageFormula:'step',
  physicalDamageStep:5,
  physicalDamageGain:2,
  armorZeroBlockChance:25,
  minPhysicalDamage:2,
});
const actor={
  id:'hero',side:'hero',
  meta:{rpgStats:{
    values:{force:19},
    derived:{physicalDamageBonus:Core.physicalDamageBonus(19,stepRules)},
    rules:stepRules,
  }},
};
const rt={GensRpgCoreRules:Core,loadDungeonRpgRules:()=>stepRules};
const melee={power:2,damageType:'physical',tags:['melee'],ignoreArmor:false};
const armored={armor:8};

const blocked=Visual.resolvePhysicalDamage(rt,null,actor,armored,melee,{damageType:'physical',armor:8,rawDamage:2,damage:0},24);
assert.equal(blocked.statDamageBonus,6,'19 Force with 5/+2 rule must add +6 to melee');
assert.equal(blocked.rawDamage,8);
assert.equal(blocked.armor,8);
assert.equal(blocked.armorZeroBlockChance,25);
assert.equal(blocked.minPhysicalDamageOnArmorFail,2);
assert.equal(blocked.armorRoll,24);
assert.equal(blocked.armorBlocked,true);
assert.equal(blocked.damage,0,'roll 24 must block completely with a 25% block threshold');

const wounded=Visual.resolvePhysicalDamage(rt,null,actor,armored,melee,{damageType:'physical',armor:8,rawDamage:2,damage:0},25);
assert.equal(wounded.armorRoll,25);
assert.equal(wounded.armorBlocked,false);
assert.equal(wounded.damage,2,'roll 25 must let the configured minimum 2 damage through');

// Force-derived physical damage is currently a melee rule; ranged physical must not inherit it.
const ranged={power:10,damageType:'physical',tags:['ranged'],range:5,maxRange:5,ignoreArmor:false};
const rangedStep=Visual.resolvePhysicalDamage(rt,null,actor,{armor:0},ranged,{damageType:'physical',armor:0,rawDamage:10,damage:10},0);
assert.equal(rangedStep.statDamageBonus,0,'ranged physical must not receive melee Force step bonus');
assert.equal(rangedStep.statDamagePercent,0);
assert.equal(rangedStep.rawDamage,10);
assert.equal(rangedStep.damage,10);

const percentRules=Core.normalizeRules({
  physicalDamageFormula:'percent',
  physicalDamagePercentPerPoint:2,
  armorZeroBlockChance:25,
  minPhysicalDamage:2,
});
const percentActor={
  id:'hero',side:'hero',
  meta:{rpgStats:{
    values:{force:19},
    derived:{physicalDamagePercent:Core.physicalDamagePercent(19,percentRules)},
    rules:percentRules,
  }},
};
const percentRt={GensRpgCoreRules:Core,loadDungeonRpgRules:()=>percentRules};
const rangedPercent=Visual.resolvePhysicalDamage(percentRt,null,percentActor,{armor:0},ranged,{damageType:'physical',armor:0,rawDamage:10,damage:10},0);
assert.equal(rangedPercent.statDamagePercent,0,'ranged physical must not receive melee Force percent scaling');
assert.equal(rangedPercent.statDamageBonus,0);
assert.equal(rangedPercent.rawDamage,10);
assert.equal(rangedPercent.damage,10);

console.log('GenSrpG Tactical RPG armor/ranged boundaries contract OK');
