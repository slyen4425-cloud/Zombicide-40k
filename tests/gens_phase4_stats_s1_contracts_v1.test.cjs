const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const rootDir=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(rootDir,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const statsNormalizationSrc=fs.readFileSync(path.join(rootDir,'assets','gensrpg','core','stats-normalization-v1.js'),'utf8');

const profile={
  id:'dungeon',
  name:'Dungeon',
  gameStyle:'dungeon',
  rpgUniverse:{
    movement:{defaults:{hero:3}},
    stats:{
      active:['strength','chance','weird stat'],
      dynamicDefinitions:[
        {id:'chance',name:'Chance',icon:'🍀',defaultValue:10,min:0,max:20,visible:true,description:'Custom stat'},
        {id:'weird stat',name:'Weird',icon:'X',defaultValue:99,min:5,max:2,visible:false,description:123}
      ],
      dynamicEffects90:[
        {id:'fx_force_to_chance',source:'strength',target:'stat:chance',mode:'step',step:10,gain:2,enabled:true},
        {id:'fx_chance_to_force',source:'chance',target:'stat:force',mode:'step',step:10,gain:1,enabled:true},
        {id:'fx_force_phys',source:'strength',target:'damage:physical',mode:'step',step:10,gain:3,enabled:true},
        {id:'fx_chance_hp',source:'chance',target:'max_hp',mode:'threshold',threshold:14,comparator:'gte',gain:5,enabled:true},
        {id:'fx_bad_target',source:'force',target:'not:a:target',mode:'step',step:1,gain:999,enabled:true},
        {id:'fx_bad_source',source:'',target:'max_hp',mode:'step',step:1,gain:999,enabled:true}
      ],
      dynamicRules:[],
      legacyEffectsMigrated94:true,
      nativeCoreMigrated95:true
    }
  }
};

let profiles=[profile];
const state={rpgAttributes:{force:20,chance:10}};
const ctx={
  console,Math,Date,JSON,Set,Map,
  current:'hero',
  state,
  CHARS:{hero:{dungeonStats:{force:7,chance:4}}},
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
  dungeonEquipmentBonus:(id)=>id==='force'?2:0,
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
vm.runInContext(statsNormalizationSrc,ctx,{filename:'stats-normalization-v1.js'});
vm.runInContext(src,ctx,{filename:'gens-rpg-stats-clean-167874.js'});

const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'canonical Stats API missing');

assert.equal(api.canon('strength'),'force');
assert.equal(api.canon('agility'),'agilite');
assert.equal(api.canon('spirit'),'esprit');
assert.equal(api.canon('defence'),'defense');
assert.equal(api.canon('armour'),'armor');
assert.equal(api.canon('move'),'movement');

const normalized=api.root(profile);
assert.ok(normalized,'stats root missing');

const weird=api.def('weird_stat');
assert.equal(weird.id,'weird_stat');
assert.equal(weird.name,'Weird');
assert.equal(weird.icon,'X');
assert.equal(weird.min,5);
assert.equal(weird.max,5,'max must never normalize below min');
assert.equal(weird.defaultValue,5,'default must clamp to normalized bounds');
assert.equal(weird.visible,false);
assert.equal(weird.description,'123');

const chance=api.def('chance');
assert.deepEqual(
  JSON.parse(JSON.stringify(chance)),
  {id:'chance',name:'Chance',icon:'🍀',defaultValue:10,min:0,max:20,visible:true,description:'Custom stat'}
);

const effects=api.effects();
assert.equal(effects.some(e=>e.id==='fx_bad_target'),false,'invalid target must be rejected');
assert.equal(effects.some(e=>e.id==='fx_bad_source'),false,'empty source must be rejected');
assert.equal(effects.length,4);

const step=effects.find(e=>e.id==='fx_force_to_chance');
assert.deepEqual(JSON.parse(JSON.stringify(step)),{
  id:'fx_force_to_chance',
  source:'force',
  target:'stat:chance',
  mode:'step',
  step:10,
  gain:2,
  threshold:10,
  comparator:'gt',
  enabled:true
});

const threshold=effects.find(e=>e.id==='fx_chance_hp');
assert.equal(threshold.mode,'threshold');
assert.equal(threshold.threshold,14);
assert.equal(threshold.comparator,'gte');
assert.equal(threshold.gain,5);

assert.equal(api.active('strength'),true,'aliases must normalize in active ids');
assert.equal(api.value('hero','chance'),14,'chance = runtime 10 + floor(force base 22 / 10) * 2');
assert.equal(api.value('hero','force'),23,'cycle must terminate through seen/base fallback and add chance contribution');
assert.equal(api.extraTotal('damage:physical','hero'),6,'derived step effect must use canonical source value');
assert.equal(api.sourceEffectTotal('damage:physical','strength','hero'),6,'source lookup must canonicalize aliases');
assert.equal(api.extraTotal('max_hp','hero'),5,'threshold gte effect must contribute exactly once');

state.rpgAttributes.chance=100;
assert.equal(api.value('hero','chance'),20,'final canonical value must clamp to definition max');
state.rpgAttributes.chance=10;

const sentence=api.sentence(threshold);
assert.match(sentence,/Chance/);
assert.match(sentence,/≥ 14/);
assert.match(sentence,/\+5/);

const summary=api.summaryFor('strength');
assert.match(summary,/Force/);
assert.match(summary,/Dégâts physiques bruts/);

assert.ok(api.TARGETS.some(x=>x[0]==='damage:physical'));
assert.ok(api.TARGETS.some(x=>x[0]==='hit:ranged'));
assert.ok(api.TARGETS.some(x=>x[0]==='max_hp'));
assert.ok(api.TARGETS.some(x=>x[0]==='magic_resistance'));

assert.match(src,/const normDef=StatsNorm\.normalizeDefinition/,'S1 definition normalization must now delegate to Core');
assert.match(src,/normEffect=StatsNorm\.normalizeEffect/,'S1 effect normalization must now delegate to Core');
assert.match(src,/function value\(hero,id,seen=new Set\(\)\)/,'S1 must characterize the current canonical value function');
assert.match(src,/new R\.MutationObserver/,'current mixed Stats owner still contains UI observer debt');
assert.match(src,/function renderEditor\(/,'current mixed Stats owner still contains editor UI');
assert.match(src,/function saveProfile\(/,'current mixed Stats owner still contains persistence');
assert.equal(/assets\/gensrpg\/core\/stats-v1\.js/.test(src),false,'S1 must not fake an extracted Core Stats service inside the legacy owner');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S1 contracts',
  owner:'GensCleanRpgStats167874',
  definitions:true,
  effects:true,
  aliases:true,
  canonicalValue:true,
  cycleFallback:true,
  derivedTargets:true,
  runtimeChanged:false
},null,2));
