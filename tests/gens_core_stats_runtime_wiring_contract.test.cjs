const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const legacySource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const adapterSource=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-runtime-adapter.js'),'utf8');
const bootstrapSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-mobile-combat-performance-16781022.js'),'utf8');
const Core=require(path.join(root,'assets','gensrpg','core','stats.js'));

let evaluatorBuilds=0;
const CoreProbe={...Core,createEvaluator(options){evaluatorBuilds++;return Core.createEvaluator(options)}};
const state={rpgAttributes:{force:17,defense:4,armor:2,movement:4}};
const profile={
  id:'dungeon_profile',gameStyle:'dungeon',
  rpgUniverse:{
    movement:{defaults:{hero:3}},
    stats:{
      active:['force','defense','armor','movement'],
      dynamicDefinitions:[],
      dynamicEffects90:[
        {id:'force_defense',source:'force',target:'stat:defense',mode:'step',step:10,gain:2,enabled:true},
        {id:'force_damage',source:'force',target:'damage:physical',mode:'step',step:5,gain:3,enabled:true},
      ],
      legacyEffectsMigrated94:true,
      nativeCoreMigrated95:true,
    },
  },
};
const ctx={
  console,
  globalThis:null,
  GensRpgCoreStats:CoreProbe,
  current:'hero',state,
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profile,
  getActiveGameProfile:()=>profile,
  loadGameProfiles:()=>[profile],saveGameProfiles:()=>true,
  loadState:id=>id==='hero'?state:{},
  CHARS:{hero:{id:'hero',dungeonStats:{force:10,defense:4,armor:2,movement:3}}},
  dungeonEquipmentBonus:id=>id==='force'?2:id==='defense'?3:0,
  dungeonSkillEffectTotal:(kind,_unused,id)=>kind==='attribute'&&id==='force'?1:kind==='defense'?2:0,
  dungeonChallengeDebuffTotal067:id=>id==='force'?-1:0,
  loadDungeonRpgRules:()=>({critCap:50,dodgeCap:40}),
  dungeonAttributeValue:()=>999,
  dungeonPhysicalDamageBonus:()=>1,
  dungeonMagicDamageBonus:()=>0,
  dungeonEnduranceHpBonus:()=>0,
  dungeonMaxMana:()=>0,
  dungeonCriticalChance:()=>0,
  dungeonDodgeChance:()=>0,
  dungeonMagicResistance:()=>0,
  dungeonDerivedDefense:()=>0,
  dungeonArmorScore:()=>0,
  dungeonDerivedInitiative:()=>0,
  dungeonHeroMoveValue083:()=>3,
  applyDungeonCombatScaling:(_it,st)=>({...st}),
  setTimeout:fn=>{fn();return 1},clearTimeout:()=>{},
};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(legacySource,ctx,{filename:'gens-rpg-stats-clean-167874.js'});

const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'legacy stats editor/migration owner must still expose its API');
assert.equal(api.APP_VERSION,'16.78.114.7');
api.installRuntime();

vm.runInContext(adapterSource,ctx,{filename:'core/stats-runtime-adapter.js'});
const adapter=ctx.GensRpgCoreStatsRuntimeAdapter;
assert.ok(adapter,'Core Stats runtime adapter must install');
assert.equal(adapter.VERSION,'1.1.0');
assert.equal(adapter.status(ctx).installed,true,'Core Stats adapter must become the canonical runtime calculation owner');

assert.equal(api.value('hero','force'),19,'effective Force must preserve equipment/skill/debuff contributions');
assert.equal(api.value('hero','defense'),11,'configured Force -> Defense effect must preserve the existing runtime result');
assert.equal(api.extraTotal('damage:physical','hero'),9,'arbitrary configured non-stat targets must be evaluated through Core Stats');
assert.equal(ctx.dungeonAttributeValue('force'),19,'global Dungeon stat reads must delegate to Core Stats');
assert.equal(ctx.dungeonDerivedDefense(),11,'global Defense reads must delegate to Core Stats');
assert.equal(ctx.dungeonArmorScore(),2,'global Armor reads must delegate to Core Stats');
assert.equal(ctx.dungeonHeroMoveValue083('hero'),4,'global Movement reads must delegate to Core Stats');
assert.equal(ctx.dungeonPhysicalDamageBonus(),10,'legacy base physical damage plus configured Core effect must be preserved without double counting');
assert.ok(evaluatorBuilds>=7,'canonical runtime calculations must delegate repeatedly to GensRpgCoreStats instead of duplicating generic math');

const statsPath='assets/gensrpg/core/stats.js';
const adapterPath='assets/gensrpg/core/stats-runtime-adapter.js';
const tacticalPath='assets/gensrpg/gens-rpg-tactical-combat-v2.js';
assert.equal((bootstrapSource.match(/assets\/gensrpg\/core\/stats\.js/g)||[]).length,1,'browser bootstrap must have one Core Stats owner');
assert.equal((bootstrapSource.match(/assets\/gensrpg\/core\/stats-runtime-adapter\.js/g)||[]).length,1,'browser bootstrap must have one Core Stats runtime adapter owner');
assert.ok(bootstrapSource.indexOf(statsPath)<bootstrapSource.indexOf(adapterPath),'pure Core Stats must load before its runtime adapter');
assert.ok(bootstrapSource.indexOf(adapterPath)<bootstrapSource.indexOf(tacticalPath),'Core Stats runtime adapter must be available before Tactical');
assert.ok(adapterSource.includes('GensRpgCoreStats'),'runtime adapter must use the Core Stats API');

console.log('GenSrpG Core Stats canonical runtime + browser delegation contract OK');
