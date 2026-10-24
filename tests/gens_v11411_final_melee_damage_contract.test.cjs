const assert=require('node:assert/strict');
const path=require('node:path');
const mod=require(path.join('..','assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(mod.APP_VERSION,'16.78.114.11','test must target the safe V114.11 final combat resolver');

const melee={id:'sword',power:5,damageType:'physical',tags:['melee'],actionCost:1,hit:95};
const ranged={id:'bow',power:5,damageType:'physical',tags:['ranged'],maxRange:5,actionCost:1,hit:95};
const attacker={
  id:'aldren',side:'hero',alive:true,actionsLeft:1,attacks:[melee],
  meta:{rpgStats:{derived:{physicalDamageBonus:3,magicDamageBonus:0}}}
};
const target={id:'skeleton',side:'enemy',alive:true,hp:20,maxHp:20,armor:2,defense:0,dodge:0};
const rt={loadDungeonRpgRules:()=>({armorZeroBlockChance:75})};

const direct=mod.resolvePhysicalDamage(rt,{rngSeed:123},attacker,target,melee,{damageType:'physical',armor:2},0);
assert.deepEqual(
  {baseWeaponDamage:direct.baseWeaponDamage,statDamageBonus:direct.statDamageBonus,rawDamage:direct.rawDamage,armor:direct.armor,damage:direct.damage},
  {baseWeaponDamage:5,statDamageBonus:3,rawDamage:8,armor:2,damage:6},
  'melee physical damage must be weapon + canonical physical stat bonus - armor'
);

const rangedDirect=mod.resolvePhysicalDamage(rt,{rngSeed:123},attacker,target,ranged,{damageType:'physical',armor:2},0);
assert.deepEqual(
  {baseWeaponDamage:rangedDirect.baseWeaponDamage,statDamageBonus:rangedDirect.statDamageBonus,rawDamage:rangedDirect.rawDamage,armor:rangedDirect.armor,damage:rangedDirect.damage},
  {baseWeaponDamage:5,statDamageBonus:0,rawDamage:5,armor:2,damage:3},
  'physical melee bonus must not leak into ranged attacks'
);

const engine={
  attackPreview(){return {ok:true,attack:melee,hitChance:95,damageType:'physical',armor:2,damage:3,rawDamage:5,cellCover:0,los:{cover:0},critChance:0,critMultiplier:2,distance:1}},
  currentActor(){return attacker},
  actorById(state,id){return id===target.id?target:attacker},
  refreshOutcome(){},
  resolveAttack(){throw new Error('legacy resolver should be replaced')}
};
rt.GensRpgTacticalCombatV2=engine;
assert.equal(mod.patchHitResolver(rt),true,'V114.11 final resolver must install');
assert.equal(engine.resolveAttack.__gensRpg11411Damage,true,'V114.11 final resolver marker missing');

const state={status:'active',config:{rollHighToHit:true},rngSeed:123,log:[]};
const result=engine.resolveAttack(state,attacker.id,target.id,melee.id,1);
assert.equal(result.ok,true);
assert.equal(result.hit,true);
assert.equal(result.baseWeaponDamage,5);
assert.equal(result.statDamageBonus,3);
assert.equal(result.rawDamage,8);
assert.equal(result.armor,2);
assert.equal(result.damagePerHit,6);
assert.equal(result.damage,6);
assert.equal(result.targetHp,14);
assert.equal(target.hp,14,'resolved target HP must reflect canonical stat bonus after armor');
assert.equal(state.log.at(-1)?.statDamageBonus,3,'combat log must expose the canonical stat bonus used');

assert.equal(typeof mod.damageCalculationFormula,'function','canonical dice authority must expose the visible damage formula');
const formula=mod.damageCalculationFormula(result);
assert.match(formula,/5/,'damage explanation must show raw weapon power');
assert.match(formula,/3/,'damage explanation must show canonical stat bonus');
assert.match(formula,/8/,'damage explanation must show raw damage before armor');
assert.match(formula,/2/,'damage explanation must show target armor');
assert.match(formula,/6/,'damage explanation must show final inflicted damage');

console.log('GenSrpG V114.11 final melee damage contract OK: 5 weapon + 3 canonical stat - 2 armor = 6 final damage, visibly explainable');
