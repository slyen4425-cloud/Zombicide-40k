const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const stats=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');

assert.match(
  stats,
  /wrap\("dungeonPhysicalDamageBonus",old=>function\(\)\{return num\(old\.apply\(this,arguments\),0\)\+extraTotal\("damage:physical"\)\+extraTotal\("damage:melee"\)\}\)/,
  'physical derived overlay must remain additive only'
);
assert.match(
  stats,
  /wrap\("dungeonMagicDamageBonus",old=>function\(\)\{return num\(old\.apply\(this,arguments\),0\)\+extraTotal\("damage:magic"\)\}\)/,
  'magic derived overlay must remain additive only'
);
assert.match(
  stats,
  /wrap\("dungeonEnduranceHpBonus",old=>function\(\)\{return num\(old\.apply\(this,arguments\),0\)\+extraTotal\("max_hp"\)\}\)/,
  'HP derived overlay must remain additive only'
);
assert.match(
  stats,
  /wrap\("dungeonMaxMana",old=>function\(\)\{return Math\.max\(0,num\(old\.apply\(this,arguments\),0\)\+extraTotal\("max_mana"\)\)\}\)/,
  'mana overlay must keep zero floor'
);
assert.match(
  stats,
  /wrap\("dungeonCriticalChance",old=>function\(\)\{const r=R\.loadDungeonRpgRules\?\.\(\)\|\|\{\};return clamp\(num\(old\.apply\(this,arguments\),0\)\+extraTotal\("crit"\),0,num\(r\.critCap,100\)\)\}\)/,
  'crit overlay must keep configured cap'
);
assert.match(
  stats,
  /wrap\("dungeonDodgeChance",old=>function\(\)\{const r=R\.loadDungeonRpgRules\?\.\(\)\|\|\{\};return clamp\(num\(old\.apply\(this,arguments\),0\)\+extraTotal\("dodge"\),0,num\(r\.dodgeCap,100\)\)\}\)/,
  'dodge overlay must keep configured cap'
);
assert.match(
  stats,
  /wrap\("dungeonMagicResistance",old=>function\(\)\{return Math\.max\(0,num\(old\.apply\(this,arguments\),0\)\+extraTotal\("magic_resistance"\)\)\}\)/,
  'magic resistance overlay must keep zero floor'
);
assert.match(
  stats,
  /wrap\("dungeonDerivedInitiative",old=>function\(\)\{return num\(old\.apply\(this,arguments\),0\)\+extraTotal\("initiative"\)\}\)/,
  'initiative overlay must remain additive only'
);

assert.match(stats,/wrap\("dungeonDerivedDefense"/,'defense seam must remain outside S6 audit');
assert.match(stats,/wrap\("dungeonArmorScore"/,'armor seam must remain outside S6 audit');
assert.match(stats,/wrap\("dungeonHeroMoveValue083"/,'movement seam must remain outside S6 audit');

assert.match(
  stats,
  /wrap\("applyDungeonCombatScaling"/,
  'hit/ranged attack mutation must remain an explicit combat adapter boundary'
);
assert.match(stats,/extraTotal\("hit:"\+mode\)/,'hit effect total remains available but is not S6 final hit resolution');
assert.match(stats,/extraTotal\("damage:ranged"\)/,'ranged effect total remains available but is not moved by the pure S6 audit');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S6 derived-value audit',
  additiveDerived:['physical','magic','hp','initiative'],
  floorDerived:['mana','magic_resistance'],
  cappedDerived:['crit','dodge'],
  excluded:['defense-application','armor-application','movement','attack-scaling','D100','elemental-resistance'],
  exactInlineSourceRequired:true
},null,2));
