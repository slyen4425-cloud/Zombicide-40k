import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createSpatialState, setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { combatTargetEntriesForSkill } from '../src/modes/rpg/combat-target-ui.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');

const universe={
  heroes:[{id:'hero-def',name:'Archer'}],
  bestiary:[{id:'enemy-def',name:'Squelette'}],
};
const combat=createCombatState({combatants:[
  {id:'hero-1',side:'heroes',initiative:10,state:{},metadata:{heroId:'hero-def'}},
  {id:'enemy-1',side:'enemies',initiative:1,state:{},metadata:{creatureId:'enemy-def'}},
]});
const skill={id:'shot',name:'Tir',target:'enemy',data:{attackStyle:'ranged',rangeMin:1,rangeMax:3,requiresLineOfSight:true}};
const config={mode:'tactical',rangeEnabled:true,lineOfSightEnabled:true,diagonal:false};

let spatial=createSpatialState({zoneId:'room-1'});
spatial=setActorPosition(spatial,'hero-1',{x:0,y:0,zoneId:'room-1'});
spatial=setActorPosition(spatial,'enemy-1',{x:4,y:0,zoneId:'room-1'});
const openLayout={id:'room-1',width:6,height:4,cells:{},walls:[],doors:[]};

let targets=combatTargetEntriesForSkill({universe,combat,skill,spatial,config:{...config,roomLayout:openLayout}});
assert.deepEqual(targets,[],'enemy outside range must not be exposed by the target UI');

spatial=setActorPosition(spatial,'hero-1',{x:2,y:0,zoneId:'room-1'});
targets=combatTargetEntriesForSkill({universe,combat,skill,spatial,config:{...config,roomLayout:openLayout}});
assert.equal(targets.length,1,'repositioning into range must immediately make the enemy targetable');
assert.equal(targets[0].id,'enemy-1');
assert.equal(targets[0].distance,2);

spatial=setActorPosition(spatial,'hero-1',{x:0,y:0,zoneId:'room-1'});
spatial=setActorPosition(spatial,'enemy-1',{x:2,y:0,zoneId:'room-1'});
const losBlockedLayout={...openLayout,walls:[{x:0,y:0,edge:'east',blocksMovement:false,blocksVision:true}]};
targets=combatTargetEntriesForSkill({universe,combat,skill,spatial,config:{...config,roomLayout:losBlockedLayout}});
assert.deepEqual(targets,[],'enemy behind authored vision blocker must not be exposed by the target UI');

const targetUiSource=fs.readFileSync(path.join(root,'src/modes/rpg/combat-target-ui.js'),'utf8');
const moveUiSource=fs.readFileSync(path.join(root,'src/modes/rpg/dungeon-combat-movement-ui.js'),'utf8');
const commandUiSource=fs.readFileSync(path.join(root,'src/ui/dungeon-combat-command-ui.js'),'utf8');
assert.match(targetUiSource,/source:source\|\|skill/);
assert.match(targetUiSource,/patchCombatTargetUiContext/);
assert.match(moveUiSource,/roomLayout/);
assert.match(moveUiSource,/syncDungeonCombatTargetControls/);
assert.match(moveUiSource,/spatial:out\.spatial/);
assert.match(commandUiSource,/Aucune cible valide depuis cette position/);

console.log('rpg-combat-target-spatial-ui: ok');
