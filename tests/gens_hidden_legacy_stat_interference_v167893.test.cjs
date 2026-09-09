const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
let profiles=[{id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[
{id:'force',name:'Force',icon:'💪',defaultValue:10,min:0,max:999,visible:true,description:''},
{id:'agilite',name:'Agilité',icon:'🏃',defaultValue:10,min:0,max:999,visible:true,description:''},
{id:'intelligence',name:'Intelligence',icon:'🧠',defaultValue:10,min:0,max:999,visible:true,description:''},
{id:'esprit',name:'Esprit',icon:'✨',defaultValue:10,min:0,max:999,visible:true,description:''},
{id:'endurance',name:'Endurance',icon:'❤️',defaultValue:10,min:0,max:999,visible:true,description:''}],active:['force','agilite','intelligence','esprit','endurance'],dynamicEffects90:[
{id:'new_phys',source:'force',target:'damage:physical',mode:'step',step:10,gain:5,enabled:true},
{id:'new_magic',source:'intelligence',target:'damage:magic',mode:'step',step:10,gain:7,enabled:true},
{id:'new_hp',source:'endurance',target:'max_hp',mode:'step',step:10,gain:11,enabled:true},
{id:'new_mana',source:'esprit',target:'max_mana',mode:'step',step:10,gain:13,enabled:true},
{id:'new_crit',source:'agilite',target:'crit',mode:'step',step:10,gain:17,enabled:true}
]}}}];
const rules={physicalDamageStep:10,physicalDamageGain:2,magicDamageStep:10,magicDamageGain:3,enduranceHpStep:10,hpGain:4,spiritManaStep:10,manaGain:6,agilityCritStep:10,critGain:8,critCap:100,dodgeCap:100};
const ctx={console,Math,Date,JSON,setTimeout:fn=>{if(typeof fn==='function')fn();return 0},clearTimeout:()=>{},
 current:'hero',state:{rpgAttributes:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10}},CHARS:{hero:{dungeonStats:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10}}},
 currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,saveGameProfiles:a=>{profiles=JSON.parse(JSON.stringify(a))},activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
 loadDungeonRpgRules:()=>rules,saveDungeonRpgRules:()=>{},isDungeonMode:()=>true,loadState:()=>ctx.state,save:()=>{},dungeonEquipmentBonus:()=>0,dungeonSkillEffectTotal:()=>0,dungeonChallengeDebuffTotal067:()=>0,
 dungeonAttributeValue:id=>Number(ctx.state.rpgAttributes[id]??0),changeDungeonAttribute:()=>{},renderDungeonAttributes:()=>{},renderRpgUniverseEditor:()=>{},saveRpgUniverseStats:()=>{},showToast:()=>{},
 dungeonPhysicalDamageBonus:()=>2,dungeonMagicDamageBonus:()=>3,dungeonEnduranceHpBonus:()=>4,dungeonMaxMana:()=>6,dungeonCriticalChance:()=>8,dungeonDodgeChance:()=>0,dungeonMagicResistance:()=>0,dungeonDerivedDefense:()=>0,dungeonArmorScore:()=>0,dungeonDerivedInitiative:()=>0,applyDungeonCombatScaling:x=>x};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext('const DUNGEON_DEFAULT_ATTRIBUTES=[];',ctx);
vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
assert.equal(ctx.dungeonPhysicalDamageBonus(),7,'legacy physical bonus (2) is still added under new effect (5)');
assert.equal(ctx.dungeonMagicDamageBonus(),10,'legacy magic bonus (3) is still added under new effect (7)');
assert.equal(ctx.dungeonEnduranceHpBonus(),15,'legacy HP bonus (4) is still added under new effect (11)');
assert.equal(ctx.dungeonMaxMana(),19,'legacy mana bonus (6) is still added under new effect (13)');
assert.equal(ctx.dungeonCriticalChance(),25,'legacy crit bonus (8) is still added under new effect (17)');
console.log('INTERFERENCE CONFIRMED: hidden legacy characteristic modifiers still stack with new stat effects.');
