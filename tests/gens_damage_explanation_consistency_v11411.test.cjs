const assert=require('node:assert/strict');
const path=require('node:path');
const api=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

// Exact manual Firefox case: the resolved result is correct (2 x 2 = 4),
// but an older rawDamage field can still carry the weapon-only value 3.
const result={
  hit:true,
  baseWeaponDamage:3,
  statDamageBonus:1,
  rawDamage:3,
  armor:2,
  damagePerHit:2,
  hits:2,
  damage:4,
  damageType:'physical'
};
const formula=api.damageCalculationFormula(result);
assert.match(formula,/Puissance arme 3 \+ bonus stat 1 = 4 brut/,
  'visible raw damage must be recomputed from weapon + canonical stat bonus');
assert.match(formula,/4 brut − armure 2 = 2 dégât\(s\) par touche/,
  'visible armor subtraction must start from the displayed raw total');
assert.match(formula,/2 touche\(s\) = 4 dégâts infligés/,
  'visible total must stay aligned with the already-correct resolved damage');
console.log('V114.11 damage explanation consistency: OK');
