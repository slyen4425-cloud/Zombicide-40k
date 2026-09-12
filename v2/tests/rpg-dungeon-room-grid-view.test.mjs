import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildDungeonRoomGridModel,renderDungeonRoomGrid} from '../src/modes/rpg/dungeon-room-grid-view.js';
import {createDungeonTestSession} from '../src/modes/rpg/dungeon-test-session.js';

const worldDraft={
  world:{id:'world-1',name:'Test',startRoomId:'room-1',zones:['zone-1']},
  zones:[{id:'zone-1',name:'Zone',roomIds:['room-1']}],
  rooms:[{id:'room-1',zoneId:'zone-1',name:'Départ',kind:'room'}],
  links:[],
};
const layout={id:'layout-1',roomId:'room-1',name:'Départ',width:8,height:8,cells:{'0,0':{x:0,y:0,terrain:'water',blocked:false}},walls:[{id:'w1',x:3,y:3,kind:'wall'}],doors:[{id:'d1',x:7,y:1,entry:true}],markers:[],interactions:[],entities:[]};
const out=createDungeonTestSession({universe:{heroes:[]},worldDraft,layoutProvider:()=>structuredClone(layout)});
assert.equal(out.ok,true);
assert.equal(out.demo,true);
assert.equal(out.spatial.positions.demo_hero.x,1);
assert.equal(out.spatial.positions.demo_hero.y,1);
assert.equal(out.spatial.positions.demo_enemy_instance.x,4);
assert.equal(out.spatial.positions.demo_enemy_instance.y,1);
assert.deepEqual(out.roomRuntime.spatial,out.spatial,'demo positions must live on the runtime used by the board, without persistence');

const demoLayout={...layout,entities:out.roomRuntime.rooms['room-1'].entities};
const model=buildDungeonRoomGridModel({universe:out.universe,roomRuntime:out.roomRuntime,roomLayout:demoLayout});
assert.equal(model.ok,true);
assert.equal(model.width,8);
assert.equal(model.height,8);
assert.equal(model.cells.length,64);
assert.equal(model.actors.length,2);
assert.deepEqual(model.actors.map(actor=>[actor.id,actor.side,actor.x,actor.y]),[
  ['demo_hero','hero',1,1],
  ['demo_enemy_instance','enemy',4,1],
]);

const html=renderDungeonRoomGrid({universe:out.universe,roomRuntime:out.roomRuntime,roomLayout:demoLayout});
assert.match(html,/class="editor-section dungeon-board-section"/);
assert.match(html,/--dungeon-cols:8/);
assert.match(html,/data-dungeon-board-actor="demo_hero"/);
assert.match(html,/data-dungeon-board-actor="demo_enemy_instance"/);
assert.match(html,/Aventurier de test/);
assert.match(html,/Squelette de test/);
assert.match(html,/terrain-water/);
assert.match(html,/🚪⬅️/);
assert.match(html,/🧱/);

const viewSource=fs.readFileSync(new URL('../src/modes/rpg/dungeon-gameplay-view.js',import.meta.url),'utf8');
assert.match(viewSource,/renderDungeonRoomGrid/);
assert.match(viewSource,/roomLayout,spatial/);
assert.match(viewSource,/\$\{board\}/);
const indexSource=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(indexSource,/dungeon-board\.css/);

console.log('rpg-dungeon-room-grid-view.test.mjs: ok');
