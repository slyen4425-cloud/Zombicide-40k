const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
let profiles=[{id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[],active:[]}}}];
let rules={physicalDamageStep:10,physicalDamageGain:1,meleeHitStep:10,meleeHitGain:2};
function makeCtx(){
 const ctx={console,Math,Date,JSON,setTimeout:fn=>{if(typeof fn==='function')fn();return 0},clearTimeout:()=>{},
  currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,
  saveGameProfiles:a=>{profiles=JSON.parse(JSON.stringify(a))},activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
  loadDungeonRpgRules:()=>({...rules}),saveDungeonRpgRules:r=>{rules={...r}},isDungeonMode:()=>false,showToast:()=>{}};
 ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167874.js'});return ctx;
}
let ctx=makeCtx(),api=ctx.GensCleanRpgStats167874;
assert.ok(api,'clean stats API missing');
assert.equal(api.APP_VERSION,'16.78.95');
assert.equal(api.addStat(null),true,'new stat must be created without a draft DOM');
assert.ok(profiles[0].rpgUniverse.stats.dynamicDefinitions.some(d=>d.id==='nouvelle_stat'),'new stat must be persisted immediately');
assert.ok(profiles[0].rpgUniverse.stats.active.includes('nouvelle_stat'),'new stat must be active immediately');
assert.equal(api.addEffect(null,'nouvelle_stat'),true,'effect must be created directly on the persisted stat');
assert.equal(profiles[0].rpgUniverse.stats.dynamicEffects90.length,1,'new effect must be persisted immediately');
assert.equal(profiles[0].rpgUniverse.stats.dynamicEffects90[0].source,'nouvelle_stat');
profiles[0].rpgUniverse.stats.dynamicDefinitions.find(d=>d.id==='nouvelle_stat').name='Épuisement';
profiles[0].rpgUniverse.stats.dynamicEffects90[0]={...profiles[0].rpgUniverse.stats.dynamicEffects90[0],mode:'threshold',threshold:10,gain:-1,target:'stat:force'};
ctx=makeCtx();api=ctx.GensCleanRpgStats167874;
assert.equal(api.def('nouvelle_stat').name,'Épuisement','custom stat must survive a complete module reload');
assert.equal(api.effects().length,1,'custom effect must survive a complete module reload');
assert.equal(api.effects()[0].target,'stat:force');
assert.match(api.summaryFor('nouvelle_stat'),/Force|force/,'player summary must explain the target stat');
assert.equal(api.legacyEffects().length,10,'pre-migration historical Dungeon rules must remain discoverable for one-time conversion');
assert.match(src,/data-add-stat/,'editor must own its new-stat button');
assert.match(src,/data-add-effect/,'editor must own per-stat add-effect buttons');
assert.doesNotMatch(src,/GensUnifiedStats167885|GensStatsActionsDirect167887|GensRpgStatsEditorActions167888/,'clean rebuild must not depend on stacked stat patch modules');
console.log('GenSrpG V16.78.95 clean stat rebuild: persistence + reload + effects OK');
