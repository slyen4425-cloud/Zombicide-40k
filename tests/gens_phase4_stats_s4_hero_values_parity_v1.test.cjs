const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const rootDir=path.join(__dirname,'..');
const legacyPath=path.join(rootDir,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const normalizationPath=path.join(rootDir,'assets','gensrpg','core','stats-normalization-v1.js');
const providerPath=path.join(rootDir,'assets','gensrpg','core','stats-hero-values-v1.js');

const legacySrc=fs.readFileSync(legacyPath,'utf8');
const normalizationSrc=fs.readFileSync(normalizationPath,'utf8');
const providerSrc=fs.readFileSync(providerPath,'utf8');

const marker='R.GensCleanRpgStats167874={';
assert.ok(legacySrc.includes(marker),'legacy Stats API anchor missing');
const instrumentedLegacy=legacySrc.replace(
  marker,
  'R.__GENS_STATS_S4_INTERNALS={specialRaw,customBase};'+marker
);

const profile={
  id:'dungeon',
  name:'Dungeon',
  gameStyle:'dungeon',
  rpgUniverse:{
    movement:{defaults:{hero:4}},
    stats:{
      active:['strength','movement','chance'],
      dynamicDefinitions:[
        {id:'chance',name:'Chance',icon:'🍀',defaultValue:5,min:0,max:20,visible:true,description:'Custom stat'}
      ],
      dynamicEffects90:[],
      dynamicRules:[],
      legacyEffectsMigrated94:true,
      nativeCoreMigrated95:true
    }
  }
};

const states={
  hero_active:{rpgAttributes:{force:18,movement:7,chance:12}},
  hero_missing:{rpgAttributes:{}}
};

const chars={
  hero_active:{dungeonStats:{force:11,movement:6,chance:4}},
  hero_missing:{dungeonStats:{force:13,movement:6,chance:25}},
  hero_no_runtime:{dungeonStats:{force:16,movement:150,chance:25}},
  hero_fallback:{dungeonStats:{}},
  hero_default:{dungeonStats:{}}
};

let profiles=[profile];
const ctx={
  console,Math,Date,JSON,Set,Map,
  current:'hero_active',
  state:states.hero_active,
  CHARS:chars,
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profiles[0],
  getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,
  saveGameProfiles:(next)=>{profiles=next},
  activeGameProfileId:()=>profiles[0].id,
  getActiveGameProfileId:()=>profiles[0].id,
  loadState:(id)=>states[id]||null,
  save:()=>true,
  saveState:()=>true,
  loadDungeonRpgRules:()=>({}),
  saveDungeonRpgRules:()=>true,
  renderDungeonAttributes:()=>{},
  renderRpgUniverseEditor:()=>{},
  saveRpgUniverseStats:()=>{},
  dungeonAttributeValue:()=>0,
  changeDungeonAttribute:()=>false,
  dungeonPhysicalDamageBonus:()=>0,
  dungeonMagicDamageBonus:()=>0,
  dungeonEnduranceHpBonus:()=>0,
  dungeonMaxMana:()=>0,
  dungeonCriticalChance:()=>0,
  dungeonDodgeChance:()=>0,
  dungeonMagicResistance:()=>0,
  dungeonDerivedDefense:()=>0,
  dungeonArmorScore:()=>0,
  dungeonDerivedInitiative:()=>0,
  dungeonHeroMoveValue083:()=>4,
  applyDungeonCombatScaling:x=>x,
  setTimeout:()=>0,
  clearTimeout:()=>{}
};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(normalizationSrc,ctx,{filename:'stats-normalization-v1.js'});
vm.runInContext(instrumentedLegacy,ctx,{filename:'gens-rpg-stats-clean-167874.js'});

const legacy=ctx.GensCleanRpgStats167874;
const internals=ctx.__GENS_STATS_S4_INTERNALS;
assert.ok(legacy&&internals,'legacy Stats S4 internals missing');
legacy.root(profile);

const definitions=JSON.parse(JSON.stringify(legacy.defs()));

const pureCtx={console,Math,JSON,Set,Map,Object};
pureCtx.window=pureCtx;
pureCtx.globalThis=pureCtx;
vm.createContext(pureCtx);
vm.runInContext(normalizationSrc,pureCtx,{filename:'stats-normalization-v1.js'});
vm.runInContext(providerSrc,pureCtx,{filename:'stats-hero-values-v1.js'});
const Core=pureCtx.GensStatsHeroValuesV1;
assert.ok(Core&&typeof Core.resolve==='function','Core Stats hero values API missing');

function plain(value){
  return JSON.parse(JSON.stringify(value));
}

function resolve(config){
  return plain(Core.resolve(config));
}

const activeConfig={
  definitions,
  definitionValues:{strength:11,move:6,chance:4},
  runtimeValues:{strength:18,move:7,chance:12},
  fallbackValues:{movement:4},
  clampWithoutRuntime:['movement']
};
const active=resolve(activeConfig);
assert.equal(active.baseValues.force,internals.customBase('hero_active','force'),'active runtime force parity');
assert.equal(active.baseValues.movement,internals.specialRaw('hero_active','movement'),'active runtime movement parity');
assert.equal(active.baseValues.chance,internals.customBase('hero_active','chance'),'active runtime custom stat parity');
assert.equal(active.baseValues.force,18,'strength alias must feed canonical force');
assert.equal(active.baseValues.movement,7,'move alias must feed canonical movement');
assert.equal(active.details.force.source,'runtime');
assert.equal(active.details.force.inputKey,'strength');
assert.equal(active.details.force.runtimeContainer,true);
assert.equal(active.details.force.clampApplied,true);
assert.equal(active.details.force.clamped,false);

const missingConfig={
  definitions,
  definitionValues:{force:13,movement:6,chance:25},
  runtimeValues:{},
  fallbackValues:{movement:4},
  clampWithoutRuntime:['movement']
};
const missing=resolve(missingConfig);
assert.equal(missing.baseValues.movement,internals.specialRaw('hero_missing','movement'),'missing runtime movement must fall back to hero definition');
assert.equal(missing.baseValues.chance,internals.customBase('hero_missing','chance'),'missing runtime custom value parity');
assert.equal(missing.baseValues.movement,6);
assert.equal(missing.baseValues.chance,20,'runtime container means fallback definition is still clamped');
assert.equal(missing.details.chance.source,'definition');
assert.equal(missing.details.chance.runtimeContainer,true);
assert.equal(missing.details.chance.clampApplied,true);
assert.equal(missing.details.chance.clamped,true);
assert.equal(missing.details.chance.rawValue,25);

const noRuntimeConfig={
  definitions,
  definitionValues:{force:16,movement:150,chance:25},
  runtimeValues:null,
  fallbackValues:{movement:4},
  clampWithoutRuntime:['movement']
};
const noRuntime=resolve(noRuntimeConfig);
assert.equal(noRuntime.baseValues.chance,internals.customBase('hero_no_runtime','chance'),'no-runtime custom stat parity');
assert.equal(noRuntime.baseValues.movement,internals.specialRaw('hero_no_runtime','movement'),'no-runtime native-like clamp parity');
assert.equal(noRuntime.baseValues.chance,25,'custom stat must preserve historical no-runtime non-clamp');
assert.equal(noRuntime.baseValues.movement,99,'explicit clampWithoutRuntime must preserve historical special clamp');
assert.equal(noRuntime.details.chance.clampApplied,false);
assert.equal(noRuntime.details.chance.clamped,false);
assert.equal(noRuntime.details.movement.clampApplied,true);
assert.equal(noRuntime.details.movement.clamped,true);

const fallback=resolve({
  definitions,
  definitionValues:{},
  runtimeValues:null,
  fallbackValues:{move:4},
  clampWithoutRuntime:['movement']
});
assert.equal(fallback.baseValues.movement,internals.specialRaw('hero_fallback','movement'),'explicit movement fallback parity');
assert.equal(fallback.baseValues.movement,4);
assert.equal(fallback.details.movement.source,'fallback');
assert.equal(fallback.details.movement.inputKey,'move');

const defaults=resolve({
  definitions,
  definitionValues:{},
  runtimeValues:null,
  fallbackValues:{},
  clampWithoutRuntime:[]
});
assert.equal(defaults.baseValues.chance,internals.customBase('hero_default','chance'),'defaultValue fallback parity');
assert.equal(defaults.baseValues.chance,5);
assert.equal(defaults.details.chance.source,'default');
assert.equal(defaults.details.chance.inputKey,null);

const customClamp=resolve({
  definitions,
  definitionValues:{chance:25},
  runtimeValues:null,
  fallbackValues:{},
  clampWithoutRuntime:['chance']
});
assert.equal(customClamp.baseValues.chance,20,'clampWithoutRuntime must be data-driven for arbitrary custom stats');
assert.equal(customClamp.details.chance.clamped,true);

const immutableConfig={
  definitions:plain(definitions),
  definitionValues:{strength:11,chance:25},
  runtimeValues:{strength:18},
  fallbackValues:{move:4},
  clampWithoutRuntime:['movement']
};
const immutableBefore=JSON.stringify(immutableConfig);
Core.resolve(immutableConfig);
assert.equal(JSON.stringify(immutableConfig),immutableBefore,'S4 provider must not mutate any input');

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','currentRpgProfile','getActiveGameProfile','loadState',
  'dungeonEquipmentBonus','dungeonSkillEffectTotal','dungeonChallengeDebuffTotal067',
  'Tactical'
]){
  assert.equal(providerSrc.includes(forbidden),false,'S4 Core provider must stay pure: '+forbidden);
}

assert.equal(/\bdefense\b|\barmor\b|\bmovement\b/.test(providerSrc),false,'S4 must not hardcode historical special stat IDs');
assert.equal(/equipment|talent|challenge/i.test(providerSrc),false,'S4 must not absorb S5 modifier providers');
assert.equal(/hitChance|D100|resistance|damageFinal/i.test(providerSrc),false,'S4 must not own combat formulas');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S4 hero values parity',
  api:'GensStatsHeroValuesV1',
  activeRuntime:true,
  aliases:true,
  runtimeMissing:true,
  noRuntime:true,
  explicitClampWithoutRuntime:true,
  fallback:true,
  defaults:true,
  provenance:true,
  immutable:true,
  pure:true
},null,2));
