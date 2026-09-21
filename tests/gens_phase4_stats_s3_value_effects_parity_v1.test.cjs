const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const rootDir=path.join(__dirname,'..');
const legacyPath=path.join(rootDir,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const normalizationPath=path.join(rootDir,'assets','gensrpg','core','stats-normalization-v1.js');
const enginePath=path.join(rootDir,'assets','gensrpg','core','stats-value-engine-v1.js');

const legacySrc=fs.readFileSync(legacyPath,'utf8');
const normalizationSrc=fs.readFileSync(normalizationPath,'utf8');
const engineSrc=fs.readFileSync(enginePath,'utf8');

const marker='R.GensCleanRpgStats167874={';
assert.ok(legacySrc.includes(marker),'legacy Stats API anchor missing');
const instrumentedLegacy=legacySrc.replace(
  marker,
  'R.__GENS_STATS_S3_INTERNALS={baseValue,effectAmount,statEffectTotal};'+marker
);

const profile={
  id:'dungeon',
  name:'Dungeon',
  gameStyle:'dungeon',
  rpgUniverse:{
    movement:{defaults:{hero:3}},
    stats:{
      active:['strength','chance','defense'],
      dynamicDefinitions:[
        {id:'chance',name:'Chance',icon:'🍀',defaultValue:10,min:0,max:20,visible:true,description:'Custom stat'}
      ],
      dynamicEffects90:[
        {id:'fx_force_to_chance',source:'strength',target:'stat:chance',mode:'step',step:10,gain:2,enabled:true},
        {id:'fx_chance_to_force',source:'chance',target:'stat:force',mode:'step',step:10,gain:1,enabled:true},
        {id:'fx_force_phys',source:'strength',target:'damage:physical',mode:'step',step:10,gain:3,enabled:true},
        {id:'fx_chance_hp',source:'chance',target:'max_hp',mode:'threshold',threshold:14,comparator:'gte',gain:5,enabled:true},
        {id:'fx_force_defense',source:'strength',target:'defense',mode:'step',step:10,gain:2,enabled:true}
      ],
      dynamicRules:[],
      legacyEffectsMigrated94:true,
      nativeCoreMigrated95:true
    }
  }
};

let profiles=[profile];
const state={rpgAttributes:{force:20,chance:10,defense:15}};
const ctx={
  console,Math,Date,JSON,Set,Map,
  current:'hero',
  state,
  CHARS:{hero:{dungeonStats:{force:7,chance:4,defense:8}}},
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
  dungeonEquipmentBonus:(id)=>id==='force'||id==='defense'?2:0,
  dungeonSkillEffectTotal:(kind,_unused,id)=>kind==='attribute'&&id==='force'?1:0,
  dungeonChallengeDebuffTotal067:(id)=>id==='force'?-1:0,
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
  dungeonHeroMoveValue083:()=>3,
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
const legacyInternals=ctx.__GENS_STATS_S3_INTERNALS;
assert.ok(legacy&&legacyInternals,'legacy Stats engine missing');
const normalized=legacy.root(profile);
assert.ok(normalized,'normalized Stats root missing');

const pureCtx={console,Math,JSON,Set,Map};
pureCtx.window=pureCtx;
pureCtx.globalThis=pureCtx;
vm.createContext(pureCtx);
vm.runInContext(normalizationSrc,pureCtx,{filename:'stats-normalization-v1.js'});
vm.runInContext(engineSrc,pureCtx,{filename:'stats-value-engine-v1.js'});
const Core=pureCtx.GensStatsValueEngineV1;
assert.ok(Core,'Core Stats value/effects API missing');

const modifiers=[
  {id:'equipment_force',target:'strength',value:2,source:'equipment'},
  {id:'talent_force',target:'force',value:1,source:'talent'},
  {id:'challenge_force',target:'force',value:-1,source:'challenge'},
  {id:'equipment_defense',target:'defence',value:2,source:'equipment'},
  {id:'disabled_noise',target:'force',value:999,source:'test',enabled:false}
];

const engine=Core.create({
  definitions:legacy.defs(),
  active:normalized.active,
  baseValues:{strength:20,chance:10,defense:15},
  modifiers,
  effects:legacy.effects(),
  directValueTargets:['defense','armor','movement']
});

assert.equal(engine.baseValue('strength'),legacyInternals.baseValue('hero','strength'),'base + modifiers parity');
assert.equal(engine.baseValue('defense'),legacyInternals.baseValue('hero','defense'),'special base + equipment parity');

for(const id of ['force','chance','defense']){
  assert.equal(engine.value(id),legacy.value('hero',id),'canonical value parity for '+id);
}

assert.equal(engine.value('force'),23,'cycle semantics must remain stable');
assert.equal(engine.value('chance'),14,'stat-to-stat step effect must remain stable');
assert.equal(engine.value('defense'),21,'direct value target must be explicit and stable');
assert.equal(engine.modifierTotal('force'),2,'multiple external modifiers must compose additively');

assert.equal(
  engine.extraTotal('damage:physical'),
  legacy.extraTotal('damage:physical','hero'),
  'derived effect total parity'
);
assert.equal(engine.extraTotal('damage:physical'),6,'derived physical contribution');
assert.equal(engine.extraTotal('max_hp'),legacy.extraTotal('max_hp','hero'),'threshold total parity');
assert.equal(engine.extraTotal('max_hp'),5,'threshold contribution');
assert.equal(
  engine.sourceEffectTotal('damage:physical','strength'),
  legacy.sourceEffectTotal('damage:physical','strength','hero'),
  'source-filtered effect parity with alias'
);

const defenseEffect=legacy.effects().find(e=>e.id==='fx_force_defense');
assert.equal(
  engine.effectAmount(defenseEffect),
  legacyInternals.effectAmount(defenseEffect,'hero',new ctx.Set()),
  'single effect amount parity'
);

const detail=engine.detail('force');
assert.equal(detail.id,'force');
assert.equal(detail.active,true);
assert.equal(detail.rawBase,20);
assert.equal(detail.modifierTotal,2);
assert.equal(detail.baseValue,22);
assert.equal(detail.statEffectsTotal,1);
assert.equal(detail.directEffectsTotal,0);
assert.equal(detail.subtotal,23);
assert.equal(detail.total,engine.value('force'));
assert.equal(detail.clamped,false);
assert.equal(detail.modifiers.length,3);
assert.ok(detail.statEffects.some(x=>x.id==='fx_chance_to_force'&&x.contribution===1));

const defenseDetail=engine.detail('defense');
assert.equal(defenseDetail.directEffectsTotal,4);
assert.equal(defenseDetail.total,21);

const clampEngine=Core.create({
  definitions:legacy.defs(),
  active:normalized.active,
  baseValues:{force:20,chance:100,defense:15},
  modifiers,
  effects:legacy.effects(),
  directValueTargets:['defense','armor','movement']
});
state.rpgAttributes.chance=100;
assert.equal(clampEngine.value('chance'),legacy.value('hero','chance'),'final clamp parity');
assert.equal(clampEngine.value('chance'),20);
state.rpgAttributes.chance=10;

assert.equal(engine.value('agilite'),0,'inactive stat must resolve to zero');
assert.equal(engine.value('missing'),0,'unknown stat must resolve to zero');

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','currentRpgProfile','dungeonEquipmentBonus','dungeonSkillEffectTotal',
  'dungeonChallengeDebuffTotal067','Tactical'
]){
  assert.equal(engineSrc.includes(forbidden),false,'S3 Core engine must stay pure: '+forbidden);
}

assert.equal(/\bstate\b/.test(engineSrc),false,'S3 Core engine must not read runtime state');
assert.equal(/inventory|equipment|talent|challenge/i.test(engineSrc),false,'S3 Core engine must stay provider-agnostic');
assert.equal(/armorReduction|hitChance|resistance/i.test(engineSrc),false,'S3 must not own combat resolution formulas');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S3 pure value/effects parity',
  api:'GensStatsValueEngineV1',
  base:true,
  modifiers:true,
  statToStat:true,
  directValueTarget:true,
  derived:true,
  threshold:true,
  cycle:true,
  clamp:true,
  detail:true,
  pure:true
},null,2));
