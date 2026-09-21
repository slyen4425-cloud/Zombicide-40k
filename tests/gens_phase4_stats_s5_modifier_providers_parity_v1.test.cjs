const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const rootDir=path.join(__dirname,'..');
const legacyPath=path.join(rootDir,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const normalizationPath=path.join(rootDir,'assets','gensrpg','core','stats-normalization-v1.js');
const enginePath=path.join(rootDir,'assets','gensrpg','core','stats-value-engine-v1.js');
const heroValuesPath=path.join(rootDir,'assets','gensrpg','core','stats-hero-values-v1.js');
const providerPath=path.join(rootDir,'assets','gensrpg','core','stats-modifier-provider-v1.js');

const legacySrc=fs.readFileSync(legacyPath,'utf8');
const normalizationSrc=fs.readFileSync(normalizationPath,'utf8');
const engineSrc=fs.readFileSync(enginePath,'utf8');
const heroValuesSrc=fs.readFileSync(heroValuesPath,'utf8');
const providerSrc=fs.readFileSync(providerPath,'utf8');

const marker='R.GensCleanRpgStats167874={';
assert.ok(legacySrc.includes(marker),'legacy Stats API anchor missing');
const instrumentedLegacy=legacySrc.replace(
  marker,
  'R.__GENS_STATS_S5_INTERNALS={baseValue};'+marker
);

const profile={
  id:'dungeon',
  name:'Dungeon',
  gameStyle:'dungeon',
  rpgUniverse:{
    movement:{defaults:{hero:4}},
    stats:{
      active:['strength','chance','defense','armor','movement'],
      dynamicDefinitions:[
        {id:'chance',name:'Chance',icon:'🍀',defaultValue:5,min:0,max:30,visible:true,description:'Custom stat'}
      ],
      dynamicEffects90:[],
      dynamicRules:[],
      legacyEffectsMigrated94:true,
      nativeCoreMigrated95:true
    }
  }
};

let profiles=[profile];
const state={rpgAttributes:{force:20,chance:10,defense:15,armor:6,movement:4}};
const chars={hero:{dungeonStats:{force:7,chance:4,defense:8,armor:1,movement:3}}};

function equipmentBonus(id){
  return ({force:2,defense:2,armor:4,movement:99}[id]||0);
}
function skillEffectTotal(kind,_unused,id){
  if(arguments.length===1)return ({defense:3,armor:1,movement:88}[kind]||0);
  return ({force:1,chance:2,movement:77}[id]||0);
}
function challengeDebuff(id){
  return ({force:-1,chance:-3,defense:-50,movement:-60}[id]||0);
}

const ctx={
  console,Math,Date,JSON,Set,Map,
  current:'hero',
  state,
  CHARS:chars,
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profiles[0],
  getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,
  saveGameProfiles:(next)=>{profiles=next},
  activeGameProfileId:()=>profiles[0].id,
  getActiveGameProfileId:()=>profiles[0].id,
  loadState:()=>state,
  save:()=>true,
  saveState:()=>true,
  loadDungeonRpgRules:()=>({}),
  saveDungeonRpgRules:()=>true,
  dungeonEquipmentBonus:equipmentBonus,
  dungeonSkillEffectTotal:skillEffectTotal,
  dungeonChallengeDebuffTotal067:challengeDebuff,
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
const internals=ctx.__GENS_STATS_S5_INTERNALS;
assert.ok(legacy&&internals,'legacy Stats S5 internals missing');
const normalized=legacy.root(profile);
const definitions=JSON.parse(JSON.stringify(legacy.defs()));

const pureCtx={console,Math,JSON,Set,Map,Object};
pureCtx.window=pureCtx;
pureCtx.globalThis=pureCtx;
vm.createContext(pureCtx);
vm.runInContext(normalizationSrc,pureCtx,{filename:'stats-normalization-v1.js'});
vm.runInContext(engineSrc,pureCtx,{filename:'stats-value-engine-v1.js'});
vm.runInContext(heroValuesSrc,pureCtx,{filename:'stats-hero-values-v1.js'});
vm.runInContext(providerSrc,pureCtx,{filename:'stats-modifier-provider-v1.js'});

const S3=pureCtx.GensStatsValueEngineV1;
const S4=pureCtx.GensStatsHeroValuesV1;
const S5=pureCtx.GensStatsModifierProviderV1;
assert.ok(S3&&S4&&S5,'S3/S4/S5 APIs missing');

const sources=[
  {
    source:'gear_source',
    values:{
      strength:equipmentBonus('force'),
      defence:equipmentBonus('defense'),
      armor:equipmentBonus('armor'),
      unknown_stat:999
    }
  },
  {
    source:'skill_source',
    values:{
      force:skillEffectTotal('attribute',null,'force'),
      chance:skillEffectTotal('attribute',null,'chance'),
      defense:skillEffectTotal('defense'),
      armor:skillEffectTotal('armor'),
      movement:0
    }
  },
  {
    source:'challenge_source',
    values:{
      force:challengeDebuff('force'),
      chance:challengeDebuff('chance')
    }
  },
  {
    source:'disabled_source',
    values:{force:500},
    enabled:false
  },
  {
    source:'invalid_source',
    values:{force:'not-a-number'}
  }
];

const before=JSON.stringify({definitions,sources});
const modifiers=JSON.parse(JSON.stringify(S5.collect({definitions,sources})));
assert.equal(JSON.stringify({definitions,sources}),before,'S5 must not mutate definitions or source inputs');

const heroValues=JSON.parse(JSON.stringify(S4.resolve({
  definitions,
  definitionValues:chars.hero.dungeonStats,
  runtimeValues:state.rpgAttributes,
  fallbackValues:{movement:4},
  clampWithoutRuntime:[]
}).baseValues));

const engine=S3.create({
  definitions,
  active:normalized.active,
  baseValues:heroValues,
  modifiers,
  effects:[],
  directValueTargets:[]
});

for(const id of ['force','chance','defense','armor','movement']){
  assert.equal(
    engine.baseValue(id),
    internals.baseValue('hero',id),
    'S5 modifier parity for '+id
  );
}

assert.equal(engine.baseValue('force'),22,'force = runtime 20 + equipment 2 + talent 1 - challenge 1');
assert.equal(engine.baseValue('chance'),9,'custom stat = runtime 10 + talent 2 - challenge 3');
assert.equal(engine.baseValue('defense'),20,'defense = runtime 15 + equipment 2 + talent 3');
assert.equal(engine.baseValue('armor'),11,'armor = runtime 6 + equipment 4 + talent 1');
assert.equal(engine.baseValue('movement'),4,'movement receives no source that the adapter did not explicitly provide');

assert.deepEqual(
  modifiers.filter(x=>x.target==='force').map(x=>[x.source,x.value,x.enabled]),
  [
    ['gear_source',2,true],
    ['skill_source',1,true],
    ['challenge_source',-1,true],
    ['disabled_source',500,false]
  ],
  'source order and enabled state must be deterministic'
);

assert.ok(modifiers.some(x=>x.target==='defense'&&x.source==='gear_source'&&x.value===2),'defence alias must canonicalize');
assert.equal(modifiers.some(x=>x.target==='unknown_stat'),false,'unknown definition target must be ignored');
assert.equal(modifiers.some(x=>x.source==='invalid_source'),false,'non-finite provider value must be ignored');
assert.equal(modifiers.some(x=>x.target==='movement'),false,'zero totals must not create noise rows');

const aliasSum=JSON.parse(JSON.stringify(S5.collect({
  definitions,
  sources:[{source:'alias_source',values:{strength:2,force:3}}]
})));
assert.deepEqual(
  aliasSum.map(x=>[x.target,x.value]),
  [['force',5]],
  'aliases from one source must merge additively on the canonical target'
);

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','state','currentRpgProfile','getActiveGameProfile',
  'dungeonEquipmentBonus','dungeonSkillEffectTotal','dungeonChallengeDebuffTotal067',
  'Tactical'
]){
  assert.equal(providerSrc.includes(forbidden),false,'S5 Core provider must stay pure: '+forbidden);
}

assert.equal(/equipment|talent|challenge/i.test(providerSrc),false,'S5 Core must stay source-agnostic');
assert.equal(/\bdefense\b|\barmor\b|\bmovement\b/.test(providerSrc),false,'S5 Core must not hardcode special stat IDs');
assert.equal(/hitChance|D100|resistance|damageFinal/i.test(providerSrc),false,'S5 must not own S6/combat formulas');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S5 external modifier provider parity',
  api:'GensStatsModifierProviderV1',
  equipmentSeam:true,
  talentSeam:true,
  challengeSeam:true,
  aliases:true,
  disabled:true,
  immutable:true,
  sourceAgnostic:true,
  pure:true
},null,2));
