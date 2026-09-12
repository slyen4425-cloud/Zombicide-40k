import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolveDungeonCharacterAsset, resolveDungeonItemAsset, resolveDungeonWorldAsset } from '../src/modes/rpg/dungeon-asset-resolver.js';
import { buildDungeonRoomGridModel, renderDungeonRoomGrid } from '../src/modes/rpg/dungeon-room-grid-view.js';
import { buildHeroSheetModel, renderHeroSheet } from '../src/modes/rpg/hero-sheet.js';
import { renderDungeonCombatItemControls } from '../src/modes/rpg/dungeon-combat-item-ui.js';

assert.equal(resolveDungeonCharacterAsset({name:'Aldren'}),'../assets/dungeon/creatures/dng_aldren.png');
assert.equal(resolveDungeonCharacterAsset({name:'Lyra'}),'../assets/dungeon/creatures/dng_lyra.png');
assert.equal(resolveDungeonCharacterAsset({name:'Nécromancien'}),'../assets/dungeon/creatures/dng_necromancer.png');
assert.equal(resolveDungeonCharacterAsset({name:'Wyverne'}),'../assets/dungeon/creatures/dng_wyvern.png');
assert.equal(resolveDungeonCharacterAsset({artId:'https://example.test/custom-hero.webp'}),'https://example.test/custom-hero.webp');
assert.equal(resolveDungeonItemAsset({name:'Bottes de cuir'}),'../assets/dungeon/items/ditem_leather_boots.png');
assert.equal(resolveDungeonItemAsset({name:'Lame de Cendre'}),'../assets/dungeon/items/ditem_ash_blade.png');
assert.equal(resolveDungeonItemAsset({artId:'ditem_guardian_staff.png'}),'../assets/dungeon/items/ditem_guardian_staff.png');
assert.equal(resolveDungeonItemAsset({artId:'/custom/item.png'}),'/custom/item.png');
assert.equal(resolveDungeonWorldAsset('door_closed'),'../assets/dungeon/creatures/dungeon_door_closed.png');
assert.equal(resolveDungeonWorldAsset('wall'),'../assets/dungeon/creatures/dungeon_wall.png');

const universe={
  stats:[],resources:[],skills:[],effects:[],forms:[],
  items:[
    {id:'leather-boots',name:'Bottes de cuir',icon:'🥾',enabled:true,kind:'armor',rarity:'uncommon',stackable:false,maxStack:1,equipSlots:['feet'],occupiesSlots:[],conditionIds:[],effectIds:[],skillIds:[],tags:[],data:{}},
    {id:'ash-scroll',name:'Lame de Cendre',icon:'🔥',artId:'ditem_ash_blade.png',enabled:true,kind:'consumable',rarity:'rare',stackable:true,maxStack:5,equipSlots:[],occupiesSlots:[],conditionIds:[],effectIds:[],skillIds:[],tags:[],data:{combatUsable:true,targetKind:'self'}},
  ],
  sets:[{id:'leather-set',name:'Set de cuir',icon:'🧩',enabled:true,itemIds:['leather-boots'],thresholds:[]}],
  heroes:[{id:'aldren',name:'Aldren',icon:'🛡️',enabled:true,inventorySlots:['feet'],startingItems:[{itemId:'leather-boots',quantity:1}],startingEquipment:[{itemId:'leather-boots',slot:'feet'}]}],
  bestiary:[{id:'skel',name:'Squelette',icon:'💀',enabled:true}],
  combat:{interaction:{directCombat:true,gmFullControl:false}},
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
assert.equal(heroModel.inventory[0].assetUrl,'../assets/dungeon/items/ditem_leather_boots.png');
assert.equal(heroModel.equipment[0].item.assetUrl,'../assets/dungeon/items/ditem_leather_boots.png');
assert.equal(heroModel.setProgress[0].equippedCount,1);
assert.equal(heroModel.setProgress[0].pieces[0].assetUrl,'../assets/dungeon/items/ditem_leather_boots.png');
const heroHtml=renderHeroSheet(heroModel);
assert.match(heroHtml,/Portrait de Aldren/);
assert.match(heroHtml,/dng_aldren\.png/);
assert.match(heroHtml,/ditem_leather_boots\.png/);
assert.match(heroHtml,/hero-set-piece equipped/);

const combat={phase:'turn',activeActorId:'aldren',actors:{aldren:{id:'aldren',side:'heroes',ko:false,state:{}}}};
const heroRuntimes=[{instanceId:'aldren',heroId:'aldren',inventory:{entries:[{entryId:'entry-1',itemId:'ash-scroll',quantity:1}],equipment:{},slots:[],sequence:0}}];
const combatItemHtml=renderDungeonCombatItemControls({universe,combat,heroRuntimes});
assert.match(combatItemHtml,/dungeon-combat-item-preview/);
assert.match(combatItemHtml,/ditem_ash_blade\.png/);
assert.match(combatItemHtml,/Utiliser l'objet/);

const index=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(index,/dungeon-assets-ui\.css/);
const css=await fs.readFile(new URL('../src/ui/dungeon-assets-ui.css',import.meta.url),'utf8');
assert.match(css,/\.dungeon-board-pawn\.has-art/);
assert.match(css,/\.hero-avatar\.has-art img/);
assert.match(css,/\.hero-set-piece/);
assert.match(css,/\.dungeon-combat-item-art/);

console.log('rpg dungeon real assets presentation: ok');
