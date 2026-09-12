import assert from 'node:assert/strict';
import {createDungeonTestSession} from '../src/modes/rpg/dungeon-test-session.js';
import {startDungeonCombat,executeDungeonHeroSkill,advanceDungeonEnemyTurns,reconcileDungeonCombatResult,activeDungeonEnemies} from '../src/modes/rpg/dungeon-combat-runtime.js';
import {buildDungeonRoomGridModel} from '../src/modes/rpg/dungeon-room-grid-view.js';

const worldDraft={
  world:{id:'world-1',name:'Test',startRoomId:'room-1',zones:['zone-1']},
  zones:[{id:'zone-1',name:'Zone',roomIds:['room-1']}],
  rooms:[{id:'room-1',zoneId:'zone-1',name:'Départ',kind:'room'}],
  links:[],
};
const emptyLayout=roomId=>({id:roomId,roomId,name:'Départ',width:8,height:8,cells:{},walls:[],doors:[],markers:[],interactions:[],entities:[]});

const session=createDungeonTestSession({universe:{heroes:[]},worldDraft,layoutProvider:emptyLayout});
assert.equal(session.ok,true);
assert.equal(session.demo,true);
assert.deepEqual(session.universe.bestiary[0].loot,[{itemId:'demo_bone',quantityMin:1,quantityMax:1,chance:100}]);

const initialGrid=buildDungeonRoomGridModel({
  universe:session.universe,
  roomRuntime:session.roomRuntime,
  roomLayout:emptyLayout('room-1'),
  spatial:session.spatial,
});
assert.equal(initialGrid.ok,true);
assert.deepEqual(initialGrid.actors.map(actor=>actor.id).sort(),['demo_enemy_instance','demo_hero']);

const started=startDungeonCombat({
  roomRuntime:session.roomRuntime,
  heroRuntimes:session.heroRuntimes,
  engagerHeroId:session.focusedHeroId,
  universe:session.universe,
  spatial:session.spatial,
  spatialConfig:{combatAssistRange:3},
  random:()=>0,
});
assert.equal(started.ok,true);
assert.equal(started.combat.activeActorId,'demo_hero');

const firstHit=executeDungeonHeroSkill({
  combat:started.combat,
  heroRuntimes:session.heroRuntimes,
  universe:session.universe,
  skillId:'demo_sword',
  targetId:'demo_enemy_instance',
  actionId:'demo-flow-hit-1',
  spatial:session.spatial,
  spatialConfig:{combatAssistRange:3},
  randomPercent:()=>0,
});
assert.equal(firstHit.ok,true);
assert.equal(firstHit.combat.actors.demo_enemy_instance.state.resources.demo_hp.current,4);
assert.equal(firstHit.combat.activeActorId,'demo_enemy_instance');

const enemyTurn=advanceDungeonEnemyTurns({
  combat:firstHit.combat,
  universe:session.universe,
  spatial:session.spatial,
  spatialConfig:{combatAssistRange:3},
  random:()=>0,
  randomPercent:()=>0,
});
assert.equal(enemyTurn.ok,true);
assert.equal(enemyTurn.actions.length,1);
assert.equal(enemyTurn.actions[0].skillId,'demo_claw');
assert.equal(enemyTurn.combat.actors.demo_hero.state.resources.demo_hp.current,10);
assert.equal(enemyTurn.combat.activeActorId,'demo_hero');

const finalHit=executeDungeonHeroSkill({
  combat:enemyTurn.combat,
  heroRuntimes:session.heroRuntimes,
  universe:session.universe,
  skillId:'demo_sword',
  targetId:'demo_enemy_instance',
  actionId:'demo-flow-hit-2',
  spatial:session.spatial,
  spatialConfig:{combatAssistRange:3},
  randomPercent:()=>0,
});
assert.equal(finalHit.ok,true);
assert.equal(finalHit.combat.phase,'ended');
assert.equal(finalHit.combat.winner,'heroes');
assert.equal(finalHit.combat.actors.demo_enemy_instance.ko,true);

const reconciled=reconcileDungeonCombatResult({
  combat:finalHit.combat,
  roomRuntime:session.roomRuntime,
  heroRuntimes:session.heroRuntimes,
  universe:session.universe,
  random:()=>0,
});
assert.equal(reconciled.ok,true);
assert.equal(reconciled.outcome,'victory');
assert.equal(reconciled.roomCleared,true);
assert.deepEqual(reconciled.defeatedEnemyIds,['demo_enemy_instance']);
assert.equal(activeDungeonEnemies(reconciled.roomRuntime,'room-1').length,0);
const defeated=reconciled.roomRuntime.rooms['room-1'].entities.find(entity=>entity.id==='demo_enemy_instance');
assert.equal(defeated.defeated,true);
assert.equal(defeated.data.creatureRuntime.lootClaimed,true);
assert.deepEqual(defeated.data.creatureRuntime.lootDrops,[{itemId:'demo_bone',quantity:1}]);
assert.equal(reconciled.heroRuntimes[0].state.resources.demo_hp.current,10);

const finalGrid=buildDungeonRoomGridModel({
  universe:session.universe,
  roomRuntime:reconciled.roomRuntime,
  roomLayout:emptyLayout('room-1'),
  spatial:session.spatial,
});
assert.equal(finalGrid.ok,true);
assert.deepEqual(finalGrid.actors.map(actor=>actor.id),['demo_hero'],'defeated enemy pawn must disappear from the live board');

console.log('rpg-dungeon-demo-flow.test.mjs: ok');
