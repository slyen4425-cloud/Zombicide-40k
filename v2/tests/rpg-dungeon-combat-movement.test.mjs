import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createSpatialState, setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { evaluateAttackPosition } from '../src/modes/rpg/tactical-combat.js';
import { dungeonCombatMovementState, moveActiveDungeonHeroInCombat, DUNGEON_COMBAT_MOVEMENT_CONTRACT } from '../src/modes/rpg/dungeon-combat-movement.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');

const combat=createCombatState({combatants:[
  {id:'hero-1',side:'heroes',initiative:10,state:{stats:{},resources:{hp:{current:10,max:10}}}},
  {id:'enemy-1',side:'enemies',initiative:1,state:{stats:{},resources:{hp:{current:10,max:10}}}},
]});
combat.metadata={kind:'dungeon-room-combat',roomId:'room-1'};
const heroRuntimes=[{instanceId:'hero-1',heroId:'hero-def',active:true,ko:false,dead:false,state:{stats:{},resources:{hp:{current:10,max:10}}}}];
let spatial=createSpatialState({zoneId:'room-1'});
spatial=setActorPosition(spatial,'hero-1',{x:0,y:0,zoneId:'room-1'});
spatial=setActorPosition(spatial,'enemy-1',{x:4,y:0,zoneId:'room-1'});
const layout={id:'room-1',width:6,height:4,cells:{},walls:[],doors:[]};
const config={defaultMovement:3,mode:'tactical',movementEnabled:true,rangeEnabled:true,lineOfSightEnabled:true,defaultRangedRange:3};

assert.equal(DUNGEON_COMBAT_MOVEMENT_CONTRACT.reusesTacticalCombatMoveActor,true);
let moveState=dungeonCombatMovementState({combat,heroRuntimes,spatialConfig:config,roomLayout:layout});
assert.equal(moveState.enabled,true);
assert.equal(moveState.allowance,3);
assert.equal(moveState.remaining,3);

const ranged={data:{attackStyle:'ranged',rangeMin:1,rangeMax:3,requiresLineOfSight:true}};
const before=evaluateAttackPosition({spatial,combat,actorId:'hero-1',targetId:'enemy-1',source:ranged,config:{...config,roomLayout:layout}});
assert.equal(before.ok,false);
assert.equal(before.reason,'target-unreachable');

const first=moveActiveDungeonHeroInCombat({combat,heroRuntimes,spatial,roomLayout:layout,target:{x:2,y:0},spatialConfig:config});
assert.equal(first.ok,true);
assert.equal(first.distance,2);
assert.equal(first.movement.remaining,1);
assert.equal(first.combat.phase,'turn');
assert.equal(first.combat.activeActorId,'hero-1');
assert.equal(first.combat.turnSequence,combat.turnSequence);
assert.deepEqual(first.spatial.positions['hero-1'],{x:2,y:0,zoneId:'room-1'});
assert.deepEqual(first.roomRuntime,null);

const after=evaluateAttackPosition({spatial:first.spatial,combat:first.combat,actorId:'hero-1',targetId:'enemy-1',source:ranged,config:{...config,roomLayout:layout}});
assert.equal(after.ok,true);
assert.equal(after.distance,2);

const occupied=moveActiveDungeonHeroInCombat({combat:first.combat,heroRuntimes,spatial:first.spatial,roomLayout:layout,target:{x:4,y:0},spatialConfig:config});
assert.equal(occupied.ok,false);
assert.equal(occupied.reason,'combat-move-cell-occupied');

const second=moveActiveDungeonHeroInCombat({combat:first.combat,heroRuntimes,spatial:first.spatial,roomLayout:layout,target:{x:3,y:0},spatialConfig:config});
assert.equal(second.ok,true);
assert.equal(second.distance,1);
assert.equal(second.movement.remaining,0);

const noBudget=moveActiveDungeonHeroInCombat({combat:second.combat,heroRuntimes,spatial:second.spatial,roomLayout:layout,target:{x:3,y:1},spatialConfig:config});
assert.equal(noBudget.ok,false);
assert.equal(noBudget.reason,'combat-move-budget-spent');

const nextTurn=structuredClone(second.combat);
nextTurn.turnSequence+=2;
nextTurn.activeActorId='hero-1';
moveState=dungeonCombatMovementState({combat:nextTurn,heroRuntimes,spatialConfig:config,roomLayout:layout});
assert.equal(moveState.remaining,3,'a new turn sequence resets the tactical movement budget');

const wallLayout={...layout,walls:[{x:3,y:0,edge:'south',blocksMovement:true,blocksVision:true}]};
const blocked=moveActiveDungeonHeroInCombat({combat:nextTurn,heroRuntimes,spatial:second.spatial,roomLayout:wallLayout,target:{x:3,y:1},spatialConfig:config});
assert.equal(blocked.ok,true,'the engine may route around a wall when a legal path remains in budget');

const uiSource=fs.readFileSync(path.join(root,'src/modes/rpg/dungeon-combat-movement-ui.js'),'utf8');
const pageSource=fs.readFileSync(path.join(root,'src/modes/rpg/rpg-page.js'),'utf8');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(uiSource,/data-dungeon-combat-move-status/);
assert.match(uiSource,/data-dungeon-board-cell/);
assert.match(pageSource,/mountDungeonCombatMovementUi/);
assert.match(pageSource,/kind:'combat-move'/);
assert.match(indexSource,/dungeon-combat-movement\.css/);
console.log('rpg-dungeon-combat-movement: ok');
