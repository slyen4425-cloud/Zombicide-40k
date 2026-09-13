const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const statsSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const cleanSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-legacy-cleanup-167891.js'),'utf8');
let profiles=[{id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{
 dynamicDefinitions:[{id:'rage',name:'Rage',icon:'🔥',defaultValue:0,min:0,max:100,visible:true}],
 active:['force','agilite','intelligence','esprit','endurance','initiative','rage'],
 dynamicEffects90:[
  {id:'rage_damage',source:'rage',target:'damage:physical',mode:'step',step:10,gain:5,enabled:true},
  {id:'rage_hit',source:'rage',target:'hit:melee',mode:'step',step:10,gain:7,enabled:true}
 ]
}}}];
const rules={physicalDamageStep:10,physicalDamageGain:1,meleeHitStep:10,meleeHitGain:3,
 magicDamageStep:10,magicDamageGain:0,enduranceHpStep:10,hpGain:0,spiritManaStep:10,manaGain:0,
 agilityCritStep:10,critGain:0,agilityDodgeStep:10,dodgeGain:0,rangedHitStep:10,rangedHitGain:0,
 magicHitStep:10,magicHitGain:0,spiritMagicResistStep:10,magicResistGain:0,critCap:100,dodgeCap:100};
const state={rpgAttributes:{rage:20}};
const ctx={console,Math,Date,JSON,Set,Map,
 setTimeout:fn=>{if(typeof fn==='function')fn();return 0},clearTimeout:()=>{},
 current:'hero',state,
 currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,
 saveGameProfiles:a=>{profiles=JSON.parse(JSON.stringify(a))},activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
 loadDungeonRpgRules:()=>({...rules}),saveDungeonRpgRules:()=>{},isDungeonMode:()=>true,
 dungeonAttributeValue:id=>id==='force'?20:0,
 dungeonPhysicalDamageBonus:()=>2,
 dungeonMagicDamageBonus:()=>0,dungeonEnduranceHpBonus:()=>0,dungeonMaxMana:()=>0,dungeonCriticalChance:()=>0,
 dungeonDodgeChance:()=>0,dungeonMagicResistance:()=>0,dungeonDerivedDefense:()=>0,dungeonArmorScore:()=>0,dungeonDerivedInitiative:()=>0,
 applyDungeonCombatScaling:()=>({melee:true,hitChance:82,damage:3,mods:[]}),
 loadState:()=>state,showToast:()=>{},save:()=>{},addEventListener:()=>{}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(statsSrc,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
ctx.GensCleanRpgStats167874.install();
assert.equal(ctx.dungeonPhysicalDamageBonus(),12,'V90 bridge must apply custom Rage damage before cleanup');
assert.equal(ctx.applyDungeonCombatScaling({rpgScaling:{magic:false}}).hitChance,96,'V90 bridge must apply custom Rage melee hit before cleanup');
vm.runInContext(cleanSrc,ctx,{filename:'gens-rpg-legacy-cleanup-167891.js'});
assert.equal(ctx.GENSRPG_VERSION,'16.78.93');
assert.equal(ctx.dungeonPhysicalDamageBonus(),10,'legacy Force damage must be removed while custom Rage damage remains');
assert.equal(ctx.applyDungeonCombatScaling({rpgScaling:{magic:false}}).hitChance,90,'legacy melee hit must be removed while custom Rage hit remains');
assert.equal(ctx.GensCleanRpgStats167874.value('hero','rage'),20,'active custom stat must be readable by runtime');
profiles[0].rpgUniverse.stats.active=profiles[0].rpgUniverse.stats.active.filter(x=>x!=='rage');
assert.equal(ctx.GensCleanRpgStats167874.value('hero','rage'),0,'inactive custom stat must stop contributing');
assert.match(cleanSrc,/data-active/,'V93 must listen to active checkbox changes');
assert.match(cleanSrc,/syncEditor/,'V93 autosave must persist editor state through the real stats API');
assert.match(cleanSrc,/visibilitychange/,'V93 must flush editor changes when app is backgrounded');
assert.match(cleanSrc,/pagehide/,'V93 must flush editor changes when page closes');
assert.match(cleanSrc,/modificateurs par caracteristique/,'V93 must target the obsolete modifier section');
console.log('GenSrpG V16.78.93 stats runtime audit: custom effects preserved, legacy removed, active-state autosave guarded');
