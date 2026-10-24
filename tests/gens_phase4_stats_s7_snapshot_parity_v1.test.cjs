const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const normalizationPath=path.join(root,'assets','gensrpg','core','stats-normalization-v1.js');
const snapshotPath=path.join(root,'assets','gensrpg','core','stats-snapshot-v1.js');
const v110Path=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js');

const normalizationSrc=fs.readFileSync(normalizationPath,'utf8');
const snapshotSrc=fs.readFileSync(snapshotPath,'utf8');
const v110Src=fs.readFileSync(v110Path,'utf8');

const definitions=[
  {id:'force',name:'Force',icon:'💪',defaultValue:5,min:0,max:99},
  {id:'agilite',name:'Agilité',icon:'🏃',defaultValue:5,min:0,max:99},
  {id:'intelligence',name:'Intelligence',icon:'🧠',defaultValue:5,min:0,max:99},
  {id:'esprit',name:'Esprit',icon:'🔷',defaultValue:5,min:0,max:99},
  {id:'endurance',name:'Endurance',icon:'❤️',defaultValue:5,min:0,max:99},
  {id:'initiative',name:'Initiative',icon:'⚡',defaultValue:10,min:0,max:99},
  {id:'defense',name:'Défense',icon:'🛡️',defaultValue:0,min:0,max:99},
  {id:'armor',name:'Armure',icon:'🧱',defaultValue:0,min:0,max:99},
  {id:'movement',name:'Mouvement',icon:'👣',defaultValue:3,min:0,max:99}
];

const values={
  force:17,
  agilite:14,
  intelligence:11,
  esprit:9,
  endurance:16,
  initiative:13,
  defense:8,
  armor:4,
  movement:5
};

const derived={
  physicalDamageBonus:6,
  magicDamageBonus:3,
  hpBonus:8,
  maxMana:22,
  crit:19,
  dodge:12,
  initiative:13,
  magicResistance:7,
  hp:21,
  mana:8,
  armorReduction:2,
  resistances:{fire:25},
  rules:{criticalMultiplier:2},
  hitChance:91
};

function plain(value){return JSON.parse(JSON.stringify(value))}

const v110Root={
  console,Math,Date,Set,Map,
  current:'hero',
  state:{rpgAttributes:{...values},mana:8,wounds:2},
  CHARS:{hero:{maxHp:15,dungeonStats:{...values}}},
  GensCleanRpgStats167874:{
    coreSnapshot:id=>({
      version:'1.0.0',
      heroId:id,
      canonical:definitions.map(d=>({id:d.id,name:d.name,icon:d.icon,value:values[d.id]})),
      values:{...values},
      derived:{
        physicalDamageBonus:derived.physicalDamageBonus,
        magicDamageBonus:derived.magicDamageBonus,
        hpBonus:derived.hpBonus,
        maxMana:derived.maxMana,
        crit:derived.crit,
        dodge:derived.dodge,
        initiative:derived.initiative,
        magicResistance:derived.magicResistance
      }
    })
  },
  loadState:()=>({rpgAttributes:{...values},mana:8,wounds:2}),
  effectiveMaxWounds:()=>23,
  dungeonHeroMoveValue083:()=>values.movement,
  dungeonDerivedInitiative:()=>derived.initiative,
  dungeonDerivedDefense:()=>values.defense,
  dungeonArmorScore:()=>values.armor,
  dungeonDodgeChance:()=>derived.dodge,
  dungeonCriticalChance:()=>derived.crit,
  dungeonMagicResistance:()=>derived.magicResistance,
  dungeonMaxMana:()=>derived.maxMana,
  dungeonPhysicalDamageBonus:()=>derived.physicalDamageBonus,
  dungeonMagicDamageBonus:()=>derived.magicDamageBonus,
  loadDungeonRpgRules:()=>({critMultiplier:2})
};
v110Root.globalThis=v110Root;
vm.createContext(v110Root);
vm.runInContext(v110Src,v110Root,{filename:'gens-rpg-tactical-combat-v2-stats-1678110.js'});
const V110=v110Root.GensRpgTacticalStats1678110;
assert.ok(V110&&typeof V110.buildHeroSnapshot==='function','V110 snapshot oracle missing');
const legacy=plain(V110.buildHeroSnapshot(v110Root,'hero',null));

const pureCtx={console,Math,Number,JSON,Set,Map,Object};
pureCtx.window=pureCtx;
pureCtx.globalThis=pureCtx;
vm.createContext(pureCtx);
vm.runInContext(normalizationSrc,pureCtx,{filename:'stats-normalization-v1.js'});
vm.runInContext(snapshotSrc,pureCtx,{filename:'stats-snapshot-v1.js'});
const Core=pureCtx.GensStatsSnapshotV1;
assert.ok(Core&&typeof Core.create==='function','Core Stats S7 snapshot API missing');

const input={
  heroId:'hero',
  definitions:plain(definitions),
  values:plain(values),
  derived:plain(derived)
};
const before=JSON.stringify(input);
const snap=Core.create(input);
assert.equal(JSON.stringify(input),before,'S7 snapshot must not mutate inputs');

assert.equal(snap.heroId,'hero');
assert.deepEqual(plain(snap.canonical),legacy.canonical,'S7 canonical rows must match V110 for canonical Stats definitions');
assert.deepEqual(plain(snap.values),legacy.values,'S7 canonical values must match V110 for canonical Stats definitions');

const expectedDerived={
  physicalDamageBonus:legacy.derived.physicalDamageBonus,
  magicDamageBonus:legacy.derived.magicDamageBonus,
  hpBonus:derived.hpBonus,
  maxMana:legacy.derived.maxMana,
  crit:legacy.derived.crit,
  dodge:legacy.derived.dodge,
  initiative:legacy.derived.initiative,
  magicResistance:legacy.derived.magicResistance
};
assert.deepEqual(plain(snap.derived),expectedDerived,'S7 must transport only the S6-stable derived subset');

for(const forbidden of [
  'hp','mana','wounds','resistances','rules','criticalMultiplier',
  'armorReduction','hitChance','d100','position','movementLeft','actionsLeft'
]){
  assert.equal(Object.prototype.hasOwnProperty.call(snap,forbidden),false,'S7 top-level session/combat field forbidden: '+forbidden);
  assert.equal(Object.prototype.hasOwnProperty.call(snap.derived,forbidden),false,'S7 derived session/combat field forbidden: '+forbidden);
}

assert.equal(Object.isFrozen(snap),true,'snapshot must be frozen');
assert.equal(Object.isFrozen(snap.canonical),true,'canonical array must be frozen');
assert.equal(Object.isFrozen(snap.values),true,'values map must be frozen');
assert.equal(Object.isFrozen(snap.derived),true,'derived map must be frozen');
for(const row of snap.canonical)assert.equal(Object.isFrozen(row),true,'canonical rows must be frozen');

const alias=Core.create({
  heroId:'alias',
  definitions:[
    {id:'strength',name:'Strength',icon:'S',defaultValue:3,min:0,max:99},
    {id:'agility',name:'Agility',icon:'A',defaultValue:4,min:0,max:99},
    {id:'defence',name:'Defence',icon:'D',defaultValue:1,min:0,max:99},
    {id:'force',name:'Duplicate Force',icon:'X',defaultValue:99,min:0,max:99}
  ],
  values:{strength:21,agility:18,defence:7,force:23},
  derived:{crit:'not-finite',initiative:4}
});
assert.deepEqual(
  plain(alias.canonical).map(x=>[x.id,x.value]),
  [['force',23],['agilite',18],['defense',7]],
  'aliases must canonicalize and duplicate definitions must collapse deterministically'
);
assert.deepEqual(plain(alias.values),{force:23,agilite:18,defense:7},'alias values must resolve to canonical IDs');
assert.equal(alias.derived.crit,0,'non-finite derived values must normalize to zero');
assert.equal(alias.derived.initiative,4);
for(const key of ['physicalDamageBonus','magicDamageBonus','hpBonus','maxMana','dodge','magicResistance']){
  assert.equal(alias.derived[key],0,'missing allowed derived value must default to zero: '+key);
}

const fallback=Core.create({
  heroId:'fallback',
  definitions:[{id:'chance',name:'Chance',icon:'🍀',defaultValue:6,min:0,max:20}],
  values:{chance:'bad'},
  derived:{}
});
assert.equal(fallback.values.chance,6,'non-finite canonical value must fall back to normalized definition default');
assert.equal(fallback.canonical[0].value,6);

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','state','currentRpgProfile','getActiveGameProfile','loadState',
  'dungeonCombatHeroSnapshot','GensRpgTacticalCombatV2','GensRpgTacticalStats1678110',
  'dungeonEquipmentBonus','dungeonSkillEffectTotal','dungeonChallengeDebuffTotal067',
  'Date.now','Math.random'
]){
  assert.equal(snapshotSrc.includes(forbidden),false,'S7 Core snapshot must stay pure: '+forbidden);
}
assert.equal(/resistanceSnapshot|criticalMultiplier|armorReduction|hitChance|D100/i.test(snapshotSrc),false,'S7 must not absorb later combat contracts');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S7 immutable snapshot parity',
  v110CanonicalParity:true,
  v110ValuesParity:true,
  stableDerivedSubset:true,
  aliases:true,
  fallback:true,
  deeplyFrozen:true,
  sessionFieldsExcluded:true,
  pure:true
},null,2));
