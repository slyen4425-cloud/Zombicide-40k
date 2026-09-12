const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-legacy-cleanup-167891.js'),'utf8');
const attrs={force:20,intelligence:20,endurance:20,esprit:20,agilite:20};
const rules={
 physicalDamageStep:10,physicalDamageGain:1,
 magicDamageStep:10,magicDamageGain:3,
 enduranceHpStep:10,hpGain:2,
 spiritManaStep:10,manaGain:10,
 agilityCritStep:10,critGain:2,
 agilityDodgeStep:10,dodgeGain:1,
 meleeHitStep:10,meleeHitGain:3,
 rangedHitStep:10,rangedHitGain:4,
 magicHitStep:10,magicHitGain:5,
 spiritMagicResistStep:10,magicResistGain:2
};
const ctx={console,Math,JSON,
 isDungeonMode:()=>true,
 loadDungeonRpgRules:()=>({...rules}),
 dungeonAttributeValue:id=>attrs[id]||0,
 // Ces résultats simulent l'ancien moteur + un éventuel bonus du nouvel éditeur.
 dungeonPhysicalDamageBonus:()=>17, // 15 nouveau/base + 2 legacy
 dungeonMagicDamageBonus:()=>26,    // 20 nouveau/base + 6 legacy
 dungeonEnduranceHpBonus:()=>14,    // 10 nouveau/base + 4 legacy
 dungeonMaxMana:()=>35,             // 15 nouveau/base + 20 legacy
 dungeonCriticalChance:()=>19,      // 15 nouveau/base + 4 legacy
 dungeonDodgeChance:()=>14,         // 12 nouveau/base + 2 legacy
 dungeonMagicResistance:()=>18,     // 14 nouveau/base + 4 legacy
 applyDungeonCombatScaling:it=>({melee:!it.rpgScaling.magic,hitChance:86})
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-rpg-legacy-cleanup-167891.js'});
const api=ctx.GensRpgLegacyCleanup167891;
assert.ok(api,'cleanup API missing');
assert.equal(api.APP_VERSION,'16.78.91');
assert.equal(ctx.dungeonPhysicalDamageBonus(),15,'legacy physical damage must be removed');
assert.equal(ctx.dungeonMagicDamageBonus(),20,'legacy magic damage must be removed');
assert.equal(ctx.dungeonEnduranceHpBonus(),10,'old Endurance HP scaling must be removed');
assert.equal(ctx.dungeonMaxMana(),15,'old Spirit/Mana scaling must be removed while preserving base/new mana');
assert.equal(ctx.dungeonCriticalChance(),15,'legacy crit must be removed');
assert.equal(ctx.dungeonDodgeChance(),12,'legacy dodge must be removed');
assert.equal(ctx.dungeonMagicResistance(),14,'legacy magic resistance must be removed');
assert.equal(ctx.applyDungeonCombatScaling({rpgScaling:{magic:false}}).hitChance,80,'legacy melee hit must be removed');
assert.match(src,/PV \/ 10 Endurance/,'old Endurance field must be targeted for hiding');
assert.match(src,/Mana \/ 10 Esprit/,'old Mana field must be targeted for hiding');
assert.match(src,/modificateurs par caracteristique/,'old modifier section must be targeted for hiding');
assert.doesNotMatch(src,/hideLabel\("PV de base"\)/,'base HP must remain visible');
assert.doesNotMatch(src,/hideLabel\("Mana de base"\)/,'base Mana must remain visible');
console.log('GenSrpG V16.78.91 legacy RPG stat cleanup: runtime + UI guards OK');
