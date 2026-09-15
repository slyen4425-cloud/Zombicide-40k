const assert=require('node:assert/strict');
const path=require('node:path');
const Core=require(path.join(__dirname,'..','assets','gensrpg','core','stats.js'));

assert.equal(Core.VERSION,'1.0.0');
assert.equal(Core.canonicalId('Strength'),'force');
assert.equal(Core.canonicalId('Agility'),'agilite');
assert.equal(Core.canonicalId('Will Power',{will_power:'resolve'}),'resolve');

const definitions=[
  {id:'force',name:'Force',defaultValue:10,min:0,max:20},
  {id:'defense',name:'Défense',defaultValue:3,min:0,max:10},
  {id:'luck',name:'Chance',defaultValue:4,min:0,max:100},
  {id:'hidden',name:'Cachée',defaultValue:7,min:0,max:10,visible:false},
];
const effects=[
  {id:'force_to_defense',source:'force',target:'stat:defense',mode:'step',step:5,gain:2},
  {id:'force_direct_defense',source:'force',target:'defense',mode:'step',step:10,gain:1},
  {id:'force_damage',source:'force',target:'damage:physical',mode:'step',step:10,gain:3},
  {id:'force_luck_threshold',source:'force',target:'stat:luck',mode:'threshold',threshold:15,comparator:'gte',gain:4},
  {id:'disabled_bonus',source:'force',target:'stat:luck',mode:'step',step:1,gain:50,enabled:false},
];
const evaluator=Core.createEvaluator({
  definitions,
  activeIds:['strength','defense','luck','hidden'],
  effects,
  baseValues:{force:17,defense:4,luck:5,hidden:7},
  directTargets:['defense'],
});

assert.equal(evaluator.value('strength'),17,'aliases must resolve to the canonical stat without hard-coded gameplay math');
assert.equal(evaluator.value('defense'),10,'configured stat/direct effects must apply then respect the configured cap');
assert.equal(evaluator.value('luck'),9,'configured threshold effects must apply to arbitrary stats');
assert.equal(evaluator.totalForTarget('damage:physical'),3,'non-stat targets must remain available to damage/other Core services');

const defense=evaluator.breakdown('defense');
assert.deepEqual(
  {base:defense.base,statEffects:defense.statEffects,directEffects:defense.directEffects,raw:defense.raw,final:defense.final},
  {base:4,statEffects:6,directEffects:1,raw:11,final:10},
  'breakdown must expose every contribution instead of hiding the calculation'
);
assert.deepEqual(
  evaluator.runtimeDefinitions().map(def=>def.id),
  ['force','defense','luck'],
  'hidden definitions stay evaluable but are excluded from runtime-visible definitions'
);

const inactive=Core.createEvaluator({
  definitions:[{id:'resolve',defaultValue:8,min:0,max:50}],
  activeIds:[],
  baseValues:{resolve:33},
});
assert.equal(inactive.value('resolve'),0,'inactive stats must not leak into gameplay');

const custom=Core.createEvaluator({
  aliases:{willpower:'resolve'},
  definitions:[{id:'resolve',name:'Résolution',defaultValue:2,min:-20,max:200}],
  activeIds:['willpower'],
  baseValues:{resolve:12},
  effects:[{source:'willpower',target:'stat:resolve',mode:'threshold',threshold:10,comparator:'gte',gain:7}],
});
assert.equal(custom.value('resolve'),19,'the engine must support creator-defined stats and aliases without a code change');

const cycle=Core.createEvaluator({
  definitions:[
    {id:'force',defaultValue:10,min:0,max:100},
    {id:'agilite',defaultValue:5,min:0,max:100},
  ],
  baseValues:{force:10,agilite:5},
  effects:[
    {source:'force',target:'stat:agilite',mode:'step',step:10,gain:2},
    {source:'agilite',target:'stat:force',mode:'step',step:5,gain:1},
  ],
});
assert.equal(cycle.value('force'),11,'cyclic stat effects must terminate using the source base value at the cycle boundary');
assert.equal(cycle.value('agilite'),7,'cycle protection must remain deterministic in either evaluation direction');

const functionBase=Core.createEvaluator({
  definitions:[{id:'energy',defaultValue:1,min:0,max:99}],
  getBaseValue:(id,def)=>id==='energy'?42:def.defaultValue,
});
assert.equal(functionBase.value('energy'),42,'runtime adapters may supply effective base values without coupling Core to storage or Dungeon globals');

console.log('GenSrpG Core Stats pure configurable contract OK');
