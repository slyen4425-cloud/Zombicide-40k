const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(V.APP_VERSION,'16.78.114.12');

function core317(){
  return {
    isPhysicalDamageType:type=>String(type||'physical').toLowerCase()==='physical',
    resolveArmorFloor(incoming,reduction,configuredMin,damageType,rules,roll){
      const reduced=Math.max(0,Number(incoming)||0)-Math.max(0,Number(reduction)||0);
      if(String(damageType)==='physical'&&reduced<=0){
        const chance=Math.max(0,Math.min(100,Number(rules?.armorZeroBlockChance??75)));
        return Number(roll)<chance?0:1;
      }
      return Math.max(1,Math.max(0,Number(configuredMin)||0),reduced);
    }
  };
}

const hero={meta:{rpgStats:{derived:{physicalDamageBonus:1,magicDamageBonus:0}}}};
const sword={power:2,damageType:'physical',tags:['melee'],ignoreArmor:false,meta:{itemId:'sword'}};
const skeleton={armor:3};
const preview={damageType:'physical',armor:3,damage:0,rawDamage:2};
const rt={DungeonCore317:core317(),loadDungeonRpgRules:()=>({armorZeroBlockChance:75}),itemById:id=>id==='sword'?{damage:2}:null};

const blocked=V.resolvePhysicalDamage(rt,null,hero,skeleton,sword,preview,74);
assert.equal(blocked.itemBaseDamage,2);
assert.equal(blocked.weaponEffectBonus,0);
assert.equal(blocked.baseWeaponDamage,2);
assert.equal(blocked.statDamageBonus,1,'Force/canonical melee bonus must enter tactical raw damage');
assert.equal(blocked.rawDamage,3,'2 sword + 1 canonical melee bonus must equal 3 raw damage');
assert.equal(blocked.armor,3);
assert.equal(blocked.damage,0,'roll 74 must be fully blocked at 75% block chance');
assert.equal(blocked.armorFloorTriggered,true);
assert.equal(blocked.armorBlocked,true);

const enhancedSword={...sword,power:3};
const enhanced=V.resolvePhysicalDamage(rt,null,hero,{armor:0},enhancedSword,{damageType:'physical',armor:0,damage:3,rawDamage:3},0);
assert.equal(enhanced.itemBaseDamage,2);
assert.equal(enhanced.weaponEffectBonus,1,'effective weapon effects must be visible separately from base item damage');
assert.equal(enhanced.statDamageBonus,1);
assert.equal(enhanced.rawDamage,4,'2 base + 1 equipment/effect + 1 melee stats = 4 raw');
const detail=V.damageDetailsHtml({ok:true,damageType:'physical',damage:4,damageRolls:[{...enhanced,finalDamage:4,crit:false}]});
assert.match(detail,/Dégâts bruts 4/);
assert.match(detail,/2 arme/);
assert.match(detail,/1 effets arme\/équipement/);
assert.match(detail,/1 bonus mêlée \(stats\)/);

const wounded=V.resolvePhysicalDamage(rt,null,hero,skeleton,sword,preview,75);
assert.equal(wounded.rawDamage,3);
assert.equal(wounded.damage,1,'roll 75 must let the minimum 1 damage through');
assert.equal(wounded.armorBlocked,false);

let zero=0,one=0;
for(let roll=0;roll<100;roll++){
  const out=V.resolvePhysicalDamage(rt,null,hero,skeleton,sword,preview,roll);
  if(out.damage===0)zero++;else if(out.damage===1)one++;
}
assert.equal(zero,75,'default historical armor rule must block 75%');
assert.equal(one,25,'default historical armor rule must let 1 damage through 25%');

const rt50={DungeonCore317:core317(),loadDungeonRpgRules:()=>({armorZeroBlockChance:50}),itemById:rt.itemById};
assert.equal(V.resolvePhysicalDamage(rt50,null,hero,skeleton,sword,preview,49).damage,0,'configured 50% block: 49 blocks');
assert.equal(V.resolvePhysicalDamage(rt50,null,hero,skeleton,sword,preview,50).damage,1,'configured 50% block: 50 lets 1 through');

const lighter={armor:2};
const lighterPreview={damageType:'physical',armor:2,damage:0,rawDamage:2};
const normal=V.resolvePhysicalDamage(rt,null,hero,lighter,sword,lighterPreview,0);
assert.equal(normal.rawDamage,3);
assert.equal(normal.damage,1,'3 raw - 2 armor must deal 1 without armor-floor lottery');
assert.equal(normal.armorFloorTriggered,false);

const ranged={power:2,damageType:'physical',tags:['ranged'],ignoreArmor:false};
const rangedOut=V.resolvePhysicalDamage(rt,null,hero,skeleton,ranged,preview,75);
assert.equal(rangedOut.statDamageBonus,0,'melee physical bonus must not leak into ranged attacks');
assert.equal(rangedOut.rawDamage,2);

console.log('V16.78.114.12 damage source clarity + canonical melee damage + configurable 75/25 armor floor OK');
