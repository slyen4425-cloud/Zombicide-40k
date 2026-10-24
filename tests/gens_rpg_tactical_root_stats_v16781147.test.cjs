const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const statsNormalizationSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-normalization-v1.js'),'utf8');
const statsValueEngineSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-value-engine-v1.js'),'utf8');
const statsHeroValuesSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-hero-values-v1.js'),'utf8');
const statsModifierProviderSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-modifier-provider-v1.js'),'utf8');
const statsDerivedValuesSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-derived-values-v1.js'),'utf8');
const statsSnapshotSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','stats-snapshot-v1.js'),'utf8');
const Stats=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));

const state={rpgAttributes:{force:17,agilite:13,intelligence:11,esprit:9,endurance:15,initiative:8,defense:12,armor:2,movement:4},mana:6};
const profile={id:'dungeon_profile',gameStyle:'dungeon',rpgUniverse:{stats:{active:['force','agilite','intelligence','esprit','endurance','initiative','defense','armor','movement'],dynamicDefinitions:[],dynamicEffects90:[],legacyEffectsMigrated94:true,nativeCoreMigrated95:true},movement:{defaults:{hero:3}}}};
const ctx={
  console,
  current:'hero',state,
  isDungeonMode:()=>true,
  currentRpgProfile:()=>profile,
  getActiveGameProfile:()=>profile,
  loadGameProfiles:()=>[profile],saveGameProfiles:()=>true,
  loadState:id=>id==='hero'?state:{},
  CHARS:{hero:{id:'hero',name:'Hero',dungeonStats:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:0,defense:10,armor:0,movement:3}}},
  // This is deliberately the obsolete pre-clean seam. V114.6 still reached it for the current hero.
  dungeonAttributeValue:()=>0,
  changeDungeonAttribute:()=>true,
  dungeonEquipmentBonus:id=>id==='force'?2:id==='defense'?3:0,
  dungeonSkillEffectTotal:(kind,_unused,id)=>kind==='attribute'&&id==='force'?1:kind==='defense'?2:0,
  dungeonChallengeDebuffTotal067:id=>id==='force'?-1:0,
  dungeonDodgeChance:()=>9,dungeonCriticalChance:()=>7,dungeonMagicResistance:()=>4,dungeonMaxMana:()=>12,
  dungeonHeroMoveValue083:()=>4,dungeonDerivedInitiative:()=>8,dungeonDerivedDefense:()=>17,dungeonArmorScore:()=>2,
  effectiveMaxWounds:()=>25,dungeonPhysicalDamageBonus:()=>0,dungeonMagicDamageBonus:()=>0,
  loadDungeonRpgRules:()=>({critMultiplier:2}),
  setTimeout:fn=>{fn();return 1},clearTimeout:()=>{},
};
vm.createContext(ctx);
vm.runInContext(statsNormalizationSrc,ctx,{filename:'stats-normalization-v1.js'});
vm.runInContext(statsValueEngineSrc,ctx,{filename:'stats-value-engine-v1.js'});
vm.runInContext(statsHeroValuesSrc,ctx,{filename:'stats-hero-values-v1.js'});
vm.runInContext(statsModifierProviderSrc,ctx,{filename:'stats-modifier-provider-v1.js'});
vm.runInContext(statsDerivedValuesSrc,ctx,{filename:'stats-derived-values-v1.js'});
vm.runInContext(statsSnapshotSrc,ctx,{filename:'stats-snapshot-v1.js'});
vm.runInContext(source,ctx,{filename:'gens-rpg-stats-clean-167874.js'});
const api=ctx.GensCleanRpgStats167874;
assert.ok(api,'canonical stats API must install');
assert.equal(api.APP_VERSION,'16.78.114.7');
api.installRuntime();

assert.equal(api.value('hero','force'),19,'current hero Force must come from rebuilt rpgAttributes + current bonuses, never legacy zero');
assert.equal(api.value('hero','agilite'),13,'current hero Agility must come from rebuilt rpgAttributes');
assert.equal(api.value('hero','defense'),17,'native Defense must preserve rebuilt value + equipment + skill bonus');
assert.equal(api.value('hero','movement'),4,'Movement must remain canonical');

const actor={id:'hero',side:'hero',hp:24,maxHp:25,movement:0,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'hero'}};
const snap=Stats.buildHeroSnapshot(ctx,'hero',actor);
assert.equal(snap.values.force,19);
assert.equal(snap.values.agilite,13);
assert.equal(snap.values.defense,17);
assert.equal(snap.values.movement,4);
assert.equal(snap.derived.defense,17);
assert.equal(snap.derived.movement,4);
assert.equal(ctx.current,'hero','snapshot builder must restore active hero context');
assert.equal(ctx.state,state,'snapshot builder must restore active hero state');

const baseStart=source.indexOf('function baseValue');
const baseEnd=source.indexOf('const compare=StatsNorm.compare',baseStart);
assert.ok(baseStart>0&&baseEnd>baseStart);
assert.doesNotMatch(source.slice(baseStart,baseEnd),/nativeAttr\.call/,'canonical current-hero values must not fall back to the obsolete native reader');
console.log('V16.78.114.7 rebuilt canonical hero stats -> Tactical V110 snapshot OK');
