const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sources={
  norm:fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-normalization-v1.js'),'utf8'),
  s3:fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-value-engine-v1.js'),'utf8'),
  s4:fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-hero-values-v1.js'),'utf8'),
  s5:fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-modifier-provider-v1.js'),'utf8'),
  s6:fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-derived-values-v1.js'),'utf8'),
  s7:fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-snapshot-v1.js'),'utf8'),
  clean:fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8')
};
const V110=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));

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
  rpgUniverse:{movement:{defaults:{hero:4}},stats:{
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
    dynamicRules:[],legacyEffectsMigrated94:true,nativeCoreMigrated95:true
  }}
};
const state={rpgAttributes:{force:20,agilite:20,intelligence:16,esprit:11,endurance:12,initiative:13,defense:8,armor:4,movement:5},mana:9,wounds:2,elementResistances:{fire:25}};
const heroDef={name:'Hero',maxHp:20,dungeonStats:{force:11,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:9,defense:6,armor:2,movement:4}};
const equipment={force:2,defense:2,armor:3,mana:2,crit:1,dodge:1,magicDefense:3};
const equipmentBonus=id=>Number(equipment[id]||0);
function skillEffectTotal(kind,_unused,id){
  if(arguments.length===1)return Number(({defense:1,armor:1,mana:1,crit:2,dodge:0,magicDefense:1}[kind])||0);
  return Number(({force:1,agilite:1,intelligence:0,esprit:0,endurance:0,initiative:0}[id])||0);
}
const challengeDebuff=id=>Number(({force:-1,agilite:-2}[id])||0);

let profiles=[profile];
const rt={
  console,Math,Number,Date,JSON,Set,Map,
  current:'hero',state,CHARS:{hero:heroDef},
  isDungeonMode:()=>true,currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],
  loadGameProfiles:()=>profiles,saveGameProfiles:next=>{profiles=next},
  activeGameProfileId:()=>profile.id,getActiveGameProfileId:()=>profile.id,
  loadState:id=>id==='hero'?state:null,save:()=>true,saveState:()=>true,
  loadDungeonRpgRules:()=>rules,saveDungeonRpgRules:()=>true,
  dungeonEquipmentBonus:equipmentBonus,dungeonSkillEffectTotal:skillEffectTotal,dungeonChallengeDebuffTotal067:challengeDebuff,
  effectiveMaxWounds:()=>20,dungeonHeroMoveValue083:()=>5,dungeonDerivedDefense:()=>8,dungeonArmorScore:()=>4,
  renderDungeonAttributes:()=>{},renderRpgUniverseEditor:()=>{},saveRpgUniverseStats:()=>{},
  dungeonAttributeValue:id=>Number(state.rpgAttributes[id]||0),changeDungeonAttribute:()=>false,
  applyDungeonCombatScaling:x=>x,openHeroCreator:()=>{},hcRenderRpgStatsUsage:()=>{},saveCustomHero:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{}
};
rt.window=rt;rt.globalThis=rt;
vm.createContext(rt);
vm.runInContext(sources.norm,rt,{filename:'stats-normalization-v1.js'});
for(const [name,src] of [['s3',sources.s3],['s4',sources.s4],['s5',sources.s5],['s6',sources.s6],['s7',sources.s7]])vm.runInContext(src,rt,{filename:name+'.js'});
for(const name of ['dungeonPhysicalDamageBonus','dungeonMagicDamageBonus','dungeonEnduranceHpBonus','dungeonMaxMana','dungeonCriticalChance','dungeonDodgeChance','dungeonDerivedInitiative','dungeonMagicResistance']){
  vm.runInContext(extractFunction(name),rt,{filename:'index#'+name});
}
vm.runInContext(sources.clean,rt,{filename:'gens-rpg-stats-clean-167874.js'});
const Clean=rt.GensCleanRpgStats167874;
assert.ok(Clean&&Clean.install(),'Stats owner must install with Core dependencies');

const defs=Clean.runtimeDefs();
const oracleCanonical=JSON.parse(JSON.stringify(defs.map(d=>({id:d.id,name:d.name,icon:d.icon,value:Clean.value('hero',d.id)}))));
const oracleValues=Object.fromEntries(oracleCanonical.map(row=>[row.id,row.value]));
const oracleDerived={
  physicalDamageBonus:rt.dungeonPhysicalDamageBonus(),
  magicDamageBonus:rt.dungeonMagicDamageBonus(),
  maxMana:rt.dungeonMaxMana(),
  crit:rt.dungeonCriticalChance(),
  dodge:rt.dungeonDodgeChance(),
  magicResistance:rt.dungeonMagicResistance()
};
const oracleInitiative=Clean.value('hero','initiative');
const expectedInitiativeEffect=Clean.extraTotal('initiative','hero');
assert.equal(expectedInitiativeEffect,7,'fixture must exercise explicit +7 initiative target effect');

const watched=['dungeonPhysicalDamageBonus','dungeonMagicDamageBonus','dungeonMaxMana','dungeonCriticalChance','dungeonDodgeChance','dungeonMagicResistance','dungeonDerivedInitiative'];
const calls=Object.fromEntries(watched.map(name=>[name,0]));
for(const name of watched){
  const original=rt[name];
  rt[name]=function(){calls[name]++;return original.apply(this,arguments)};
}

const core=JSON.parse(JSON.stringify(Clean.coreSnapshot('hero')));
assert.deepEqual(core.canonical,oracleCanonical,'runtime Core snapshot canonical parity with real Stats owner');
assert.deepEqual(core.values,oracleValues,'runtime Core snapshot values parity with real Stats owner');
for(const key of Object.keys(oracleDerived))assert.equal(core.derived[key],oracleDerived[key],'runtime Core derived parity: '+key);
assert.equal(core.derived.initiative,oracleInitiative+expectedInitiativeEffect,'Core derived initiative keeps explicit target effect for future migration');
for(const name of watched)assert.equal(calls[name],0,'Core snapshot adapter must not reread Dungeon derived helper: '+name);

V110.resetMetrics();
const actor={id:'hero',side:'hero',hp:18,maxHp:20,movement:5,initiative:13,defense:8,armor:4,dodge:0,meta:{heroId:'hero'}};
const snap=V110.buildHeroSnapshot(rt,'hero',actor);
assert.deepEqual(JSON.parse(JSON.stringify(snap.canonical)),oracleCanonical,'V110 canonical rows must now come from Core snapshot');
assert.deepEqual(JSON.parse(JSON.stringify(snap.values)),oracleValues,'V110 values must now come from Core snapshot');
for(const key of Object.keys(oracleDerived))assert.equal(snap.derived[key],oracleDerived[key],'V110 stable derived from Core: '+key);
assert.equal(snap.derived.initiative,oracleInitiative,'V110 initiative semantics remain canonical until dedicated migration');
for(const name of watched.slice(0,6))assert.equal(calls[name],0,'V110 must not reread migrated Dungeon helper: '+name);
assert.equal(calls.dungeonDerivedInitiative,1,'initiative fallback remains intentionally outside S11 derived raccord');

assert.equal(snap.derived.hp,18);assert.equal(snap.derived.maxHp,20);assert.equal(snap.derived.mana,9);
assert.equal(snap.resistances.fire,25);assert.equal(snap.rules.criticalMultiplier,2);
assert.equal(Object.prototype.hasOwnProperty.call(core.derived,'hp'),false);
assert.equal(Object.prototype.hasOwnProperty.call(core.derived,'mana'),false);
assert.equal(Object.prototype.hasOwnProperty.call(core,'resistances'),false);
assert.equal(Object.prototype.hasOwnProperty.call(core,'rules'),false);

console.log(JSON.stringify({
  scenario:'Phase 4 S11 Core Snapshot runtime authority parity',
  canonicalParity:true,valuesParity:true,
  derivedParity:Object.keys(oracleDerived),
  migratedDungeonDerivedReads:0,
  initiative:{v110:snap.derived.initiative,core:core.derived.initiative,migrationDeferred:true},
  sessionEnvelopeStaysV110:true,
  gameplayChanged:false
},null,2));
