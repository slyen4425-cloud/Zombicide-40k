import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createSpatialState,setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { evaluateAttackPosition,createCombatMovementState,moveCombatActor,resetActorCombatMovement,targetCoverModifier } from '../src/modes/rpg/tactical-combat.js';

const config={mode:'tactical',defaultMovement:3,combatAssistRange:3,defaultMeleeRange:1,defaultRangedRange:5,rangedContactModifier:-20};
let spatial=createSpatialState({zoneId:'room-1'});
spatial=setActorPosition(spatial,'lyra',{x:0,y:0,zoneId:'room-1'});
spatial=setActorPosition(spatial,'skeleton',{x:4,y:0,zoneId:'room-1'});
spatial=setActorPosition(spatial,'ghoul',{x:1,y:0,zoneId:'room-1'});

const combat=createCombatState({combatants:[
 {id:'lyra',side:'heroes',initiative:20,state:{stats:{movement:3}}},
 {id:'skeleton',side:'enemies',initiative:10,state:{}},
 {id:'ghoul',side:'enemies',initiative:5,state:{}},
]});

const bow={id:'bow',data:{attackStyle:'ranged',rangeMin:1,rangeMax:6,requiresAmmo:true,ammoType:'arrow'}};
const sword={id:'sword',data:{attackStyle:'melee',rangeMax:1}};

const ranged=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:bow,config});
assert.equal(ranged.ok,true);
assert.equal(ranged.distance,4);
assert.equal(ranged.modifier,-20);
assert.deepEqual(ranged.contactEnemyIds,['ghoul']);

const meleeFar=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:sword,config});
assert.equal(meleeFar.ok,false);
assert.equal(meleeFar.reason,'target-unreachable');

const coverLayout={width:6,height:2,cells:{'4,0':{x:4,y:0,terrain:'rubble',coverModifier:-15}},walls:[],doors:[]};
assert.equal(targetCoverModifier(spatial,'skeleton',{roomLayout:coverLayout}),-15);
const rangedWithCover=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:bow,config:{...config,roomLayout:coverLayout}});
assert.equal(rangedWithCover.ok,true);
assert.equal(rangedWithCover.coverModifier,-15);
assert.equal(rangedWithCover.modifier,-35,'contact and target cover modifiers must combine');
const ignoreCoverBow={id:'piercing-bow',data:{attackStyle:'ranged',rangeMin:1,rangeMax:6,ignoresCover:true}};
const ignoreCover=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:ignoreCoverBow,config:{...config,roomLayout:coverLayout}});
assert.equal(ignoreCover.coverModifier,0);
assert.equal(ignoreCover.modifier,-20);

let moveState=createCombatMovementState(combat,config);
const moved=moveCombatActor({spatial,combat,actorId:'lyra',target:{x:2,y:1,zoneId:'room-1'},moveState,config});
assert.equal(moved.ok,true);
assert.equal(moved.distance,3);
assert.equal(moved.remaining,0);
spatial=moved.spatial;
moveState=moved.moveState;

const bowAfterMove=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:bow,config});
assert.equal(bowAfterMove.ok,true);
assert.equal(bowAfterMove.distance,3);
assert.equal(bowAfterMove.modifier,0);

const swordAfterMove=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:sword,config});
assert.equal(swordAfterMove.ok,false);

const reset=resetActorCombatMovement(moveState,combat.actors.lyra,config);
assert.equal(reset.remaining.lyra,3);
assert.equal(reset.spent.lyra,0);

const narrative=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:sword,config:{mode:'narrative'}});
assert.equal(narrative.ok,true);
assert.equal(narrative.distance,null);

console.log('rpg-tactical-combat.test.mjs: ok');
