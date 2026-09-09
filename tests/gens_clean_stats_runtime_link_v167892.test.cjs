const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
let profiles=[{id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[],active:[]}}}];
let savedState={rpgAttributes:{},statPoints:3,rpgStatSpent:0};
const ctx={console,Math,Date,JSON,setTimeout:fn=>{if(typeof fn==='function')fn();return 0},clearTimeout:()=>{},
 current:'hero',state:savedState,CHARS:{hero:{dungeonStats:{force:5,agilite:4,intelligence:3,esprit:2,endurance:6}}},
 currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,
 saveGameProfiles:a=>{profiles=JSON.parse(JSON.stringify(a))},activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
 loadDungeonRpgRules:()=>({physicalDamageStep:10,physicalDamageGain:1,meleeHitStep:10,meleeHitGain:2}),saveDungeonRpgRules:()=>{},
 isDungeonMode:()=>true,loadState:()=>savedState,save:()=>{},dungeonEquipmentBonus:()=>0,dungeonSkillEffectTotal:()=>0,dungeonChallengeDebuffTotal067:()=>0,
 dungeonAttributeValue:id=>Number(savedState.rpgAttributes[id]??0),changeDungeonAttribute:(id,delta)=>{savedState.rpgAttributes[id]=Number(savedState.rpgAttributes[id]??0)+Number(delta||0)},
 renderDungeonAttributes:()=>{},renderRpgUniverseEditor:()=>{},saveRpgUniverseStats:()=>{},showToast:()=>{}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext('const DUNGEON_DEFAULT_ATTRIBUTES=[{id:"force",name:"Force"},{id:"agilite",name:"Agilité"},{id:"intelligence",name:"Intelligence"},{id:"esprit",name:"Esprit"},{id:"endurance",name:"Endurance"}];',ctx);
vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'stats API missing');
assert.equal(api.APP_VERSION,'16.78.92');
assert.deepEqual(Array.from(vm.runInContext('DUNGEON_DEFAULT_ATTRIBUTES.map(x=>x.id)',ctx)),[], 'no checked stat => no canonical in-game stat');
const s=profiles[0].rpgUniverse.stats;
s.dynamicDefinitions.push({id:'epuisement',name:'Épuisement',icon:'🥵',defaultValue:2,min:0,max:20,visible:true,description:'Fatigue du héros'});
s.active=['force','epuisement'];
api.syncCanonicalRuntime();
assert.deepEqual(Array.from(vm.runInContext('DUNGEON_DEFAULT_ATTRIBUTES.map(x=>x.id)',ctx)),['force','epuisement'],'checked editor stats must become the canonical Dungeon list');
assert.deepEqual(Array.from(vm.runInContext('DUNGEON_DEFAULT_ATTRIBUTES.map(x=>x.name)',ctx)),['💪 Force','🥵 Épuisement'],'canonical cards must carry configured icons/names');
assert.equal(savedState.rpgAttributes.epuisement,2,'custom stat default must be initialized on the hero state');
assert.equal(ctx.CHARS.hero.dungeonStats.epuisement,2,'custom stat default must be visible to the original Dungeon base-value circuit');
s.active=[];api.syncCanonicalRuntime();
assert.deepEqual(Array.from(vm.runInContext('DUNGEON_DEFAULT_ATTRIBUTES.map(x=>x.id)',ctx)),[],'unchecking all stats must clear the game build');
assert.match(src,/DUNGEON_DEFAULT_ATTRIBUTES/,'module must attach to the existing canonical Dungeon stat list');
assert.doesNotMatch(src,/GensUnifiedStats167885|GensStatsActionsDirect167887|GensRpgStatsEditorActions167888/,'must remain a single clean stats module');
console.log('GenSrpG V16.78.92 canonical stat runtime link: OK');
