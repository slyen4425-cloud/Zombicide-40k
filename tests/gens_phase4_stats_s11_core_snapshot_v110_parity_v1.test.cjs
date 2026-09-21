const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const normSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-normalization-v1.js'),'utf8');
const s3Src=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-value-engine-v1.js'),'utf8');
const s4Src=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-hero-values-v1.js'),'utf8');
const s5Src=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-modifier-provider-v1.js'),'utf8');
const s6Src=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-derived-values-v1.js'),'utf8');
const s7Src=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-snapshot-v1.js'),'utf8');
const cleanSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const V110=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));

function extractFunction(name){
  const token='function '+name+'(';
  const start=index.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const brace=index.indexOf('{',start);
  assert.ok(brace>start,'missing body '+name);
  let depth=0,quote=null,escaped=false,lineComment=false,blockComment=false;
  for(let i=brace;i<index.length;i++){
    const c=index[i],next=index[i+1]||'';
    if(lineComment){if(c==='\n')lineComment=false;continue}
    if(blockComment){if(c==='*'&&next==='/'){blockComment=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&next==='/'){lineComment=true;i++;continue}
    if(c==='/'&&next==='*'){blockComment=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const rules={
  physicalDamageFormula:'step',physicalDamageStep:10,physicalDamageGain:2,
  magicDamageFormula:'step',magicDamageStep:8,magicDamageGain:3,
  hpFormula:'step',hpPercentPerPoint:0,enduranceHpStep:5,hpGain:4,
  manaFormula:'step',manaPercentPerPoint:0,baseMana:10,spiritManaStep:4,manaGain:5,
  critFormula:'step',critPercentPerPoint:0,baseCrit:5,agilityCritStep:3,critGain:4,critCap:60,
  dodgeFormula:'step',dodgePercentPerPoint:0,baseDodge:2,agilityDodgeStep:4,dodgeGain:3,dodgeCap:50,
  magicResistFormula:'step',magicResistPerPoint:0,spiritMagicResistStep:5,magicResistGain:2,
  critMultiplier:2
};

const profile={
  id:'dungeon',name:'Dungeon',gameStyle:'dungeon',
  rpgUniverse:{
    movement:{defaults:{hero:4}},
    stats:{
      active:['force','agilite','intelligence','esprit','endurance','initiative','defense','armor','movement'],
      dynamicDefinitions:[],
      dynamicEffects90:[
        {id:'stat_force',source:'force',target:'stat:force',mode:'step',step:10,gain:1,enabled:true},
        {id:'phys_fx',source:'force',target:'damage:physical',mode:'step',step:10,gain:1,enabled:true},
        {id:'melee_fx',source:'force',target:'damage:melee',mode:'step',step:20,gain:2,enabled:true},
        {id:'magic_fx',source:'intelligence',target:'damage:magic',mode:'step',step:10,gain:2,enabled:true},
        {id:'mana_fx',source:'esprit',target:'max_mana',mode:'step',step:5,gain:2,enabled:true},
        {id:'crit_fx',source:'agilite',target:'crit',mode:'step',step:10,gain:3,enabled:true},
        {id:'dodge_fx',source:'agilite',target:'dodge',mode:'step',step:10,gain:2,enabled:true},
        {id:'magic_res_fx',source:'esprit',target:'magic_resistance',mode:'step',step:5,gain:1,enabled:true},
        {id:'initiative_fx',source:'agilite',target:'initiative',mode:'step',step:10,gain:7,enabled:true}
      ],
      dynamicRules:[],
      legacyEffectsMigrated94:true,
      nativeCoreMigrated95:true
    }
  }
};

const state={
  rpgAttributes:{
    force:20,agilite:20,intelligence:16,esprit:11,endurance:12,
    initiative:13,defense:8,armor:4,movement:5
  },
  mana:9,wounds:2,
  elementResistances:{fire:25}
};
const heroDef={
  name:'Hero',maxHp:20,
  dungeonStats:{
    force:11,agilite:10,intelligence:10,esprit:10,endurance:10,
    initiative:9,defense:6,armor:2,movement:4
  }
};

const equipment={
  force:2,defense:2,armor:3,
  mana:2,crit:1,dodge:1,magicDefense:3
};
function equipmentBonus(id){return Number(equipment[id]||0)}
function skillEffectTotal(kind,_unused,id){
  if(arguments.length===1)return Number(({defense:1,armor:1,mana:1,crit:2,dodge:0,magicDefense:1}[kind])||0);
  return Number(({force:1,agilite:1,intelligence:0,esprit:0,endurance:0,initiative:0}[id])||0);
}
function challengeDebuff(id){
  return Number(({force:-1,agilite:-2}[id])||0);
}

let profiles=[profile];
const legacyCtx={
  console,Math,Number,Date,JSON,Set,Map,
  current:'hero',state,
  CHARS:{hero:heroDef},
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profiles[0],
  getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,
  saveGameProfiles:next=>{profiles=next},
  activeGameProfileId:()=>profile.id,
  getActiveGameProfileId:()=>profile.id,
  loadState:id=>id==='hero'?state:null,
  save:()=>true,saveState:()=>true,
  loadDungeonRpgRules:()=>rules,
  saveDungeonRpgRules:()=>true,
  dungeonEquipmentBonus:equipmentBonus,
  dungeonSkillEffectTotal:skillEffectTotal,
  dungeonChallengeDebuffTotal067:challengeDebuff,
  effectiveMaxWounds:()=>20,
  dungeonHeroMoveValue083:()=>5,
  dungeonDerivedDefense:()=>8,
  dungeonArmorScore:()=>4,
  renderDungeonAttributes:()=>{},
  renderRpgUniverseEditor:()=>{},
  saveRpgUniverseStats:()=>{},
  dungeonAttributeValue:id=>Number(state.rpgAttributes[id]||0),
  changeDungeonAttribute:()=>false,
  applyDungeonCombatScaling:x=>x,
  openHeroCreator:()=>{},
  hcRenderRpgStatsUsage:()=>{},
  saveCustomHero:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{}
};
legacyCtx.window=legacyCtx;
legacyCtx.globalThis=legacyCtx;
vm.createContext(legacyCtx);
vm.runInContext(normSrc,legacyCtx,{filename:'stats-normalization-v1.js'});
for(const name of [
  'dungeonPhysicalDamageBonus','dungeonMagicDamageBonus','dungeonEnduranceHpBonus',
  'dungeonMaxMana','dungeonCriticalChance','dungeonDodgeChance',
  'dungeonDerivedInitiative','dungeonMagicResistance'
]){
  vm.runInContext(extractFunction(name),legacyCtx,{filename:'index#'+name});
}
vm.runInContext(cleanSrc,legacyCtx,{filename:'gens-rpg-stats-clean-167874.js'});
const Clean=legacyCtx.GensCleanRpgStats167874;
assert.ok(Clean&&Clean.install(),'historical clean Stats owner must install');

const derivedNames=[
  'dungeonPhysicalDamageBonus','dungeonMagicDamageBonus','dungeonMaxMana',
  'dungeonCriticalChance','dungeonDodgeChance','dungeonMagicResistance',
  'dungeonDerivedInitiative'
];
const calls=Object.fromEntries(derivedNames.map(name=>[name,0]));
for(const name of derivedNames){
  const original=legacyCtx[name];
  legacyCtx[name]=function(){calls[name]++;return original.apply(this,arguments)};
}

V110.resetMetrics();
const actor={id:'hero',side:'hero',hp:18,maxHp:20,movement:5,initiative:13,defense:8,armor:4,dodge:0,meta:{heroId:'hero'}};
const historical=V110.buildHeroSnapshot(legacyCtx,'hero',actor);
assert.ok(historical,'V110 historical snapshot missing');

const coreCtx={console,Math,Number,JSON,Set,Map,Object};
coreCtx.window=coreCtx;
coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
for(const [filename,src] of [
  ['stats-normalization-v1.js',normSrc],
  ['stats-value-engine-v1.js',s3Src],
  ['stats-hero-values-v1.js',s4Src],
  ['stats-modifier-provider-v1.js',s5Src],
  ['stats-derived-values-v1.js',s6Src],
  ['stats-snapshot-v1.js',s7Src]
])vm.runInContext(src,coreCtx,{filename});

const S3=coreCtx.GensStatsValueEngineV1;
const S4=coreCtx.GensStatsHeroValuesV1;
const S5=coreCtx.GensStatsModifierProviderV1;
const S6=coreCtx.GensStatsDerivedValuesV1;
const S7=coreCtx.GensStatsSnapshotV1;
assert.ok(S3&&S4&&S5&&S6&&S7,'Core S3-S7 APIs missing');

const plain=v=>JSON.parse(JSON.stringify(v));
const definitions=plain(Clean.runtimeDefs());
const effects=plain(Clean.effects());
const active=plain(profile.rpgUniverse.stats.active);

const base=plain(S4.resolve({
  definitions,
  definitionValues:heroDef.dungeonStats,
  runtimeValues:state.rpgAttributes,
  fallbackValues:{movement:4},
  clampWithoutRuntime:['movement']
}).baseValues);

const modifiers=plain(S5.collect({
  definitions,
  sources:[
    {source:'equipment',values:{
      force:equipmentBonus('force'),agilite:equipmentBonus('agilite'),
      intelligence:equipmentBonus('intelligence'),esprit:equipmentBonus('esprit'),
      endurance:equipmentBonus('endurance'),initiative:equipmentBonus('initiative'),
      defense:equipmentBonus('defense'),armor:equipmentBonus('armor')
    }},
    {source:'skills',values:{
      force:skillEffectTotal('attribute',null,'force'),
      agilite:skillEffectTotal('attribute',null,'agilite'),
      intelligence:skillEffectTotal('attribute',null,'intelligence'),
      esprit:skillEffectTotal('attribute',null,'esprit'),
      endurance:skillEffectTotal('attribute',null,'endurance'),
      initiative:skillEffectTotal('attribute',null,'initiative'),
      defense:skillEffectTotal('defense'),armor:skillEffectTotal('armor')
    }},
    {source:'challenge',values:{
      force:challengeDebuff('force'),agilite:challengeDebuff('agilite'),
      intelligence:challengeDebuff('intelligence'),esprit:challengeDebuff('esprit'),
      endurance:challengeDebuff('endurance'),initiative:challengeDebuff('initiative')
    }}
  ]
}));

const engine=S3.create({
  definitions,active,baseValues:base,modifiers,effects,
  directValueTargets:['defense','armor','movement']
});
const values={};
for(const d of definitions)values[d.id]=engine.value(d.id);

const external={
  mana:equipmentBonus('mana')+skillEffectTotal('mana'),
  crit:equipmentBonus('crit')+skillEffectTotal('crit'),
  dodge:equipmentBonus('dodge')+skillEffectTotal('dodge'),
  magicDefense:equipmentBonus('magicDefense')+skillEffectTotal('magicDefense')
};
const effectTotals={};
for(const target of ['damage:physical','damage:melee','damage:magic','max_hp','max_mana','crit','dodge','initiative','magic_resistance']){
  effectTotals[target]=engine.extraTotal(target);
}
const derived=plain(S6.derive({
  values,rules,baseHp:20,external,effects:effectTotals
}));
const core=plain(S7.create({heroId:'hero',definitions,values,derived}));

assert.deepEqual(core.canonical,historical.canonical,'Core S7 canonical rows must match V110 historical owner');
assert.deepEqual(core.values,historical.values,'Core S7 canonical values must match V110 historical owner');

for(const key of ['physicalDamageBonus','magicDamageBonus','maxMana','crit','dodge','magicResistance']){
  assert.equal(
    core.derived[key],
    historical.derived[key],
    'S11 raccord candidate parity: '+key
  );
}

assert.equal(
  core.derived.initiative,
  historical.derived.initiative+14,
  'Core initiative intentionally includes target initiative effect that V110 currently ignores when canonical initiative exists'
);
assert.equal(historical.derived.initiative,historical.values.initiative,'V110 must keep canonical initiative semantics before dedicated migration');

for(const name of ['dungeonPhysicalDamageBonus','dungeonMagicDamageBonus','dungeonMaxMana','dungeonCriticalChance','dungeonDodgeChance','dungeonMagicResistance']){
  assert.equal(calls[name],1,'V110 must currently perform one redundant Dungeon derived read: '+name);
}
assert.equal(calls.dungeonDerivedInitiative,1,'V110 currently evaluates the initiative fallback even though canonical initiative wins');

assert.equal(historical.derived.hp,18);
assert.equal(historical.derived.maxHp,20);
assert.equal(historical.derived.mana,9);
assert.equal(historical.resistances.fire,25);
assert.equal(historical.rules.criticalMultiplier,2);
assert.equal(Object.prototype.hasOwnProperty.call(core.derived,'hp'),false,'Core S7 must not absorb session HP');
assert.equal(Object.prototype.hasOwnProperty.call(core.derived,'mana'),false,'Core S7 must not absorb session mana');
assert.equal(Object.prototype.hasOwnProperty.call(core,'resistances'),false,'Core S7 must not absorb resistance session envelope');
assert.equal(Object.prototype.hasOwnProperty.call(core,'rules'),false,'Core S7 must not absorb combat rules envelope');

console.log(JSON.stringify({
  scenario:'Phase 4 S11 Core Snapshot vs V110 historical parity',
  canonicalParity:true,
  valuesParity:true,
  derivedParity:[
    'physicalDamageBonus','magicDamageBonus','maxMana','crit','dodge','magicResistance'
  ],
  redundantDungeonReads:Object.fromEntries(Object.entries(calls).filter(([k])=>k!=='dungeonDerivedInitiative')),
  initiative:{
    v110:historical.derived.initiative,
    core:core.derived.initiative,
    extraTargetEffect:14,
    migrationDeferred:true
  },
  sessionEnvelopeStaysV110:true,
  gameplayChanged:false
},null,2));
