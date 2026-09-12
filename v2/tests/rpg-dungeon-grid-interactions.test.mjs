import assert from 'node:assert/strict';
import fs from 'node:fs';
import {focusedDungeonGridActions,executeFocusedDungeonGridAction,DUNGEON_GRID_INTERACTION_CONTRACT} from '../src/modes/rpg/dungeon-grid-interactions.js';
import {materializeRoomLayout} from '../src/modes/rpg/room-runtime.js';
import {createInventoryState} from '../src/modes/rpg/inventory-engine.js';
import {shortestRoomPathDistance} from '../src/modes/rpg/room-tactical-bridge.js';

assert.equal(DUNGEON_GRID_INTERACTION_CONTRACT.sameCellRequired,true);
assert.equal(DUNGEON_GRID_INTERACTION_CONTRACT.usesRuntimeDoorState,true);
assert.equal(DUNGEON_GRID_INTERACTION_CONTRACT.usesRoomInteractionEngine,true);
assert.equal(DUNGEON_GRID_INTERACTION_CONTRACT.outsideCombatOnly,true);

const layout={
  id:'room-layout',roomId:'room-1',width:3,height:2,cells:{},walls:[],markers:[],
  doors:[{id:'door-1',x:0,y:0,edge:'east',state:'closed',locked:false,keyItemId:null}],
  interactions:[
    {id:'chest-1',kind:'chest',name:'Coffre',enabled:true,attachment:{kind:'cell',x:0,y:0},conditionIds:[],effectIds:[],checkId:null,check:null,data:{}},
    {id:'far-switch',kind:'switch',name:'Levier loin',enabled:true,attachment:{kind:'cell',x:2,y:1},conditionIds:[],effectIds:[],checkId:null,check:null,data:{}},
  ],
};
const runtime={
  currentRoomId:'room-1',focusedHeroId:'hero-1',
  heroLocations:{'hero-1':{heroId:'hero-1',roomId:'room-1'}},
  rooms:{'room-1':{
    roomId:'room-1',entities:[],
    doors:{'door-1':{id:'door-1',state:'closed',locked:false,keyItemId:null}},
    interactions:{
      'chest-1':{id:'chest-1',enabled:true,triggered:false,completed:false,opened:false,attempts:0,lastOutcome:null,lastCheck:null,data:{}},
      'far-switch':{id:'far-switch',enabled:true,triggered:false,completed:false,opened:false,attempts:0,lastOutcome:null,lastCheck:null,data:{}},
    },
  }},
  spatial:{zoneId:'room-1',positions:{'hero-1':{x:0,y:0,zoneId:'room-1'}},blocked:[]},
  log:[],sequence:0,
};
const heroes=[{instanceId:'hero-1',heroId:'hero-1',active:true,ko:false,dead:false,state:{stats:{},resources:{}}}];
const inventory=createInventoryState();
const before=structuredClone({runtime,layout,heroes,inventory});

const actions=focusedDungeonGridActions({roomRuntime:runtime,heroRuntimes:heroes,spatial:runtime.spatial,roomLayout:layout});
assert.deepEqual(actions.map(action=>action.id).sort(),['door:door-1','interaction:chest-1']);
assert.equal(actions.some(action=>action.targetId==='far-switch'),false,'interaction on another cell must stay unavailable');
assert.deepEqual(focusedDungeonGridActions({roomRuntime:runtime,heroRuntimes:heroes,spatial:runtime.spatial,roomLayout:layout,activeCombat:{phase:'turn'}}),[],'grid interactions are disabled during combat');

const wrong=executeFocusedDungeonGridAction({roomRuntime:runtime,heroRuntimes:heroes,spatial:runtime.spatial,roomLayout:layout,inventory,actionId:'interaction:far-switch'});
assert.equal(wrong.ok,false);
assert.equal(wrong.reason,'dungeon-grid-action-unavailable');

const opened=executeFocusedDungeonGridAction({roomRuntime:runtime,heroRuntimes:heroes,spatial:runtime.spatial,roomLayout:layout,inventory,actionId:'door:door-1'});
assert.equal(opened.ok,true);
assert.equal(opened.roomRuntime.rooms['room-1'].doors['door-1'].state,'open');
const openedLayout=materializeRoomLayout(opened.roomRuntime,'room-1',layout);
assert.equal(openedLayout.doors[0].state,'open');
assert.equal(shortestRoomPathDistance(openedLayout,{x:0,y:0,zoneId:'room-1'},{x:1,y:0,zoneId:'room-1'}),1,'runtime-open door must immediately unblock the authored edge');

const chest=executeFocusedDungeonGridAction({roomRuntime:runtime,heroRuntimes:heroes,spatial:runtime.spatial,roomLayout:layout,inventory,universe:{},actionId:'interaction:chest-1'});
assert.equal(chest.ok,true);
assert.equal(chest.success,true);
assert.equal(chest.roomRuntime.rooms['room-1'].interactions['chest-1'].opened,true);
assert.equal(chest.roomRuntime.rooms['room-1'].interactions['chest-1'].completed,true);
assert.equal(chest.roomRuntime.rooms['room-1'].interactions['chest-1'].attempts,1);
assert.equal(focusedDungeonGridActions({roomRuntime:chest.roomRuntime,heroRuntimes:heroes,spatial:runtime.spatial,roomLayout:layout}).some(action=>action.targetId==='chest-1'),false,'completed chest interaction must disappear');

assert.deepEqual({runtime,layout,heroes,inventory},before,'grid interaction evaluation must not mutate source data');

const pageSource=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
assert.match(pageSource,/mountDungeonGridInteractionControls/);
assert.match(pageSource,/materializeRoomLayout/);
assert.match(pageSource,/kind:'dungeon-grid-interaction'/);
assert.match(pageSource,/if\(out\?\.spatial\) currentDungeonSpatial=/,'page must retain authoritative moved spatial state');

const uiSource=fs.readFileSync(new URL('../src/modes/rpg/dungeon-grid-interactions-ui.js',import.meta.url),'utf8');
assert.match(uiSource,/Interactions sur cette case/);
assert.match(uiSource,/executeFocusedDungeonGridAction/);

console.log('rpg-dungeon-grid-interactions.test.mjs: ok');
