const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');

const p={id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{movement:{defaults:{hero:3}},stats:{
  active:['force','agilite','intelligence','esprit','endurance','initiative','chance'],
  dynamicDefinitions:[{id:'chance',name:'Chance',icon:'🍀',defaultValue:2,min:0,max:99,visible:true}],
  dynamicEffects90:[
    {id:'fx_def',source:'force',target:'defense',mode:'step',step:10,gain:1,enabled:true},
    {id:'fx_arm',source:'endurance',target:'armor',mode:'step',step:10,gain:2,enabled:true},
    {id:'fx_move',source:'agilite',target:'movement',mode:'step',step:10,gain:1,enabled:true}
  ],
  dynamicRules:[],legacyEffectsMigrated94:true
}}};
let profiles=[p];
const state={rpgAttributes:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:2},statPoints:3,rpgStatSpent:0};
const context={
  console,Math,Date,Set,Map,JSON,
  setTimeout(fn){fn();return 1},clearTimeout(){},
  current:'hero',state,
  CHARS:{hero:{dungeonStats:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:2,defense:12,armor:3,movement:5,chance:7}}},
  DUNGEON_DEFAULT_ATTRIBUTES:[{id:'force',name:'Force'}],
  isDungeonMode(){return true},
  currentRpgProfile(){return profiles[0]},getActiveGameProfile(){return profiles[0]},activeGameProfileId(){return 'dungeon'},getActiveGameProfileId(){return 'dungeon'},
  loadGameProfiles(){return profiles},saveGameProfiles(next){profiles=next},
  loadDungeonRpgRules(){return {critCap:100,dodgeCap:100}},saveDungeonRpgRules(){},
  loadState(){return state},save(){},saveState(){},
  dungeonEquipmentBonus(id){return id==='defense'?2:id==='armor'?4:0},
  dungeonSkillEffectTotal(){return 0},dungeonChallengeDebuffTotal067(){return 0},
  dungeonAttributeValue(id){return Number(state.rpgAttributes[id])||0},
  changeDungeonAttribute(){return true},renderDungeonAttributes(){},renderDungeonHeroStats(){},
  dungeonDerivedDefense(){return 14},dungeonArmorScore(){return 7},dungeonHeroMoveValue083(){return 5},
  dungeonPhysicalDamageBonus(){return 0},dungeonMagicDamageBonus(){return 0},dungeonEnduranceHpBonus(){return 0},dungeonMaxMana(){return 0},
  dungeonCriticalChance(){return 0},dungeonDodgeChance(){return 0},dungeonMagicResistance(){return 0},dungeonDerivedInitiative(){return 2},
  applyDungeonCombatScaling(it){return it},
  renderRpgUniverseEditor(){},
  saveRpgUniverseStats(){profiles[0].rpgUniverse.stats.active=[];return true},
  dungeonActiveProgressionConfig(){return {attributeEditMode:'points'}},dungeonSyncProgressionForState(){},
  alert(){},
};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(src,context,{filename:'gens-rpg-stats-clean-167874.js'});
const api=context.GensCleanRpgStats167874;
assert.ok(api,'API stats absente');
api.install();

assert.equal(api.APP_VERSION,'16.78.95');
const ids=api.CORE.map(x=>x.id);
for(const id of ['defense','armor','movement'])assert.ok(ids.includes(id),id+' doit être natif');
for(const id of ['defense','armor','movement'])assert.ok(api.active(id),id+' doit être activé lors de la migration 95');
assert.equal(context.dungeonDerivedDefense(),15,'Défense = 12 base +2 équipement +1 effet');
assert.equal(context.dungeonArmorScore(),9,'Armure = 3 base +4 équipement +2 effet');
assert.equal(context.dungeonHeroMoveValue083('hero'),6,'Mouvement = 5 personnel +1 effet');
assert.equal(api.value('hero','chance'),7,'une stat personnalisée existante ne doit pas être écrasée par sa valeur par défaut');

profiles[0].rpgUniverse.stats.active=profiles[0].rpgUniverse.stats.active.filter(x=>x!=='defense');
assert.equal(context.dungeonDerivedDefense(),0,'désactiver Défense doit neutraliser la valeur native');
profiles[0].rpgUniverse.stats.active.push('defense');
context.saveRpgUniverseStats();
assert.ok(api.active('defense'),'le save legacy ne doit plus décocher Défense');
assert.ok(api.active('armor'),'le save legacy ne doit plus décocher Armure');
assert.ok(api.active('movement'),'le save legacy ne doit plus décocher Mouvement');
assert.ok(api.active('chance'),'le save legacy ne doit pas décocher une stat personnalisée active');

assert.match(src,/function renderHeroEditorStats/,'éditeur héros dynamique manquant');
assert.match(src,/data-gens-dynamic-hero-stat/,'champs de stats personnalisées héros manquants');
assert.match(src,/hcRpgElementsWrap/,'le bloc élémentaire doit rester séparé dans l’éditeur héros');
assert.match(src,/\["legacy_hit_ranged","agilite","hit:ranged","rangedHitStep","rangedHitGain"\]/,'migration toucher distance incorrecte');
console.log('V16.78.95 native Defense/Armor/Movement: OK');
