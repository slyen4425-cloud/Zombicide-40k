const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-canonical-perception-1678107.js'),'utf8');
let saved=[];
let profiles=[{id:'dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[],active:[]},exploration:{trapDetectionStat:'agilite',trapDetectionRadius:2}}}];
const values={aldren:2,lyra:4,brom:1};
const spatial={ensure(){},active(){return 'aldren'},heroesHere(){return ['aldren','lyra','brom']},participatingHeroes(){throw new Error('legacy should not run')}};
let trapSeen=null;
const context={console,localStorage:{getItem(k){return k==='gensrpg_dungeon_runtime_v2'?JSON.stringify({participants:['aldren','lyra','brom'],index:1}):null}},setTimeout(fn){fn();return 1},window:null,
 loadGameProfiles(){return JSON.parse(JSON.stringify(profiles))},saveGameProfiles(next){profiles=JSON.parse(JSON.stringify(next));saved.push(JSON.parse(JSON.stringify(next)))},activeGameProfileId(){return 'dungeon'},
 GensCleanRpgStats167874:{def(id){return profiles[0].rpgUniverse.stats.dynamicDefinitions.find(x=>x.id===id)||null},active(id){return profiles[0].rpgUniverse.stats.active.includes(id)},value(id,stat){assert.equal(stat,'perception');return values[id]},syncCanonicalRuntime(){},renderHeroEditorStats(){}},
 GensEnemyCanonicalStats1678105:{enabled(){return true}},DungeonSpatial313:spatial,dungeonCombatUseHero(id,fn){return fn()},
 enemyFormObject(){return {rule:{rpgStats:{perception:7}}}},activeEnemyDefinition(){return {rule:{rpgStats:{perception:6}}}},dc211TrapTest(){trapSeen=JSON.parse(JSON.stringify(profiles[0].rpgUniverse.exploration));return true},
 renderRpgUniverseEditor(){},reloadRpgGameplayFromProfileId(){},applyRpgGameplayPreset(){}};
context.window=context;
vm.runInNewContext(code,context);
const api=context.GensCanonicalPerception1678107;
assert.ok(api,'API Perception absente');
assert.equal(profiles[0].rpgUniverse.stats.active.includes('perception'),true,'Perception doit être activée à la migration');
assert.equal(profiles[0].rpgUniverse.stats.dynamicDefinitions.find(x=>x.id==='perception').defaultValue,2);
const x={participants:['aldren','lyra','brom'],index:0,last:{map:{size:5,cells:Array(25).fill('floor')}},positions:{aldren:0,lyra:3,brom:2},enemyCells:{}};
assert.deepEqual(Array.from(context.DungeonSpatial313.participatingHeroes(x,'aldren',3,true)),['aldren','lyra'],'chaque allié doit utiliser sa propre Perception pour rejoindre');
assert.equal(context.enemyFormObject().rule.perception,7,'la Perception canonique ennemi doit alimenter la portée de détection historique');
assert.equal(context.activeEnemyDefinition().rule.perception,6,'le runtime ennemi doit lire rpgStats.perception');
context.dc211TrapTest();
assert.equal(trapSeen.trapDetectionStat,'perception');
assert.equal(trapSeen.trapDetectionRadius,4,'le rayon de piège doit suivre la Perception du héros actif');
assert.equal(profiles[0].rpgUniverse.exploration.trapDetectionStat,'agilite','les anciens réglages restent conservés comme compatibilité');
assert.equal(profiles[0].rpgUniverse.exploration.trapDetectionRadius,2,'le fallback historique ne doit pas être écrasé');
console.log('V16.78.107 canonical perception: OK');
