const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const rootDir=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(rootDir,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');

let profiles=[{id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[
  {id:'force',name:'Force',icon:'💪',defaultValue:10,min:0,max:999,visible:true,description:''},
  {id:'agilite',name:'Agilité',icon:'🏃',defaultValue:10,min:0,max:999,visible:true,description:''},
  {id:'intelligence',name:'Intelligence',icon:'🧠',defaultValue:10,min:0,max:999,visible:true,description:''},
  {id:'esprit',name:'Esprit',icon:'✨',defaultValue:10,min:0,max:999,visible:true,description:''},
  {id:'endurance',name:'Endurance',icon:'❤️',defaultValue:10,min:0,max:999,visible:true,description:''}
],active:['force','agilite','intelligence','esprit','endurance'],dynamicEffects90:[
  {id:'new_phys',source:'force',target:'damage:physical',mode:'step',step:10,gain:5,enabled:true}
]}}}];
let rules={
  physicalDamageStep:10,physicalDamageGain:2,
  magicDamageStep:10,magicDamageGain:3,
  enduranceHpStep:10,hpGain:4,
  spiritManaStep:10,manaGain:6,
  agilityCritStep:10,critGain:8,
  agilityDodgeStep:10,dodgeGain:9,
  meleeHitStep:10,meleeHitGain:1,
  rangedHitStep:10,rangedHitGain:2,
  magicHitStep:10,magicHitGain:3,
  spiritMagicResistStep:10,magicResistGain:4,
  critCap:100,dodgeCap:100
};
const state={rpgAttributes:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10}};
const ctx={console,Math,Date,JSON,setTimeout:fn=>{if(typeof fn==='function')fn();return 0},clearTimeout:()=>{},
 current:'hero',state,CHARS:{hero:{dungeonStats:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10}}},
 currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,
 saveGameProfiles:a=>{profiles=JSON.parse(JSON.stringify(a))},activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
 loadDungeonRpgRules:()=>rules,saveDungeonRpgRules:r=>{rules={...r}},isDungeonMode:()=>true,loadState:()=>state,save:()=>{},
 dungeonEquipmentBonus:()=>0,dungeonSkillEffectTotal:()=>0,dungeonChallengeDebuffTotal067:()=>0,
 dungeonAttributeValue:id=>Number(state.rpgAttributes[id]??0),changeDungeonAttribute:()=>{},renderDungeonAttributes:()=>{},renderRpgUniverseEditor:()=>{},saveRpgUniverseStats:()=>{},showToast:()=>{},
 dungeonPhysicalDamageBonus:()=>rules.physicalDamageGain,dungeonMagicDamageBonus:()=>rules.magicDamageGain,dungeonEnduranceHpBonus:()=>rules.hpGain,dungeonMaxMana:()=>rules.manaGain,
 dungeonCriticalChance:()=>rules.critGain,dungeonDodgeChance:()=>rules.dodgeGain,dungeonMagicResistance:()=>rules.magicResistGain,dungeonDerivedDefense:()=>0,dungeonArmorScore:()=>0,dungeonDerivedInitiative:()=>0,
 applyDungeonCombatScaling:item=>item
};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext('const DUNGEON_DEFAULT_ATTRIBUTES=[];',ctx);
vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'stats API missing');
assert.equal(api.APP_VERSION,'16.78.95');
api.root(profiles[0]);
api.migrateLegacyEffects(profiles[0]);
api.installRuntime();

for(const key of ['physicalDamageGain','magicDamageGain','hpGain','manaGain','critGain','dodgeGain','meleeHitGain','rangedHitGain','magicHitGain','magicResistGain']){
  assert.equal(rules[key],0,key+' must be neutralized in the hidden legacy engine');
}
const stats=profiles[0].rpgUniverse.stats;
assert.equal(stats.legacyEffectsMigrated94,true,'profile must record one-time migration');
assert.equal(api.legacyEffects().length,0,'legacy effects must no longer appear as a second live effect source');
assert.equal(stats.dynamicEffects90.filter(e=>e.source==='force'&&e.target==='damage:physical').length,1,'an explicit new physical effect must replace, not stack with, the hidden old one');
assert.ok(stats.dynamicEffects90.some(e=>e.id==='migrated_legacy_magic'&&e.gain===3),'unreplaced legacy magic effect must be preserved as a visible normal effect');
assert.ok(stats.dynamicEffects90.some(e=>e.id==='migrated_legacy_hp'&&e.gain===4),'unreplaced legacy HP effect must be preserved as a visible normal effect');
assert.ok(stats.dynamicEffects90.some(e=>e.id==='migrated_legacy_mana'&&e.gain===6),'unreplaced legacy mana effect must be preserved as a visible normal effect');

assert.equal(ctx.dungeonPhysicalDamageBonus(),5,'physical result must use the configured new effect only, without hidden +2');
assert.equal(ctx.dungeonMagicDamageBonus(),3,'old magic behavior must survive only through its migrated visible effect');
assert.equal(ctx.dungeonEnduranceHpBonus(),4,'old HP behavior must survive only through its migrated visible effect');
assert.equal(ctx.dungeonMaxMana(),6,'old mana behavior must survive only through its migrated visible effect');
assert.equal(ctx.dungeonCriticalChance(),8,'old crit behavior must survive only through its migrated visible effect');

const countBefore=stats.dynamicEffects90.length;
api.migrateLegacyEffects(profiles[0]);
assert.equal(profiles[0].rpgUniverse.stats.dynamicEffects90.length,countBefore,'migration must be idempotent and never duplicate effects');
console.log('GenSrpG V16.78.95 stat engine cleanup: hidden legacy coefficients neutralized, visible effects are the single authority');
