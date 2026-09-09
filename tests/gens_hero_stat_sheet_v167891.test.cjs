const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
function el(id=''){return {id,dataset:{},style:{},innerHTML:'',parentNode:null,nextSibling:null,addEventListener(){},insertBefore(node){node.parentNode=this;nodes[node.id]=node},querySelector(){return null},querySelectorAll(){return []}}}
const nodes={};
const parent=el('parent'),anchor=el('dungeonHeroStats'),grid=el('dungeonAttributeGrid');anchor.parentNode=parent;grid.parentNode=parent;nodes.dungeonHeroStats=anchor;nodes.dungeonAttributeGrid=grid;
const document={readyState:'complete',getElementById:id=>nodes[id]||null,createElement:()=>el(),addEventListener(){}};
const profile={id:'dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{active:['force','chance'],dynamicDefinitions:[{id:'chance',name:'Chance',icon:'🍀',defaultValue:10,min:0,max:99,visible:true,description:'Chance du héros'}],dynamicRules:[{id:'chance_melee',source:'chance',target:'hit:melee',step:1,gain:2,enabled:true}]}}};
let profiles=[profile];const state={statPoints:3,rpgAttributes:{chance:10},rpgStatSpentById:{},rpgStatSpent:0};
const ctx={console,Math,Date,JSON,setTimeout:f=>{f();return 1},clearTimeout(){},document,current:'dungeon_aldren',state,window:null,globalThis:null,
 isDungeonMode:()=>true,currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,saveGameProfiles:a=>{profiles=a},loadState:()=>state,save:()=>{},
 loadDungeonRpgRules:()=>({physicalDamageStep:10,physicalDamageGain:1,meleeHitStep:10,meleeHitGain:5}),saveDungeonRpgRules:()=>{},dungeonAttributeValue:id=>id==='force'?10:0,dungeonBaseAttributeValue:id=>id==='force'?10:0,
 dungeonEquipmentBonus:()=>0,dungeonSkillEffectTotal:()=>0,dungeonChallengeDebuffTotal067:()=>0,dungeonActiveProgressionConfig:()=>({attributeEditMode:'free'}),dungeonSyncProgressionForState:()=>{},changeDungeonAttribute:()=>true,
 renderDungeonAttributes:()=>true,renderDungeonHeroStats:()=>{anchor.innerHTML='<b>renderer historique</b>';return true},openChar:()=>true,renderRpgUniverseEditor:()=>true,saveRpgUniverseStats:()=>true,
 dungeonPhysicalDamageBonus:()=>0,dungeonMagicDamageBonus:()=>0,dungeonEnduranceHpBonus:()=>0,dungeonMaxMana:()=>0,dungeonCriticalChance:()=>0,dungeonDodgeChance:()=>0,dungeonMagicResistance:()=>0,dungeonDerivedDefense:()=>0,dungeonArmorScore:()=>0,dungeonDerivedInitiative:()=>0,applyDungeonCombatScaling:(_i,s)=>s
};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
const api=ctx.GensCleanRpgStats167874;assert.ok(api);api.install();
assert.equal(api.APP_VERSION,'16.78.91');
assert.equal(api.renderHeroBuild(),true);
const build=nodes.gensDynamicHeroStats91;assert.ok(build,'hero build container missing');
assert.match(build.innerHTML,/Chance/,'custom stat missing from hero build');
assert.match(build.innerHTML,/data-stat-change="-1"/,'minus button missing');
assert.match(build.innerHTML,/data-stat-change="1"/,'plus button missing');
assert.match(build.innerHTML,/Effet :/,'explanation label missing');
assert.match(build.innerHTML,/Toucher mêlée/,'effect explanation missing');
ctx.renderDungeonHeroStats();
assert.ok(nodes.gensDynamicHeroStats91.innerHTML.includes('Chance'),'late legacy hero renderer must be followed by dynamic stat render');
assert.match(grid.innerHTML,/Chance/,'main stat grid must also include custom stat');
console.log('GenSrpG V16.78.91 hero build stats: +/- + explanations + late renderer bridge OK');