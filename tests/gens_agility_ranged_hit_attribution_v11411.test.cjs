const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.join(__dirname,'..');
const statsSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const statsNormalizationSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-normalization-v1.js'),'utf8');
const A=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'));

let profiles=[{
  id:'dungeon',name:'Dungeon',gameStyle:'dungeon',
  rpgUniverse:{stats:{
    nativeCoreMigrated95:true,legacyEffectsMigrated94:true,
    active:['agilite','force'],
    dynamicDefinitions:[
      {id:'agilite',name:'Agilité',icon:'🏃',defaultValue:10,min:0,max:999,visible:true},
      {id:'force',name:'Force',icon:'💪',defaultValue:10,min:0,max:999,visible:true}
    ],
    dynamicEffects90:[
      {id:'agi_ranged',source:'agilite',target:'hit:ranged',mode:'step',step:10,gain:20,enabled:true},
      {id:'force_ranged_misc',source:'force',target:'hit:ranged',mode:'step',step:10,gain:5,enabled:true}
    ],
    dynamicRules:[]
  }}
}];
const states={dungeon_lyra:{rpgAttributes:{agilite:10,force:10}}};
const item={
  id:'dng_bow',name:'Arc',type:'Arme',range:6,dice:1,strength:2,
  rpgScaling:{attribute:'agilite',baseChance:55,chancePerPoint:0,diceSides:100}
};
const ctx={
  console,Math,Date,JSON,Set,Map,
  setTimeout(fn){if(typeof fn==='function')fn();return 1},clearTimeout(){},
  current:'dungeon_lyra',state:states.dungeon_lyra,
  CHARS:{dungeon_lyra:{name:'Lyra',dungeonStats:{agilite:10,force:10}}},
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
vm.runInContext(statsNormalizationSrc,ctx,{filename:'stats-normalization-v1.js'});\nvm.runInContext(statsSrc,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
ctx.GensCleanRpgStats167874.install();

const scaled=ctx.applyDungeonCombatScaling(item,{range:6,melee:false,hitChance:55,damage:2,dice:1,strength:2});
assert.equal(scaled.hitChance,80,'all canonical hit:ranged effects must reach the final attack chance once');
assert.equal(ctx.GensCleanRpgStats167874.extraTotal('hit:ranged','dungeon_lyra'),25,'canonical stat engine must own the complete +25 ranged hit effect');
assert.equal(ctx.GensCleanRpgStats167874.sourceEffectTotal('hit:ranged','agilite','dungeon_lyra'),20,'source-specific attribution must isolate Agility at +20');
assert.equal(ctx.GensCleanRpgStats167874.sourceEffectTotal('hit:ranged','force','dungeon_lyra'),5,'another stat contribution must remain distinguishable');

const profile=A.weaponHitProfile(ctx,'dungeon_lyra',item,scaled);
assert.equal(profile.hit,80,'Tactical final hit chance must preserve the already-computed canonical 80% result');
assert.equal(profile.breakdown.attribute,'agilite');
assert.equal(profile.breakdown.attributeValue,10);
assert.equal(profile.breakdown.statBonus,20,'visible Tactical breakdown must attribute only the Agility contribution to Agility');
assert.equal(profile.breakdown.otherBonus,5,'other canonical effects must remain visible as other bonus instead of being mislabeled Agility');
assert.equal(profile.breakdown.baseChance+profile.breakdown.statBonus+profile.breakdown.otherBonus,profile.hit,'visible breakdown must reconcile exactly to the final chance without double counting');

console.log('GenSrpG V114.11 Agility ranged hit attribution contract OK');
