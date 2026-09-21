const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const normalizationPath=path.join(root,'assets','gensrpg','core','stats-normalization-v1.js');
const derivedPath=path.join(root,'assets','gensrpg','core','stats-derived-values-v1.js');
const normalizationSrc=fs.readFileSync(normalizationPath,'utf8');
const derivedSrc=fs.readFileSync(derivedPath,'utf8');

function extractFunction(name){
  const token='function '+name+'(';
  const start=index.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const brace=index.indexOf('{',start);
  assert.ok(brace>start,'missing body for '+name);
  let depth=0,quote=null,escaped=false,lineComment=false,blockComment=false;
  for(let i=brace;i<index.length;i++){
    const c=index[i],next=index[i+1]||'';
    if(lineComment){
      if(c==='\n')lineComment=false;
      continue;
    }
    if(blockComment){
      if(c==='*'&&next==='/'){blockComment=false;i++}
      continue;
    }
    if(quote){
      if(escaped)escaped=false;
      else if(c==='\\')escaped=true;
      else if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&next==='/'){lineComment=true;i++;continue}
    if(c==='/'&&next==='*'){blockComment=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'){
      depth--;
      if(depth===0)return index.slice(start,i+1);
    }
  }
  throw new Error('unterminated inline owner '+name);
}

const legacyNames=[
  'dungeonPhysicalDamageBonus',
  'dungeonMagicDamageBonus',
  'dungeonMaxMana',
  'dungeonCriticalChance',
  'dungeonDodgeChance',
  'dungeonDerivedInitiative',
  'dungeonEnduranceHpBonus',
  'dungeonMagicResistance'
];

const legacyCtx={
  console,Math,Number,
  __rules:{},
  __values:{},
  __equipment:{},
  __skills:{},
  current:'hero',
  state:{maxWounds:3},
  CHARS:{hero:{maxHp:3}}
};
legacyCtx.loadDungeonRpgRules=()=>legacyCtx.__rules;
legacyCtx.dungeonAttributeValue=id=>Number(legacyCtx.__values[id]||0);
legacyCtx.dungeonEquipmentBonus=id=>Number(legacyCtx.__equipment[id]||0);
legacyCtx.dungeonSkillEffectTotal=id=>Number(legacyCtx.__skills[id]||0);
legacyCtx.window=legacyCtx;
legacyCtx.globalThis=legacyCtx;
vm.createContext(legacyCtx);
vm.runInContext(legacyNames.map(extractFunction).join('\n'),legacyCtx,{filename:'index-s6-derived-owners.js'});

const pureCtx={console,Math,Number,JSON,Set,Map,Object};
pureCtx.window=pureCtx;
pureCtx.globalThis=pureCtx;
vm.createContext(pureCtx);
vm.runInContext(normalizationSrc,pureCtx,{filename:'stats-normalization-v1.js'});
vm.runInContext(derivedSrc,pureCtx,{filename:'stats-derived-values-v1.js'});
const Core=pureCtx.GensStatsDerivedValuesV1;
assert.ok(Core&&typeof Core.derive==='function','Core Stats S6 derived API missing');

const baseRules={
  physicalDamageFormula:'step',physicalDamageStep:10,physicalDamageGain:2,
  magicDamageFormula:'step',magicDamageStep:8,magicDamageGain:3,
  hpFormula:'step',hpPercentPerPoint:0,enduranceHpStep:5,hpGain:4,
  manaFormula:'step',manaPercentPerPoint:0,baseMana:10,spiritManaStep:4,manaGain:5,
  critFormula:'step',critPercentPerPoint:0,baseCrit:5,agilityCritStep:3,critGain:4,critCap:30,
  dodgeFormula:'step',dodgePercentPerPoint:0,baseDodge:2,agilityDodgeStep:4,dodgeGain:3,dodgeCap:25,
  magicResistFormula:'step',magicResistPerPoint:0,spiritMagicResistStep:5,magicResistGain:2
};

const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const effect=(effects,key)=>num(effects?.[key],0);
const externalTotal=(equipment,skills,key)=>num(equipment?.[key],0)+num(skills?.[key],0);

function legacyScenario(config){
  legacyCtx.__rules=config.rules;
  legacyCtx.__values=config.values;
  legacyCtx.__equipment=config.equipment||{};
  legacyCtx.__skills=config.skills||{};
  legacyCtx.current='hero';
  legacyCtx.CHARS={hero:{maxHp:config.charMaxHp}};
  legacyCtx.state={maxWounds:config.stateMaxWounds};

  const r=config.rules,e=config.effects||{};
  const critCap=Number.isFinite(Number(r.critCap))?Number(r.critCap):100;
  const dodgeCap=Number.isFinite(Number(r.dodgeCap))?Number(r.dodgeCap):100;
  const historical={
    physicalDamageBonus:legacyCtx.dungeonPhysicalDamageBonus(),
    magicDamageBonus:legacyCtx.dungeonMagicDamageBonus(),
    hpBonus:legacyCtx.dungeonEnduranceHpBonus(),
    maxMana:legacyCtx.dungeonMaxMana(),
    crit:legacyCtx.dungeonCriticalChance(),
    dodge:legacyCtx.dungeonDodgeChance(),
    initiative:legacyCtx.dungeonDerivedInitiative(),
    magicResistance:legacyCtx.dungeonMagicResistance()
  };
  return {
    historical,
    final:{
      physicalDamageBonus:historical.physicalDamageBonus+effect(e,'damage:physical')+effect(e,'damage:melee'),
      magicDamageBonus:historical.magicDamageBonus+effect(e,'damage:magic'),
      hpBonus:historical.hpBonus+effect(e,'max_hp'),
      maxMana:Math.max(0,historical.maxMana+effect(e,'max_mana')),
      crit:Math.max(0,Math.min(critCap,historical.crit+effect(e,'crit'))),
      dodge:Math.max(0,Math.min(dodgeCap,historical.dodge+effect(e,'dodge'))),
      initiative:historical.initiative+effect(e,'initiative'),
      magicResistance:Math.max(0,historical.magicResistance+effect(e,'magic_resistance'))
    },
    baseHp:Math.max(1,Number(config.charMaxHp||config.stateMaxWounds||3)||3),
    external:{
      mana:externalTotal(config.equipment,config.skills,'mana'),
      crit:externalTotal(config.equipment,config.skills,'crit'),
      dodge:externalTotal(config.equipment,config.skills,'dodge'),
      magicDefense:externalTotal(config.equipment,config.skills,'magicDefense')
    }
  };
}

function plain(value){return JSON.parse(JSON.stringify(value))}

function runScenario(config){
  const legacy=legacyScenario(config);
  const coreConfig={
    values:config.values,
    rules:config.rules,
    baseHp:legacy.baseHp,
    external:legacy.external,
    effects:config.effects
  };
  const before=JSON.stringify(coreConfig);
  const actual=plain(Core.derive(coreConfig));
  assert.equal(JSON.stringify(coreConfig),before,'S6 must not mutate explicit inputs');
  assert.deepEqual(actual.historical,legacy.historical,'S6 historical-stage parity');
  for(const [key,value] of Object.entries(legacy.final)){
    assert.equal(actual[key],value,'S6 final parity for '+key);
  }
  return actual;
}

const step=runScenario({
  rules:{...baseRules},
  values:{force:27,intelligence:17,endurance:12,esprit:11,agilite:14,initiative:9},
  charMaxHp:9,stateMaxWounds:6,
  equipment:{mana:2,crit:1,dodge:1,magicDefense:3},
  skills:{mana:1,crit:1,dodge:0,magicDefense:1},
  effects:{
    'damage:physical':2,'damage:melee':1,'damage:magic':5,
    max_hp:3,max_mana:4,crit:3,dodge:2,initiative:6,magic_resistance:1
  }
});
assert.deepEqual(
  {
    physical:step.physicalDamageBonus,magic:step.magicDamageBonus,hp:step.hpBonus,
    mana:step.maxMana,crit:step.crit,dodge:step.dodge,
    initiative:step.initiative,magicResistance:step.magicResistance
  },
  {physical:7,magic:11,hp:11,mana:27,crit:26,dodge:14,initiative:15,magicResistance:9},
  'step formulas must remain exact'
);

const staged=runScenario({
  rules:{
    ...baseRules,
    physicalDamageFormula:'percent',
    magicDamageFormula:'percent',
    hpFormula:'percent',hpPercentPerPoint:10,
    manaFormula:'percent',baseMana:20,manaPercentPerPoint:10,
    critFormula:'perPoint',baseCrit:0,critPercentPerPoint:5,critCap:50,
    dodgeFormula:'perPoint',baseDodge:0,dodgePercentPerPoint:4,dodgeCap:40,
    magicResistFormula:'perPoint',magicResistPerPoint:3
  },
  values:{force:99,intelligence:99,endurance:10,esprit:5,agilite:10,initiative:-3},
  charMaxHp:7,stateMaxWounds:12,
  equipment:{mana:-40,crit:15,dodge:10,magicDefense:-20},
  skills:{mana:-20,crit:5,dodge:10,magicDefense:0},
  effects:{
    'damage:physical':4,'damage:melee':2,'damage:magic':3,
    max_hp:1,max_mana:6,crit:-10,dodge:-5,initiative:2,magic_resistance:7
  }
});
assert.deepEqual(
  staged.historical,
  {physicalDamageBonus:0,magicDamageBonus:0,hpBonus:7,maxMana:0,crit:50,dodge:40,initiative:-3,magicResistance:0},
  'historical floors/caps must occur before Stats effects'
);
assert.deepEqual(
  {
    physical:staged.physicalDamageBonus,magic:staged.magicDamageBonus,hp:staged.hpBonus,
    mana:staged.maxMana,crit:staged.crit,dodge:staged.dodge,
    initiative:staged.initiative,magicResistance:staged.magicResistance
  },
  {physical:6,magic:3,hp:8,mana:6,crit:40,dodge:35,initiative:-1,magicResistance:7},
  'second-stage Stats floors/caps must remain distinct'
);

const alias=plain(Core.derive({
  values:{strength:27,intelligence:17,endurance:12,spirit:11,agility:14,initiative:9},
  rules:{...baseRules},
  baseHp:9,
  external:{mana:3,crit:2,dodge:1,magicDefense:4},
  effects:{'damage:physical':2,'damage:melee':1,'damage:magic':5,max_hp:3,max_mana:4,crit:3,dodge:2,initiative:6,magic_resistance:1}
}));
assert.equal(alias.physicalDamageBonus,step.physicalDamageBonus,'strength alias must feed force');
assert.equal(alias.maxMana,step.maxMana,'spirit alias must feed esprit');
assert.equal(alias.crit,step.crit,'agility alias must feed agilite');

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','currentRpgProfile','getActiveGameProfile',
  'dungeonEquipmentBonus','dungeonSkillEffectTotal','dungeonChallengeDebuffTotal067',
  'applyDungeonCombatScaling','hitChance','D100','Tactical'
]){
  assert.equal(derivedSrc.includes(forbidden),false,'S6 Core derived engine must stay pure: '+forbidden);
}
assert.equal(/\bdefense\b|\barmor\b/.test(derivedSrc),false,'S6 must not absorb final defense/armor semantics');
assert.equal(/equipment|talent|challenge/i.test(derivedSrc),false,'S6 must remain owner-agnostic');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S6 derived values parity',
  stepFormulas:true,
  percentAndPerPoint:true,
  stagedFloorsAndCaps:true,
  aliases:true,
  immutable:true,
  pure:true
},null,2));
