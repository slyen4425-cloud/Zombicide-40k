const assert=require('node:assert/strict');
const path=require('node:path');
const Core=require(path.join(__dirname,'..','assets','gensrpg','core','rpg-rules.js'));

assert.equal(Core.VERSION,'1.2.0');
assert.equal(Core.DEFAULTS.armorZeroBlockChance,50,'new target rule is 50/50 when armor cancels damage');
assert.equal(Core.DEFAULTS.spiritMagicResistStep,20,'legacy default: every 20 Spirit grants magic resistance');
assert.equal(Core.DEFAULTS.magicResistGain,1,'legacy default: +1 magic resistance per Spirit step');

assert.equal(Core.physicalDamageBonus(0),0);
assert.equal(Core.physicalDamageBonus(9),0);
assert.equal(Core.physicalDamageBonus(10),1);
assert.equal(Core.physicalDamageBonus(16),1,'16 Force must provide +1 melee physical damage');
assert.equal(Core.physicalDamageBonus(20),2);
assert.equal(
  Core.physicalDamageBonus(16,{physicalDamageStep:5,physicalDamageGain:2}),
  6,
  'custom Force damage rules must override defaults'
);

assert.equal(Core.magicDamageBonus(0),0);
assert.equal(Core.magicDamageBonus(9),0);
assert.equal(Core.magicDamageBonus(10),1);
assert.equal(Core.magicDamageBonus(20),2);
assert.equal(
  Core.magicDamageBonus(25,{magicDamageStep:8,magicDamageGain:3}),
  9,
  'custom Intelligence damage rules must override defaults'
);

assert.equal(Core.magicResistanceBonus(0),0);
assert.equal(Core.magicResistanceBonus(19),0);
assert.equal(Core.magicResistanceBonus(20),1,'20 Spirit must provide +1 magic resistance');
assert.equal(Core.magicResistanceBonus(39),1);
assert.equal(Core.magicResistanceBonus(40),2);
assert.equal(
  Core.magicResistanceBonus(40,{spiritMagicResistStep:10,magicResistGain:2}),
  8,
  'magic resistance must follow configurable RPG rules'
);

const base=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:1,armorRoll:0});
assert.equal(base.baseWeaponDamage,2);
assert.equal(base.statDamageBonus,1);
assert.equal(base.rawDamage,3);
assert.equal(base.armor,1);
assert.equal(base.reducedDamage,2);
assert.equal(base.finalDamage,2);
assert.equal(base.armorFloorTriggered,false);
assert.equal(base.physicalDamageStep,10);
assert.equal(base.physicalDamageGain,1);
assert.equal(base.minPhysicalDamageOnArmorFail,1);

const blocked=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:3,armorRoll:49});
assert.equal(blocked.rawDamage,3);
assert.equal(blocked.reducedDamage,0);
assert.equal(blocked.armorFloorTriggered,true);
assert.equal(blocked.armorBlocked,true);
assert.equal(blocked.finalDamage,0,'roll 49 blocks at 50%');

const wounded=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:3,armorRoll:50});
assert.equal(wounded.armorBlocked,false);
assert.equal(wounded.finalDamage,1,'roll 50 lets the configured minimum damage through at 50/50');

let zero=0,one=0;
for(let roll=0;roll<100;roll++){
  const out=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:3,armorRoll:roll});
  if(out.finalDamage===0)zero++;
  if(out.finalDamage===1)one++;
}
assert.equal(zero,50);
assert.equal(one,50);

const customArmorRules={
  physicalDamageStep:5,
  physicalDamageGain:2,
  armorZeroBlockChance:25,
  minPhysicalDamageOnArmorFail:2,
};
const customBlocked=Core.resolvePhysicalDamage({
  weaponDamage:1,
  force:10,
  armor:5,
  armorRoll:24,
  rules:customArmorRules,
});
assert.equal(customBlocked.statDamageBonus,4);
assert.equal(customBlocked.rawDamage,5);
assert.equal(customBlocked.armorBlocked,true);
assert.equal(customBlocked.finalDamage,0,'custom 25% block threshold must be respected');

const customWounded=Core.resolvePhysicalDamage({
  weaponDamage:1,
  force:10,
  armor:5,
  armorRoll:25,
  rules:customArmorRules,
});
assert.equal(customWounded.armorBlocked,false);
assert.equal(customWounded.finalDamage,2,'custom minimum physical damage must override default 1');
assert.equal(customWounded.physicalDamageStep,5);
assert.equal(customWounded.physicalDamageGain,2);
assert.equal(customWounded.armorZeroBlockChance,25);
assert.equal(customWounded.minPhysicalDamageOnArmorFail,2);

let customZero=0,customTwo=0;
for(let roll=0;roll<100;roll++){
  const out=Core.resolvePhysicalDamage({
    weaponDamage:1,
    force:10,
    armor:5,
    armorRoll:roll,
    rules:customArmorRules,
  });
  if(out.finalDamage===0)customZero++;
  if(out.finalDamage===2)customTwo++;
}
assert.equal(customZero,25,'custom 25% armor block chance must produce exactly 25 blocked rolls over 0..99');
assert.equal(customTwo,75,'remaining rolls must use configured minimum damage 2');

const lines=Core.describePhysicalDamage(wounded);
assert.ok(lines.some(x=>x.includes('Arme : 2')));
assert.ok(lines.some(x=>x.includes('Force 16 (règle 10/+1) : +1')));
assert.ok(lines.some(x=>x.includes('Dégâts bruts : 3')));
assert.ok(lines.some(x=>x.includes('Armure : -3')));
assert.ok(lines.some(x=>x.includes('50% blocage / 50% minimum 1 dégât')));
assert.ok(lines.some(x=>x.includes('Résultat final : 1 dégât')));

const customLines=Core.describePhysicalDamage(customWounded);
assert.ok(customLines.some(x=>x.includes('Force 10 (règle 5/+2) : +4')),'explanation must show the active custom Force rule');
assert.ok(customLines.some(x=>x.includes('25% blocage / 75% minimum 2 dégâts')),'explanation must show custom armor threshold and minimum damage');
assert.ok(customLines.some(x=>x.includes('Jet : 25 → 2 dégâts')),'explanation must show the configured minimum damage outcome');
assert.ok(customLines.some(x=>x.includes('Résultat final : 2 dégâts')));

console.log('GenSrpG Core RPG rules contract OK');
