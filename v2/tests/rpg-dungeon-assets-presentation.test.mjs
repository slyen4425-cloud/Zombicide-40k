import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolveDungeonCharacterAsset, resolveDungeonWorldAsset } from '../src/modes/rpg/dungeon-asset-resolver.js';
import { buildDungeonRoomGridModel, renderDungeonRoomGrid } from '../src/modes/rpg/dungeon-room-grid-view.js';
import { buildHeroSheetModel, renderHeroSheet } from '../src/modes/rpg/hero-sheet.js';

assert.equal(resolveDungeonCharacterAsset({name:'Aldren'}),'../assets/dungeon/creatures/dng_aldren.png');
assert.equal(resolveDungeonCharacterAsset({name:'Lyra'}),'../assets/dungeon/creatures/dng_lyra.png');
assert.equal(resolveDungeonCharacterAsset({name:'Nécromancien'}),'../assets/dungeon/creatures/dng_necromancer.png');
assert.equal(resolveDungeonCharacterAsset({name:'Wyverne'}),'../assets/dungeon/creatures/dng_wyvern.png');
assert.equal(resolveDungeonWorldAsset('door_closed'),'../assets/dungeon/creatures/dungeon_door_closed.png');
assert.equal(resolveDungeonWorldAsset('wall'),'../assets/dungeon/creatures/dungeon_wall.png');

const universe={
  stats:[],resources:[],skills:[],sets:[],effects:[],forms:[],items:[],
  heroes:[{id:'aldren',name:'Aldren',icon:'🛡️',enabled:true,inventorySlots:[],startingItems:[],startingEquipment:[]}],
  bestiary:[{id:'skel',name:'Squelette',icon:'💀',enabled:true}],
};
const roomRuntime={
  currentRoomId:'room-1',focusedHeroId:'aldren',heroLocations:{aldren:{heroId:'aldren',roomId:'room-1'}},
  rooms:{'room-1':{entities:[{id:'enemy-1',kind:'creature',active:true,data:{creatureRuntime:{instanceId:'enemy-1',creatureId:'skel',active:true}}}]}}
};
const spatial={zoneId:'room-1',positions:{aldren:{x:0,y:0},'enemy-1':{x:1,y:0}}};
const roomLayout={width:2,height:1,cells:{'0,0':{x:0,y:0,terrain:'floor',blocked:false},'1,0':{x:1,y:0,terrain:'water',blocked:false}},doors:[],markers:[],walls:[],interactions:[]};
const model=buildDungeonRoomGridModel({universe,roomRuntime,roomLayout,spatial});
assert.equal(model.actors[0].assetUrl,'../assets/dungeon/creatures/dng_aldren.png');
assert.equal(model.actors[1].assetUrl,'../assets/dungeon/creatures/dng_skeleton.png');
const boardHtml=renderDungeonRoomGrid({universe,roomRuntime,roomLayout,spatial});
assert.match(boardHtml,/dng_aldren\.png/);
assert.match(boardHtml,/dng_skeleton\.png/);
assert.match(boardHtml,/dungeon_floor_water\.png/);
assert.match(boardHtml,/has-art/);

const heroModel=buildHeroSheetModel(universe.heroes[0],universe);
assert.equal(heroModel.assetUrl,'../assets/dungeon/creatures/dng_aldren.png');
const heroHtml=renderHeroSheet(heroModel);
assert.match(heroHtml,/Portrait de Aldren/);
assert.match(heroHtml,/dng_aldren\.png/);

const index=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(index,/dungeon-assets-ui\.css/);
const css=await fs.readFile(new URL('../src/ui/dungeon-assets-ui.css',import.meta.url),'utf8');
assert.match(css,/\.dungeon-board-pawn\.has-art/);
assert.match(css,/\.hero-avatar\.has-art img/);

console.log('rpg dungeon real assets presentation: ok');
