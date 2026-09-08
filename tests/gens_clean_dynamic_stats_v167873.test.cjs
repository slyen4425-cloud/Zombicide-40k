const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-stats-clean-167873.js'),'utf8');
let savedProfiles=[];
const profile={id:'dungeon',gameStyle:'dungeon',rpgUniverse:{
 progression:{attributeEditMode:'points'},
 stats:{active:['force','agility','intelligence','spirit','endurance','initiative','chance'],dynamicDefinitions:[
  {id:'chance',name:'Chance',icon:'🍀',defaultValue:10,min:0,max:99,visible:true,description:'Influe sur les coups heureux.'}
 ],dynamicRules:[{id:'chance_phys',source:'chance',target:'damage:physical',step:10,gain:1,enabled:true}]}
}};
savedProfiles=[profile];
const heroState={statPoints:2,rpgStatSpent:0,rpgStatSpentById:{},rpgAttributes:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:0,chance:10}};
const rules={physicalDamageStep:10,physicalDamageGain:1,magicDamageStep:10,magicDamageGain:1,enduranceHpStep:10,hpGain:2,spiritManaStep:10,manaGain:10,agilityCritStep:10,critGain:5,agilityDodgeStep:10,dodgeGain:3,meleeHitStep:10,meleeHitGain:5,rangedHitStep:10,rangedHitGain:5,magicHitStep:10,magicHitGain:5,spiritMagicResistStep:20,magicResistGain:1,critCap:50,dodgeCap:40};
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout,alert:()=>{},current:'dungeon_aldren',state:heroState,
 isDungeonMode:()=>true,currentRpgProfile:()=>savedProfiles[0],getActiveGameProfile:()=>savedProfiles[0],loadGameProfiles:()=>savedProfiles,saveGameProfiles:a=>{savedProfiles=a},loadState:()=>heroState,save:()=>{},
 dungeonEquipmentBonus:id=>id==='chance'?2:0,dungeonSkillEffectTotal:(kind,_x,id)=>kind==='attribute'&&id==='chance'?1:0,
 dungeonActiveProgressionConfig:()=>({attributeEditMode:'points'}),dungeonSyncProgressionForState:(_h,st)=>{st.statPoints=2-Math.max(0,Number(st.rpgStatSpent)||0)},
 loadDungeonRpgRules:()=>rules,saveDungeonRpgRules:r=>Object.assign(rules,r),syncRpgUniverseToDungeonRules:()=>{},applyGameProfile:()=>{},
 dungeonAttributeValue:()=>99,changeDungeonAttribute:()=>false,renderDungeonAttributes:()=>true,renderRpgUniverseEditor:()=>true,renderDungeonHeroStats:()=>true,
 dungeonPhysicalDamageBonus:()=>2,dungeonMagicDamageBonus:()=>3,dungeonHitBonusForMode:()=>5,dungeonEnduranceHpBonus:()=>2,dungeonMaxMana:()=>10,dungeonCriticalChance:()=>5,dungeonDodgeChance:()=>3,dungeonMagicResistance:()=>1,dungeonDerivedDefense:()=>0,dungeonArmorScore:()=>0,dungeonDerivedInitiative:()=>10
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167873.js'});
const api=ctx.GensCleanRpgStats167873;assert.ok(api,'clean stat API missing');api.install();
assert.equal(api.def('chance').name,'Chance');
assert.equal(api.active('chance'),true);
assert.equal(api.base('dungeon_aldren','chance'),10);
assert.equal(api.value('dungeon_aldren','chance'),13,'unknown stat must include equipment and talent bonuses');
assert.equal(api.extraTotal('damage:physical'),1,'10 Chance must add +1 physical damage');
assert.equal(ctx.dungeonPhysicalDamageBonus(),3,'stable native physical damage + dynamic rule');
assert.equal(ctx.dungeonAttributeValue('chance'),13,'runtime attribute lookup must accept unknown ids');
assert.equal(api.change('chance',1),true);
assert.equal(heroState.rpgAttributes.chance,11);
assert.equal(heroState.rpgStatSpentById.chance,1);
assert.equal(heroState.statPoints,1,'+1 must consume one real stat point through stable progression sync');
assert.equal(api.change('chance',-1),true);
assert.equal(heroState.rpgAttributes.chance,10);
assert.equal(heroState.rpgStatSpentById.chance,0);
assert.equal(heroState.statPoints,2,'-1 must refund the point spent on this stat');
assert.ok(api.legacyRules().some(r=>r.id==='legacy_phys'&&r.step===10&&r.gain===1),'legacy Force formula must remain exposed and editable');
assert.doesNotMatch(src,/GensRpgStatService167901|gens-rpg-stat-reconcile-167902|gens-custom-stats-167881/,'V16.79 stat layers must not be reused');
console.log('GenSrpG V16.78.73 clean dynamic stats: unknown stat + points + stable formula bridge OK');