const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const Adapter=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'));
const V110=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));
const V11411=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

function extractFunction(name){
  const token='function '+name+'(';
  const start=index.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const brace=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=brace;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

let physicalBonusCalls=0,magicBonusCalls=0;
const rules={
  physicalDamageFormula:'step',physicalDamageStep:10,physicalDamageGain:3,
  physicalDamagePercentPerPoint:0,
  magicDamageFormula:'step',magicDamageStep:10,magicDamageGain:4,
  magicDamagePercentPerPoint:0,
  rangedDamageFormula:'none',rangedDamagePercentPerPoint:0,
  meleeHitStep:10,meleeHitGain:5,rangedHitStep:10,rangedHitGain:5,magicHitStep:10,magicHitGain:5,
  critMultiplier:2
};
const values={force:10,agilite:10,intelligence:10,esprit:5,endurance:5,initiative:10,defense:0,armor:0,movement:3};

const ownerCtx={
  console,Math,Number,
  current:'hero',
  state:{},
  RPG_ATTRIBUTE_LABELS:{force:'Force',agilite:'Agilité',intelligence:'Intelligence'},
  loadDungeonRpgRules:()=>rules,
  dungeonAttributeValue:id=>Number(values[id]||0),
  dungeonHitBonusForMode:null,
  dungeonPhysicalDamageBonus:()=>{physicalBonusCalls++;return 3},
  dungeonMagicDamageBonus:()=>{magicBonusCalls++;return 4},
  dungeonSkillEffectTotal:()=>0,
  isDungeonHeroSheet:()=>true,
  itemEvolutionState:()=>({level:1,dice:0,result:0,force:0}),
  getEntry:()=>null,
  getItemFromEntry:()=>null,
  checkedSkill:()=>false,
  heroSkillEffectBonus:()=>0
};
ownerCtx.window=ownerCtx;
ownerCtx.globalThis=ownerCtx;
vm.createContext(ownerCtx);
for(const name of [
  'itemAttackStats',
  'dungeonHitBonusForMode',
  'dungeonDamagePercentForMode',
  'dungeonApplyStatDamagePercent',
  'applyDungeonCombatScaling',
  'effectiveAttackStats'
]){
  vm.runInContext(extractFunction(name),ownerCtx,{filename:'index#'+name});
}

const sword={id:'sword',name:'Sword',type:'Arme',range:0,dice:1,accuracy:'3+',strength:5,
  rpgScaling:{attribute:'force',baseChance:50,chancePerPoint:0,diceSides:100}};
const staff={id:'staff',name:'Staff',type:'Arme',range:4,dice:1,accuracy:'3+',strength:5,
  rpgScaling:{attribute:'intelligence',baseChance:50,chancePerPoint:0,diceSides:100,magic:true}};

const states={hero:{rightHand:0,leftHand:null,inventory:[{itemId:'sword'}],mana:0,wounds:0}};
const items={sword,staff};
const rt={
  current:'hero',state:states.hero,
  CHARS:{hero:{name:'Hero',dungeonStats:{...values}}},
  loadState:id=>states[id],
  getItemFromEntry:e=>items[e?.itemId],
  itemById:id=>items[id],
  effectiveAttackStats(it){
    ownerCtx.current='hero';ownerCtx.state=states.hero;
    return ownerCtx.effectiveAttackStats(it);
  },
  dungeonAttributeValue:id=>Number(values[id]||0),
  dungeonHitBonusForMode:(mode,value)=>ownerCtx.dungeonHitBonusForMode(mode,value),
  dungeonPhysicalDamageBonus:()=>{physicalBonusCalls++;return 3},
  dungeonMagicDamageBonus:()=>{magicBonusCalls++;return 4},
  GensCleanRpgStats167874:{
    runtimeDefs:()=>Object.keys(values).map(id=>({id,name:id,icon:'',defaultValue:0})),
    value:(_hero,id)=>values[id],
    sourceEffectTotal:()=>0,
    extraTotal:()=>0
  },
  effectiveMaxWounds:()=>10,
  dungeonHeroMoveValue083:()=>3,
  dungeonDerivedInitiative:()=>10,
  dungeonDerivedDefense:()=>0,
  dungeonArmorScore:()=>0,
  dungeonDodgeChance:()=>0,
  dungeonCriticalChance:()=>0,
  dungeonMagicResistance:()=>0,
  dungeonMaxMana:()=>0,
  loadDungeonRpgRules:()=>rules
};

physicalBonusCalls=0;
const meleeAttack=Adapter.heroAttacks(rt,'hero')[0];
assert.equal(meleeAttack.power,8,'current Equipment/Combat scaling must already place the physical bonus inside Tactical attack.power');
assert.equal(meleeAttack.meta.rpgDamageBonus,3,'Adapter must expose the canonical bonus already embedded in Tactical power');
assert.equal(physicalBonusCalls,1,'weapon scaling must read the current physical damage bonus once');

const snap=V110.buildHeroSnapshot(rt,'hero',{hp:10,maxHp:10,movement:3,initiative:10,defense:0,armor:0,dodge:0});
assert.equal(snap.derived.physicalDamageBonus,3);
assert.equal(physicalBonusCalls,2,'V110 currently rereads the same physical damage bonus while building the snapshot');

const attacker={id:'hero',meta:{rpgStats:snap}};
const target={id:'enemy',armor:2};
const physical=V11411.resolvePhysicalDamage(
  {loadDungeonRpgRules:()=>({armorZeroBlockChance:75})},
  {rngSeed:1},
  attacker,target,meleeAttack,
  {damageType:'physical',armor:2,rawDamage:meleeAttack.power,damage:Math.max(0,meleeAttack.power-2)},
  0
);
assert.deepEqual(
  {
    attackPower:meleeAttack.power,
    snapshotBonus:snap.derived.physicalDamageBonus,
    baseWeaponDamage:physical.baseWeaponDamage,
    statDamageBonus:physical.statDamageBonus,
    rawDamage:physical.rawDamage,
    armor:physical.armor,
    finalDamage:physical.damage
  },
  {attackPower:8,snapshotBonus:3,baseWeaponDamage:5,statDamageBonus:3,rawDamage:8,armor:2,finalDamage:6},
  'corrected boundary must retain scaled preview power while applying the canonical melee bonus exactly once'
);

states.hero.inventory=[{itemId:'staff'}];
magicBonusCalls=0;
const magicAttack=Adapter.heroAttacks(rt,'hero')[0];
assert.equal(magicAttack.power,9,'current magic scaling must place the magic damage bonus inside Tactical attack.power');
assert.equal(magicAttack.meta.rpgDamageBonus,4,'Adapter must also expose the embedded magic bonus without changing magic resolution');
assert.equal(magicBonusCalls,1);
const magicSnap=V110.buildHeroSnapshot(rt,'hero',{hp:10,maxHp:10,movement:3,initiative:10,defense:0,armor:0,dodge:0});
assert.equal(magicSnap.derived.magicDamageBonus,4);
assert.equal(magicBonusCalls,2,'V110 currently also rereads magic damage bonus into the snapshot');

const magicPerHit=V11411.resolveDamagePerHit(
  {},null,
  {id:'hero',meta:{rpgStats:magicSnap}},
  {id:'enemy',armor:0},
  magicAttack,
  {damageType:'magic',rawDamage:9,damage:9,armor:0}
);
assert.equal(magicPerHit.baseWeaponDamage,9);
assert.equal(magicPerHit.statDamageBonus,0,'V114.11 non-physical branch currently does not add snapshot magic bonus a second time');
assert.equal(magicPerHit.rawDamage,9);
assert.equal(magicPerHit.damage,9);

const v110Src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'),'utf8');
const v11411Src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');
const adapterSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'),'utf8');

assert.match(v110Src,/dungeonPhysicalDamageBonus/);
assert.match(v110Src,/dungeonMagicDamageBonus/);
assert.match(v11411Src,/canonicalDamageBonus/);
assert.match(v11411Src,/baseWeaponDamage\+statDamageBonus/);
assert.match(adapterSrc,/st\.damage\?\?st\.power\?\?st\.strength/);

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S11 current damage boundary characterization',
  physicalBonusReads:physicalBonusCalls,
  physicalAttackPowerAlreadyScaled:8,
  physicalSnapshotBonus:3,
  physicalV11411RawDamage:8,
  physicalFinalAfterArmor:6,
  magicBonusReads:magicBonusCalls,
  magicAttackPowerAlreadyScaled:9,
  magicSnapshotBonus:4,
  magicV11411AddsSnapshotBonus:false,
  meleeDoubleApplicationFixed:true,
  rangedAndMagicSemanticsChanged:false
},null,2));
