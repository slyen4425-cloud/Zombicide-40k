const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-zone-content-167824.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const runtime={participants:['aldren'],index:0,room:1,positions:{aldren:0},remaining:{aldren:3},enemyCells:{random:3},roomStates:{},last:{kind:'enemy',worldRuntime167823:true,worldDungeonId:'d1',worldNodeId:'n1',map:{size:3,width:3,height:3,cells:['entry','floor','floor','enemy','floor','floor','floor','floor','exit'],entryIdx:0,exitIdx:8}}};
const store=storage({[RT]:JSON.stringify(runtime)});
let enemies=[{id:'random',enemyId:'dng_orc',hp:5,dungeonRoom:1}];
let seq=0;
let scenes=[],sceneSeq=0;
const heroState={inventory:[],gold:5,wounds:0};
const room={id:'room1',name:'Crypte exacte',width:3,height:3,cells:Array.from({length:9},(_,i)=>({terrain:'floor',object:i===0?'entry':i===8?'exit':null}))};
const graph={id:'d1',name:'Monde exact',startNodeId:'n1',nodes:[{id:'n1',roomId:'room1',label:'Crypte'}],edges:[]};
const context={console,Math,Date,localStorage:store,setTimeout(){return 1},
 DungeonWorldBuilder167821:{findDungeon(id){return id==='d1'?graph:null},loadLibrary(){return [graph]}},
 DungeonRoomCreator100:{findRoom(id){return id==='room1'?JSON.parse(JSON.stringify(room)):null}},
 DungeonWorldRuntime167823:{getConfig(){return {enabled:true,dungeonId:'d1'}}},
 DungeonSpatial313:{ensure(x){return x},persist(x){x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))};return x}},
 DungeonCore01:{explore(){return true},render(){return true}},
 loadActiveEnemies(){return enemies},saveActiveEnemies(v){enemies=v},
 loadDungeonSceneElements(){return JSON.parse(JSON.stringify(scenes))},saveDungeonSceneElements(v){scenes=JSON.parse(JSON.stringify(v))},addDungeonSceneElement(v){const el={id:"scene-"+(++sceneSeq),...v};const next=JSON.parse(JSON.stringify(scenes));next.push(JSON.parse(JSON.stringify(el)));scenes=next;return el},removeDungeonSceneElement(id){scenes=scenes.filter(e=>String(e.id)!==String(id));return true},
 trackSpawnedEnemyInstances(type,qty,roomNo){const ids=[];for(let i=0;i<qty;i++){const id='fixed-'+(++seq);ids.push(id);enemies.push({id,enemyId:type,hp:7,dungeonRoom:roomNo})}return ids},
 loadState(){return heroState},key(id){return 'hero:'+id},makeInventoryEntry(itemId){return {itemId}},gensHeroGold(){return heroState.gold},showToast(){},modal(){}}
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-zone-content-167824.js'});
const api=context.DungeonZoneContent167824;
assert.ok(api,'zone content API must load');
const hpUnset=api.normalizeContent({mode:'fixed',enemies:[{enemyId:'dng_skeleton',hp:null},{enemyId:'dng_ghoul'},{enemyId:'dng_wraith',hp:''},{enemyId:'dng_orc',hp:9}]});assert.equal(hpUnset.enemies[0].hp,null,'null hp must stay unset and use the enemy base HP');assert.equal(hpUnset.enemies[1].hp,null,'missing hp must stay unset');assert.equal(hpUnset.enemies[2].hp,null,'blank hp must stay unset');assert.equal(hpUnset.enemies[3].hp,9,'an explicit authored hp must still be preserved');
assert.equal(api.APP_VERSION,'16.78.24');
api.saveZoneContent('d1','n1',{mode:'fixed',enemies:[{id:'e1',enemyId:'dng_skeleton',qty:2,cell:4,hasKey:true}],chests:[{id:'ch1',cell:5,rarity:'rare',gold:20,items:[{itemId:'potion_heal',qty:2}]}],traps:[{id:'t1',cell:6,trapType:'damage',damage:3,once:true}],puzzles:[{id:'p1',cell:2,refId:'puzzle_001'}],items:[{id:'i1',cell:7,itemId:'dloot_old_coin',qty:1}],npcs:[{id:'n1npc',cell:1,npcId:'npc_alrik',label:'Alrik'}]});
assert.equal(api.applyCurrentZone(),true);
assert.equal(scenes.length,1,'exact authored chest must have one linked scene element');assert.equal(scenes[0].rarity,'rare','scene chest must use authored rarity instead of a random rarity');assert.equal(scenes[0].exactChest167824,true);assert.equal(scenes[0].exactChestId167824,'ch1');assert.equal(scenes[0].rarity,'rare');
let x=JSON.parse(store.getItem(RT));
assert.equal(enemies.some(e=>e.id==='random'),false,'fixed mode must remove generated enemies in this room');
const fixed=enemies.filter(e=>e.enemyId==='dng_skeleton');
assert.equal(fixed.length,2,'exact quantity must be spawned');
assert.deepEqual(fixed.map(e=>x.enemyCells[e.id]),[4,4],'exact enemy cell must be respected');
assert.equal(x.last.keyEnemyId,fixed[0].id,'configured key carrier must become room key enemy');
assert.equal(x.last.map.cells[5],'chest');
assert.equal(x.last.map.cells[6],'trap');
assert.equal(x.last.map.cells[2],'puzzle');
assert.equal(x.last.map.cells[7],'item');
assert.equal(x.last.worldContentApplied167824.mode,'fixed');
assert.equal(api.applyCurrentZone(),false,'render/revisit must not reapply and respawn fixed content');
assert.equal(enemies.length,2);

x.positions.aldren=5;store.setItem(RT,JSON.stringify(x));
assert.equal(api.openChest('ch1'),true,'exact chest must open once');assert.equal(scenes.length,0,'opening an exact chest must remove its linked legacy scene element');
assert.equal(heroState.gold,25,'exact chest gold must use existing hero gold state');
assert.equal(heroState.inventory.filter(i=>i.itemId==='potion_heal').length,2,'exact chest items must use existing inventory');
assert.equal(api.openChest('ch1'),false,'opened chest must never pay twice');
x=JSON.parse(store.getItem(RT));
assert.equal(x.worldContentState167824.d1.n1.openedChests.ch1,true);
assert.equal(x.last.map.cells[5],'floor');

assert.equal(api.triggerTrap('t1'),true);
assert.equal(heroState.wounds,3,'direct-damage trap must affect existing hero state');
assert.equal(api.triggerTrap('t1'),false,'one-shot trap cannot trigger twice');

x=JSON.parse(store.getItem(RT));x.last.worldContentApplied167824=null;x.enemyCells={random2:3};store.setItem(RT,JSON.stringify(x));enemies.push({id:'random2',enemyId:'dng_orc',hp:5,dungeonRoom:1});
api.saveZoneContent('d1','n1',{mode:'mixed',enemies:[{id:'mix',enemyId:'dng_ghoul',qty:1,cell:4}]});
assert.equal(api.applyCurrentZone({force:true}),true);
assert.ok(enemies.some(e=>e.id==='random2'),'mixed mode must preserve generated enemies');
assert.ok(enemies.some(e=>e.enemyId==='dng_ghoul'),'mixed mode must add configured enemy');

x=JSON.parse(store.getItem(RT));x.last.worldContentApplied167824=null;x.last.worldZoneContent167824={mode:'fixed',enemies:[{id:'inh',enemyId:'dng_wraith',qty:2,cell:3}],chests:[{id:'inhch',cell:5,rarity:'common',gold:1,items:[]}],traps:[],puzzles:[],npcs:[],items:[]};store.setItem(RT,JSON.stringify(x));api.saveZoneContent('d1','n1',{mode:'inherit'});assert.equal(api.applyCurrentZone({force:true}),true,'an inherited authored zone must apply the effective room template content');x=JSON.parse(store.getItem(RT));assert.equal(enemies.filter(e=>e.enemyId==='dng_wraith').length,2,'inherited authored enemies must be instantiated');assert.equal(x.last.map.cells[5],'chest','inherited authored chest marker must remain available to interactions');assert.equal(api.openChest('inhch'),true,'inherited authored chest must use the same effective content as enemy spawning');

assert.deepEqual(JSON.parse(JSON.stringify(api.parseRewardItems('potion_heal*2, sword_01 x 3'))),[{itemId:'potion_heal',qty:2},{itemId:'sword_01',qty:3}]);
assert.doesNotMatch(src,/function\s+(?:moveTo|launchCombat200|endTurn|goBackRoom)\s*\(/,'zone content layer must not rewrite stable movement/combat/timeline');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(workflow,/dungeon_zone_content_v167824\.test\.cjs/);
assert.match(workflow,/dungeon-zone-content-167824\.js\?v=167824/);
assert.match(sw,/dungeon-zone-content-167824\.js/);
const htmlArg=process.argv[2];if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');const world=html.indexOf('dungeon-world-runtime-167823.js?v=167838'),zone=html.indexOf('dungeon-zone-content-167824.js?v=167824');assert.ok(world>=0&&zone>world,'final site must load exact-zone content after authoritative world runtime')}
console.log('Dungeon exact zone content V16.78.24 regressions: OK');
require('./dungeon_room_visual_config_v167826.test.cjs');
require('./dungeon_room_grid_capture_v167830.test.cjs');
require('./dungeon_room_content_ui_v167831.test.cjs');
require('./gens_multiplayer_entry_v167831.test.cjs');
