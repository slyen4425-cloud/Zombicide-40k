const assert=require('node:assert/strict');
const path=require('node:path');
const Core=require(path.join(__dirname,'..','assets','gensrpg','core','rpg-rules.js'));

assert.equal(Core.VERSION,'1.0.0');
assert.equal(Core.DEFAULTS.armorZeroBlockChance,50,'new target rule is 50/50 when armor cancels damage');

assert.equal(Core.physicalDamageBonus(0),0);
assert.equal(Core.physicalDamageBonus(9),0);
assert.equal(Core.physicalDamageBonus(10),1);
assert.equal(Core.physicalDamageBonus(16),1,'16 Force must provide +1 melee physical damage');
assert.equal(Core.physicalDamageBonus(20),2);

const base=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:1,armorRoll:0});
assert.equal(base.baseWeaponDamage,2);
assert.equal(base.statDamageBonus,1);
assert.equal(base.rawDamage,3);
assert.equal(base.armor,1);
assert.equal(base.reducedDamage,2);
assert.equal(base.finalDamage,2);
assert.equal(base.armorFloorTriggered,false);

const blocked=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:3,armorRoll:49});
assert.equal(blocked.rawDamage,3);
assert.equal(blocked.reducedDamage,0);
assert.equal(blocked.armorFloorTriggered,true);
assert.equal(blocked.armorBlocked,true);
assert.equal(blocked.finalDamage,0,'roll 49 blocks at 50%');

const wounded=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:3,armorRoll:50});
assert.equal(wounded.armorBlocked,false);
assert.equal(wounded.finalDamage,1,'roll 50 lets the minimum 1 damage through at 50/50');

let zero=0,one=0;
for(let roll=0;roll<100;roll++){
  const out=Core.resolvePhysicalDamage({weaponDamage:2,force:16,armor:3,armorRoll:roll});
  if(out.finalDamage===0)zero++;
  if(out.finalDamage===1)one++;
}
assert.equal(zero,50);
assert.equal(one,50);

const lines=Core.describePhysicalDamage(wounded);
assert.ok(lines.some(x=>x.includes('Arme : 2')));
assert.ok(lines.some(x=>x.includes('Force 16 : +1')));
assert.ok(lines.some(x=>x.includes('Dégâts bruts : 3')));
assert.ok(lines.some(x=>x.includes('Armure : -3')));
assert.ok(lines.some(x=>x.includes('50% blocage / 50% minimum 1 dégât')));
assert.ok(lines.some(x=>x.includes('Résultat final : 1 dégât')));

console.log('GenSrpG Core RPG rules contract OK');
