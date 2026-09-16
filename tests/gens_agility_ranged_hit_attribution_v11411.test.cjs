const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.join(__dirname,'..');
const statsSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const A=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'));

let profiles=[{
  id:'dungeon',name:'Dungeon',gameStyle:'dungeon',
  rpgUniverse:{stats:{
    nativeCoreMigrated95:true,legacyEffectsMigrated94:true,
    active:['agilite'],
    dynamicDefinitions:[{id:'agilite',name:'Agilité',icon:'🏃',defaultValue:10,min:0,max:999,visible:true}],
    dynamicEffects90:[{id:'agi_ranged',source:'agilite',target:'hit:ranged',mode:'step',step:10,gain:20,enabled:true}],
    dynamicRules:[]
  }}
}];
const states={dungeon_lyra:{rpgAttributes:{agilite:10}}};
const item={
  id:'dng_bow',name:'Arc',type:'Arme',range:6,dice:1,strength:2,
  rpgScaling:{attribute:'agilite',baseChance:55,chancePerPoint:0,diceSides:100}
};
const ctx={
  console,Math,Date,JSON,Set,Map,
  setTimeout(fn){if(typeof fn==='function')fn();return 1},clearTimeout(){},
  current:'dungeon_lyra',state:states.dungeon_lyra,
  CHARS:{dungeon_lyra:{name:'Lyra',dungeonStats:{agilite:10}}},
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,saveGameProfiles:next=>{profiles=JSON.parse(JSON.stringify(next))},
  activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
  loadDungeonRpgRules:()=>({rangedHitStep:10,rangedHitGain:0,critCap:100,dodgeCap:100}),saveDungeonRpgRules:()=>{},
  loadState:id=>states[id],save:()=>{},saveState:()=>{},
  dungeonEquipmentBonus:()=>0,dungeonSkillEffectTotal:()=>0,dungeonChallengeDebuffTotal067:()=>0,
  dungeonAttributeValue(id){return Number(this.state?.rpgAttributes?.[id]??0)},
  changeDungeonAttribute:()=>true,renderDungeonAttributes:()=>{},renderRpgUniverseEditor:()=>{},saveRpgUniverseStats:()=>{},showToast:()=>{},
  dungeonHitBonusForMode:()=>0,
  applyDungeonCombatScaling(it,st={}){return {...st,range:6,melee:false,hitChance:Number(it?.rpgScaling?.baseChance||55),damage:2,dice:1,strength:2}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(statsSrc,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
ctx.GensCleanRpgStats167874.install();

const scaled=ctx.applyDungeonCombatScaling(item,{range:6,melee:false,hitChance:55,damage:2,dice:1,strength:2});
assert.equal(scaled.hitChance,75,'canonical Agility -> hit:ranged effect must reach the effective attack stats');
assert.equal(ctx.GensCleanRpgStats167874.extraTotal('hit:ranged','dungeon_lyra'),20,'canonical stat engine must own the +20 ranged hit effect');

const profile=A.weaponHitProfile(ctx,'dungeon_lyra',item,scaled);
assert.equal(profile.hit,75,'Tactical final hit chance must preserve the canonical 75% result');
assert.equal(profile.breakdown.attribute,'agilite');
assert.equal(profile.breakdown.attributeValue,10);
assert.equal(profile.breakdown.statBonus,20,'the visible Tactical breakdown must attribute the canonical +20% to Agility, not hide it as an unrelated bonus');
assert.equal(profile.breakdown.otherBonus,0,'no phantom “other bonus” must absorb the canonical Agility effect');

console.log('GenSrpG V114.11 Agility ranged hit attribution contract OK');
