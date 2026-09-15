const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
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
  loadDungeonRpgRules:()=>({}),
};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'gens-rpg-stats-clean-167874.js'});

const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'legacy canonical stats adapter must still expose its API');
assert.equal(api.APP_VERSION,'16.78.114.7');

assert.equal(api.value('hero','force'),19,'effective Force must preserve equipment/skill/debuff contributions');
assert.equal(api.value('hero','defense'),11,'configured Force -> Defense effect must preserve the existing runtime result');
assert.equal(api.extraTotal('damage:physical','hero'),9,'arbitrary configured non-stat targets must be evaluated through Core Stats');
assert.ok(evaluatorBuilds>=3,'canonical runtime calculations must delegate to GensRpgCoreStats instead of duplicating generic math');

assert.ok(source.includes('assets/gensrpg/core/stats.js'),'canonical stats adapter must explicitly load the Core Stats module in browser runtime');
assert.ok(source.includes('GensRpgCoreStats'),'canonical stats adapter must use the Core Stats API');

console.log('GenSrpG Core Stats canonical runtime delegation contract OK');
