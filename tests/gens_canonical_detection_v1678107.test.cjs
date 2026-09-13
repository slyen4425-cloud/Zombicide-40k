const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-canonical-detection-1678107.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const equipment=fs.readFileSync(path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js'),'utf8');
const heroEditor=fs.readFileSync(path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(src,/APP_VERSION="16\.78\.107"/);
assert.match(src,/STAT_ID="perception"/);
assert.match(src,/name:"Détection"/);
assert.match(src,/rpgTrapDetectionRadius/);
assert.match(src,/rpgEnemyDetectionRadius/);
assert.match(src,/rpgCombatParticipationRange/);
assert.match(src,/participatingHeroes/);
assert.match(src,/dc211TrapTest/);
assert.match(bridge,/gens-canonical-detection-1678107\.js\?v=1678107/);
assert.match(equipment,/runtimeDefs/,'equipment/set/evolution editors must source canonical active stats');
assert.match(heroEditor,/runtimeDefs/,'hero and ability editors must source canonical active stats');
assert.match(heroEditor,/scaleAttribute/,'ability scaling must stay connected to active stats');
assert.match(sw,/gensrpg-cache-16\.78\.107-canonical-detection/);
assert.match(sw,/gens-canonical-detection-1678107\.js/);

const profile={id:'u1',name:'Test',rpgUniverse:{stats:{active:['force'],dynamicDefinitions:[]},exploration:{trapDetectionRadius:2,enemyDetectionRadius:2},movement:{combatParticipationRange:3}}};
const states={leader:{rpgAttributes:{perception:1}},near:{rpgAttributes:{perception:4}},far:{rpgAttributes:{perception:2}},legacy:{rpgAttributes:{}}};
let saved=false;
const spatial={
  heroesHere(){return ['leader','near','far']},
  active(){return 'leader'},
  participatingHeroes(x,leader,maxRange,tactical=true){if(!tactical)return this.heroesHere(x);return this.heroesHere(x).filter(id=>id===leader||Number(x.distances[id])<=Number(maxRange))}
};
const context={
  console,
  setTimeout(fn){fn();return 1},
  clearTimeout(){},
  window:null,
  current:'leader',
  currentRpgProfile(){return profile},
  getActiveGameProfile(){return profile},
  loadGameProfiles(){return [profile]},
  saveGameProfiles(){saved=true},
  activeGameProfileId(){return 'u1'},
  getActiveGameProfileId(){return 'u1'},
  loadState(id){return states[id]||{rpgAttributes:{}}},
  CHARS:{leader:{dungeonStats:{}},near:{dungeonStats:{}},far:{dungeonStats:{}},legacy:{dungeonStats:{}}},
  findCustomHero(){return null},
  DungeonSpatial313:spatial,
  activeEnemyDefinition(){return {id:'wolf',rule:{perception:2,rpgStats:{perception:6}}}},
  dungeonEnemyRpgStats(){return {perception:6}},
  GensEnemyCanonicalStats1678105:{enabled(){return true}},
  GensCleanRpgStats167874:{
    value(id,key){return Number(states[id]?.rpgAttributes?.[key]??0)},
    def(id){return id==='perception'?{id,name:'Détection',defaultValue:2}:null}
  }
};
context.window=context;
vm.runInNewContext(src,context);
const api=context.GensCanonicalDetection1678107;
assert.ok(api,'canonical detection API must be exposed');
assert.ok(profile.rpgUniverse.stats.dynamicDefinitions.some(d=>d.id==='perception'&&d.name==='Détection'));
assert.ok(profile.rpgUniverse.stats.active.includes('perception'));
assert.ok(profile.rpgUniverse.stats.canonicalDetectionMigrated107);
assert.equal(saved,true,'new canonical detection definition must persist');
assert.equal(api.heroRange('near'),4);
assert.equal(api.heroRange('far'),2);
assert.equal(api.heroRange('legacy'),3,'heroes without an explicit value keep old ally range as compatibility base');
const fight=context.DungeonSpatial313.participatingHeroes({distances:{near:3,far:3}},'leader',99,true);
assert.deepEqual(Array.from(fight),['leader','near'],'each ally must use its own Detection range');
const enemy=context.activeEnemyDefinition('wolf');
assert.equal(enemy.rule.perception,6,'enemy detection runtime must use canonical enemy perception');
console.log('V16.78.107 canonical Detection: hero/enemy stat + legacy radius cleanup + per-ally combat participation OK');
