const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const legacy=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const core=read('assets/gensrpg/core/stats-normalization-v1.js');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const graph=read('tests/gens_phase2_runtime_load_graph_v11411.test.cjs');

const CORE_PATH='assets/gensrpg/core/stats-normalization-v1.js';
const LEGACY_PATH='assets/gensrpg/gens-rpg-stats-clean-167874.js';

function ordered(text,a,b,label){
  const ia=text.indexOf(a),ib=text.indexOf(b);
  assert.ok(ia>=0,label+': missing '+a);
  assert.ok(ib>ia,label+': '+a+' must load before '+b);
}

ordered(workflow,CORE_PATH,LEGACY_PATH,'Pages composition');
ordered(preview,CORE_PATH,LEGACY_PATH,'Preview composition');

assert.match(graph,/phase4ConnectedServices=\[[\s\S]*stats-normalization-v1\.js/,'runtime graph must classify Stats normalization as connected');
assert.doesNotMatch(graph,/phase4InertServices=\[[\s\S]*stats-normalization-v1\.js[\s\S]*\]/,'Stats normalization must leave the inert service list');

assert.match(legacy,/const StatsNorm=R\.GensStatsNormalizationV1/,'legacy Stats owner must require Core normalization');
assert.match(legacy,/if\(!StatsNorm\)throw new Error\(/,'missing Core normalization must fail explicitly');
assert.doesNotMatch(legacy,/const ALIAS=/,'legacy Stats owner must not keep a second alias table');
assert.doesNotMatch(legacy,/const slug=v=>/,'legacy Stats owner must not keep slug implementation');
assert.doesNotMatch(legacy,/function normDef\(/,'legacy Stats owner must not keep definition normalizer implementation');
assert.doesNotMatch(legacy,/function targetValid\(/,'legacy Stats owner must not keep target validator implementation');
assert.doesNotMatch(legacy,/function normEffect\(/,'legacy Stats owner must not keep effect normalizer implementation');
assert.doesNotMatch(legacy,/function compare\(/,'legacy Stats owner must not keep compare implementation');
assert.match(legacy,/normalizeDefinition/,'legacy Stats owner must delegate definition normalization');
assert.match(legacy,/normalizeEffect/,'legacy Stats owner must delegate effect normalization');
assert.match(legacy,/isValidTarget/,'legacy Stats owner must delegate target validation');

const missing={console};
missing.window=missing;missing.globalThis=missing;
vm.createContext(missing);
assert.throws(
  ()=>vm.runInContext(legacy,missing,{filename:'gens-rpg-stats-clean-167874.js'}),
  /GensStatsNormalizationV1/,
  'Stats owner must not silently fall back when Core normalization is absent'
);

let profiles=[{
  id:'dungeon',gameStyle:'dungeon',
  rpgUniverse:{stats:{
    active:['strength','chance'],
    dynamicDefinitions:[{id:'chance',name:'Chance',defaultValue:7,min:0,max:20}],
    dynamicEffects90:[{id:'fx',source:'strength',target:'stat:chance',mode:'step',step:10,gain:2,enabled:true}],
    dynamicRules:[],legacyEffectsMigrated94:true,nativeCoreMigrated95:true
  }}
}];
const state={rpgAttributes:{force:20,chance:7}};
const ctx={
  console,Math,Date,JSON,Set,Map,
  current:'hero',state,
  CHARS:{hero:{dungeonStats:{force:10,chance:4}}},
  currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,saveGameProfiles:a=>{profiles=a},
  activeGameProfileId:()=>profiles[0].id,getActiveGameProfileId:()=>profiles[0].id,
  isDungeonMode:()=>true,loadState:()=>state,save:()=>true,saveState:()=>true,
  loadDungeonRpgRules:()=>({}),saveDungeonRpgRules:()=>true,
  dungeonEquipmentBonus:()=>0,dungeonSkillEffectTotal:()=>0,dungeonChallengeDebuffTotal067:()=>0,
  dungeonAttributeValue:()=>0,changeDungeonAttribute:()=>false,
  renderDungeonAttributes:()=>{},renderRpgUniverseEditor:()=>{},saveRpgUniverseStats:()=>{},
  dungeonPhysicalDamageBonus:()=>0,dungeonMagicDamageBonus:()=>0,dungeonEnduranceHpBonus:()=>0,dungeonMaxMana:()=>0,
  dungeonCriticalChance:()=>0,dungeonDodgeChance:()=>0,dungeonMagicResistance:()=>0,
  dungeonDerivedDefense:()=>0,dungeonArmorScore:()=>0,dungeonDerivedInitiative:()=>0,dungeonHeroMoveValue083:()=>3,
  applyDungeonCombatScaling:x=>x,setTimeout:()=>0,clearTimeout:()=>{}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(core,ctx,{filename:'stats-normalization-v1.js'});
vm.runInContext(legacy,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'legacy public Stats API must remain available');
assert.equal(api.canon('strength'),'force');
api.root(profiles[0]);
assert.equal(api.def('chance').defaultValue,7);
assert.equal(api.value('hero','chance'),11,'delegated normalization must preserve canonical value semantics');
assert.equal(api.effects()[0].source,'force');

console.log(JSON.stringify({
  scenario:'Phase 4 Stats normalization authority raccord',
  coreLoadedBeforeStats:true,
  noLocalNormalizationFallback:true,
  publicStatsApiPreserved:true
},null,2));
