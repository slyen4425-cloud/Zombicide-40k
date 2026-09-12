import assert from 'node:assert/strict';
import fs from 'node:fs';
import {moveFocusedDungeonHeroOnGrid,DUNGEON_GRID_MOVEMENT_CONTRACT} from '../src/modes/rpg/dungeon-grid-movement.js';

assert.equal(DUNGEON_GRID_MOVEMENT_CONTRACT.usesSpatialCore,true);
assert.equal(DUNGEON_GRID_MOVEMENT_CONTRACT.usesRoomTacticalBridge,true);
assert.equal(DUNGEON_GRID_MOVEMENT_CONTRACT.outsideCombatOnly,true);
assert.equal(DUNGEON_GRID_MOVEMENT_CONTRACT.mutatesDefinitions,false);

const roomRuntime={
  currentRoomId:'room-1',
  focusedHeroId:'hero-1',
  heroLocations:{'hero-1':{heroId:'hero-1',roomId:'room-1'}},
  rooms:{'room-1':{entities:[]}},
};
const heroRuntimes=[{instanceId:'hero-1',heroId:'hero-1',active:true,ko:false,dead:false,state:{stats:{move:3},resources:{}}}];
const spatial={zoneId:'room-1',positions:{'hero-1':{x:0,y:0,zoneId:'room-1'}},blocked:[]};
const layout={id:'layout-1',roomId:'room-1',width:4,height:4,cells:{},walls:[],doors:[],markers:[],interactions:[]};
const before=structuredClone({roomRuntime,heroRuntimes,spatial,layout});

{
  const out=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:layout,target:{x:2,y:0},spatialConfig:{movementStatId:'move',defaultMovement:1,diagonal:false}});
  assert.equal(out.ok,true);
  assert.equal(out.distance,2);
  assert.equal(out.allowance,3);
  assert.deepEqual(out.spatial.positions['hero-1'],{x:2,y:0,zoneId:'room-1'});
  assert.deepEqual(out.roomRuntime.spatial.positions['hero-1'],{x:2,y:0,zoneId:'room-1'});
}

{
  const out=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:layout,target:{x:3,y:3},spatialConfig:{movementStatId:'move',diagonal:false}});
  assert.equal(out.ok,false);
  assert.equal(out.reason,'dungeon-move-out-of-range');
}

{
  const blocked={...layout,cells:{'1,0':{x:1,y:0,terrain:'rock',blocked:true}}};
  const out=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:blocked,target:{x:1,y:0},spatialConfig:{movementStatId:'move'}});
  assert.equal(out.ok,false);
  assert.equal(out.reason,'dungeon-move-out-of-range');
}

{
  const walled={...layout,walls:[{id:'wall-1',x:0,y:0,edge:'east',kind:'wall',blocksMovement:true,blocksVision:true}]};
  const out=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:walled,target:{x:1,y:0},spatialConfig:{movementStatId:'move'}});
  assert.equal(out.ok,false,'solid authored wall must block the direct move');
}

{
  const closedDoor={...layout,doors:[{id:'door-1',x:0,y:0,edge:'east',state:'closed',locked:false}]};
  const denied=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:closedDoor,target:{x:1,y:0},spatialConfig:{movementStatId:'move'}});
  assert.equal(denied.ok,false,'closed door must block movement');
  const openDoor={...layout,doors:[{id:'door-1',x:0,y:0,edge:'east',state:'open',locked:false}]};
  const allowed=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:openDoor,target:{x:1,y:0},spatialConfig:{movementStatId:'move'}});
  assert.equal(allowed.ok,true,'open unlocked door must allow movement');
}

{
  const out=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes,spatial,roomLayout:layout,target:{x:1,y:0},spatialConfig:{movementStatId:'move'},activeCombat:{phase:'turn'}});
  assert.equal(out.ok,false);
  assert.equal(out.reason,'dungeon-move-combat-active');
}

{
  const koHeroes=[{...heroRuntimes[0],ko:true}];
  const out=moveFocusedDungeonHeroOnGrid({roomRuntime,heroRuntimes:koHeroes,spatial,roomLayout:layout,target:{x:1,y:0},spatialConfig:{movementStatId:'move'}});
  assert.equal(out.ok,false);
  assert.equal(out.reason,'dungeon-move-hero-unavailable');
}

assert.deepEqual({roomRuntime,heroRuntimes,spatial,layout},before,'movement evaluation must not mutate source runtime/config objects');

const viewSource=fs.readFileSync(new URL('../src/modes/rpg/dungeon-gameplay-view.js',import.meta.url),'utf8');
assert.match(viewSource,/moveFocusedDungeonHeroOnGrid/);
assert.match(viewSource,/data-dungeon-board-cell/);
assert.match(viewSource,/dungeon-grid-move/);
assert.match(viewSource,/dungeon-move-target/);
assert.match(viewSource,/currentSpatial=clone\(out\.spatial\)/);
assert.match(viewSource,/currentRuntime=out\.roomRuntime/);
assert.match(viewSource,/spatial:effectiveSpatial/,'combat must receive the same effective spatial state shown on the board');

console.log('rpg-dungeon-grid-movement.test.mjs: ok');
