const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const customFile=path.join(root,'assets','gensrpg','gens-custom-stats-167881.js');
const genericFile=path.join(root,'assets','gensrpg','gens-stat-help-extension-167881.js');
const custom=fs.readFileSync(customFile,'utf8');
const src=fs.readFileSync(genericFile,'utf8');

assert.doesNotThrow(()=>new Function(custom),'canonical custom stat engine must remain syntactically valid');
assert.doesNotThrow(()=>new Function(src),'V16.78.87 generic stat link engine must be syntactically valid');
assert.match(src,/APP_VERSION="16\.78\.87"/);
assert.match(src,/Liaisons caractéristiques → valeurs/,'editor must expose the generic link editor');
assert.match(src,/damage:physical/);assert.match(src,/damage:melee/);assert.match(src,/damage:ranged/);assert.match(src,/damage:magic/);
assert.match(src,/hit:melee/);assert.match(src,/hit:ranged/);assert.match(src,/hit:magic/);
assert.match(src,/max_hp/);assert.match(src,/max_mana/);assert.match(src,/crit/);assert.match(src,/dodge/);assert.match(src,/initiative/);assert.match(src,/defense/);assert.match(src,/armor/);assert.match(src,/magic_resistance/);assert.match(src,/movement/);
assert.match(src,/p\.rpgUniverse\.stats/,'generic rules must live under the RPG stats source');
assert.match(src,/derivedRules/,'derived rules must have one persisted source');
assert.match(src,/function sourceValue/,'all native/custom sources must pass through one resolver');
assert.match(src,/GensCustomStats167879\?\.value/,'custom stat values must come from the canonical custom-stat engine');
assert.match(src,/function totals/,'runtime must calculate target contributions from persisted rules');
assert.match(src,/function explainTarget/,'hero explanations must be generated from the same rules');
assert.match(src,/renderDungeonAttributes/,'hero attribute sheet must be refreshed from generic links');
assert.match(src,/renderDungeonHeroStats/,'derived stat sheet must be refreshed from generic links');
assert.match(src,/dtalentEffectsHost select\[data-f="scaleAttribute"\]/,'ability editor must keep custom stat selection');
assert.match(src,/rpgAbilityRefs/,'equipment must continue to store only ability references');
assert.doesNotMatch(src,/createElement\("script"\)|gens-equipment-ability-runtime-167885|MutationObserver|setInterval|setTimeout/,'V16.78.87 must not dynamically load runtime code or install repeating/delayed UI workers');
assert.doesNotMatch(src,/enemyCells\s*=|dungeonRoom\s*=|timeline|startDungeonCombat/,'generic stat refactor must not touch spatial combat/spawn/timeline');
assert.match(src,/gsr167887CleanupStyle/,'old duplicate editors must be removed by exact scoped selectors');

const profile={
  id:'demo',
  name:'Dungeon demo',
  rpgUniverse:{
    stats:{
      active:['force','necromancie'],
      customStats:[{id:'necromancie',name:'Nécromancie',icon:'☠️',kind:'score',min:0,max:100,defaultValue:0,visible:true,editMode:'points'}],
      derivedRules:[
        {id:'necro_phys',enabled:true,source:'necromancie',target:'damage:physical',calc:'step',step:10,value:2,unit:'flat'},
        {id:'necro_melee',enabled:true,source:'necromancie',target:'damage:melee',calc:'perPoint',step:1,value:.1,unit:'flat'},
        {id:'force_crit',enabled:true,source:'force',target:'crit',calc:'perPoint',step:1,value:.5,unit:'flat'},
        {id:'necro_hp',enabled:true,source:'necromancie',target:'max_hp',calc:'perPoint',step:1,value:1,unit:'percent'},
        {id:'necro_move',enabled:true,source:'necromancie',target:'movement',calc:'step',step:20,value:-1,unit:'flat'}
      ]
    }
  }
};
const hero={rpgAttributes:{force:10,necromancie:20},customStats:{necromancie:20}};
const legacyRules={
  physicalDamageFormula:'step',physicalDamageStep:10,physicalDamageGain:1,
  magicDamageFormula:'step',magicDamageStep:10,magicDamageGain:1,
  rangedDamageFormula:'none',rangedDamagePercentPerPoint:0,
  meleeHitStep:10,meleeHitGain:5,rangedHitStep:10,rangedHitGain:5,magicHitStep:10,magicHitGain:5,
  critFormula:'step',agilityCritStep:10,critGain:0,critPercentPerPoint:0,
  dodgeFormula:'step',agilityDodgeStep:10,dodgeGain:0,dodgePercentPerPoint:0,
  manaFormula:'step',baseMana:0,spiritManaStep:10,manaGain:0,manaPercentPerPoint:0,
  hpFormula:'step',enduranceHpStep:10,hpGain:0,hpPercentPerPoint:0,
  magicResistFormula:'step',spiritMagicResistStep:10,magicResistGain:0,magicResistPerPoint:0,
  initiativeFormula:'step',agilityInitiativeStep:9999,initiativeGain:0,initiativePerPoint:0
};
const sandbox={console,Math,Date,window:null,globalThis:null};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.current='h';
sandbox.currentRpgProfile=()=>profile;
sandbox.loadGameProfiles=()=>[profile];
sandbox.saveGameProfiles=()=>{};
sandbox.applyGameProfile=()=>{};
sandbox.GensCustomStats167879={
  defs:()=>profile.rpgUniverse.stats.customStats,
  value:(heroId,id)=>Number(hero.customStats[id]??hero.rpgAttributes[id])||0
};
sandbox.loadDungeonRpgRules=()=>legacyRules;
sandbox.dungeonAttributeValue=id=>Number(hero.rpgAttributes[id])||0;
sandbox.dungeonEnduranceHpBonus=()=>0;
sandbox.dungeonPhysicalDamageBonus=()=>1;
sandbox.dungeonMagicDamageBonus=()=>1;
sandbox.dungeonHitBonusForMode=()=>5;
sandbox.dungeonDamagePercentForMode=()=>0;
sandbox.dungeonApplyStatDamagePercent=(base)=>({pct:0,bonus:0});
sandbox.dungeonCriticalChance=()=>2;
sandbox.dungeonDodgeChance=()=>3;
sandbox.dungeonMagicResistance=()=>0;
sandbox.dungeonDerivedInitiative=()=>5;
sandbox.dungeonMaxMana=()=>100;
sandbox.effectiveMaxWounds=()=>100;
sandbox.dungeonDerivedDefense=()=>14;
sandbox.dungeonArmorScore=()=>2;
sandbox.dungeonHeroMoveValue083=()=>3;

vm.runInNewContext(src,sandbox);
sandbox.GensGenericStats167887.install();

assert.equal(sandbox.GensGenericStats167887.sourceValue('necromancie','h'),20,'custom source value must be usable like a native characteristic');
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.GensGenericStats167887.totals('damage:physical','h'))),{flat:4,percent:0});
assert.equal(sandbox.dungeonPhysicalDamageBonus(),4,'physical damage source must be fully configurable');
assert.equal(sandbox.dungeonCriticalChance(),7,'crit must be driven by generic links, not hardcoded Agility');
assert.equal(sandbox.effectiveMaxWounds(),120,'percent links must work on amount targets');
assert.equal(sandbox.dungeonHeroMoveValue083('h'),2,'movement must accept generic stat modifiers');
const pct=sandbox.dungeonApplyStatDamagePercent(10,'melee');
assert.equal(pct.bonus,2,'mode-specific flat damage links must be applied without a second damage engine');
assert.match(sandbox.GensGenericStats167887.descriptionForSource('necromancie'),/Dégâts physiques/);
assert.match(sandbox.GensGenericStats167887.descriptionForSource('necromancie'),/Déplacement/);

const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){
  assert.match(site,/gens-custom-stats-167881\.js\?v=167881/,'final site must still load canonical custom stats');
  assert.match(site,/gens-stat-help-extension-167881\.js\?v=167881/,'final site must load the stat refactor through the existing static slot');
  assert.doesNotMatch(site,/gens-equipment-ability-runtime-167885\.js/,'broken V16.78.85 runtime loader must stay absent from final HTML');
}
console.log('GenSrpG generic characteristic links V16.78.87 regression: OK');
