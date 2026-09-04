const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-large-room-support-167834.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
function storage(){const m=new Map();return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const localStorage=storage();
function read(){return JSON.parse(localStorage.getItem(RT)||'null')}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
function reset(){write({participants:['hero'],index:0,room:0,last:null,positions:{hero:-1},remaining:{hero:3},enemyCells:{},heroRooms:{hero:0},roomStates:{}})}
let config={size:'large',roomGeometry:'fixed'},primary={kind:'adventure',id:'adv'},oldMode='generated',renderCount=0,zoneApply=0,worldSave=null,activeEnemies=[];
let randomValue=.42;const math=Object.create(Math);math.random=()=>randomValue;
const exactCells=Array.from({length:36},()=>({terrain:'floor',object:null}));exactCells[0].object='entry';exactCells[5].terrain='wall';exactCells[35].object='exit';exactCells[14].object='enemy';
const exactRoom={id:'room_exact',name:'Pièce exacte',width:6,height:6,roomType:'room',theme:'stone',cells:exactCells};
const graph={id:'world-test',name:'Deux pièces',startNodeId:'A',nodes:[{id:'A',roomId:'room_exact',label:'Salle A'}],edges:[]};
const core={
 render(){renderCount++;return true},show(){return true},
 explore(){
   const before=read(),room=Number(before.room||0)+1,id='e'+room;
   const map={version:4,size:9,width:9,height:9,cells:Array(81).fill('floor'),entryIdx:0,exitIdx:80,heroIdx:0,enemies:[40],objective:{type:'reach_exit',status:'open'}};
   map.cells[0]='entry';map.cells[80]='exit';map.cells[40]='enemy';
   const last={kind:'enemy',room,title:'Legacy 9x9',map};
   if(oldMode==='authored'){last.customRoomRuntime167822=true;last.customRoomId='manual';last.map={version:4,size:7,width:7,height:7,cells:Array(49).fill('floor'),entryIdx:0,exitIdx:48};last.map.cells[0]='entry';last.map.cells[48]='exit'}
   const x={...before,room,last,positions:{...(before.positions||{}),hero:0},remaining:{...(before.remaining||{}),hero:3},enemyCells:{[id]:40},heroRooms:{...(before.heroRooms||{}),hero:room},dc313LastTransition:{heroId:'hero',from:room-1,to:room,created:true}};
   activeEnemies=[{id,enemyId:'dng_skeleton',hp:1,dungeonRoom:room}];write(x);return true;
 }
};
const ctx={console,Math:math,Date,localStorage,globalThis:null,window:null,loadDungeonConfig(){return config},loadActiveEnemies(){return activeEnemies.map(x=>({...x}))},loadDungeonSceneElements(){return []},saveDungeonSceneElements(){},activeDungeonAdventureId(){return 'adv'},DungeonCore01:core,
 DungeonWorldSessionBridge167832:{primary(){return primary}},
 DungeonWorldRuntime167823:{saveConfig(c){worldSave={...c};return c},getConfig(){return worldSave||{enabled:false,dungeonId:''}},currentPlan(){return primary.kind==='world'?{targetNodeId:'A',currentNodeId:'',edge:null}:null}},
 DungeonWorldBuilder167821:{findDungeon(id){return id==='world-test'?JSON.parse(JSON.stringify(graph)):null}},DungeonRoomCreator100:{findRoom(id){return id==='room_exact'?JSON.parse(JSON.stringify(exactRoom)):null}},
 DungeonZoneContent167824:{applyCurrentZone(){zoneApply++;return true}}};ctx.globalThis=ctx;ctx.window=ctx;
reset();vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-large-room-support-167834.js'});
const api=ctx.DungeonLargeRoom167834;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.35');assert.equal(api.MAX_SIZE,15);assert.equal(api.MIN_SIZE,6);
assert.equal(api.gridSize(),15,'large must mean 15x15');let direct=api.generate('enemy',5,15);assert.equal(direct.cells.length,225);assert.equal(direct.largeRoom167835,true);

// Régression exacte du téléphone : le vieux Core écrit réellement une 9x9 pendant explore().
// Le runtime final doit être réparé, pas seulement l’API de génération isolée.
config={size:'large',roomGeometry:'fixed'};primary={kind:'adventure',id:'adv'};worldSave={enabled:false,dungeonId:''};oldMode='generated';reset();core.explore();let x=read();
assert.equal(x.last.map.size,15,'the actual DungeonCore01.explore result must no longer stay capped at 9');assert.equal(x.last.map.cells.length,225);assert.equal(x.last.map.largeRoom167835,true);assert.ok(Number(x.enemyCells.e1)>=0&&Number(x.enemyCells.e1)<225);

config={size:'small',roomGeometry:'fixed'};reset();core.explore();x=read();assert.equal(x.last.map.size,6);assert.equal(x.last.map.cells.length,36);
config={size:'medium',roomGeometry:'fixed'};reset();core.explore();x=read();assert.equal(x.last.map.size,9,'fixed medium intentionally remains 9x9');
config={roomGeometry:'random'};randomValue=.999;reset();core.explore();x=read();assert.equal(x.last.map.size,15,'random mode must be able to reach 15x15 through the real explore path');
randomValue=0;reset();core.explore();x=read();assert.equal(x.last.map.size,6,'random mode must also reach 6x6');

// Une pièce déjà créée par Room Creator ne doit jamais être redimensionnée par le garde généré.
config={size:'large',roomGeometry:'fixed'};primary={kind:'adventure',id:'adv'};oldMode='authored';reset();core.explore();x=read();assert.equal(x.last.map.size,7);assert.equal(x.last.customRoomId,'manual');

// Monde construit : même si le vieux chemin tente encore d’écrire 9x9, la pièce choisie gagne,
// indépendamment du mode de contenu de Zone.
oldMode='generated';primary={kind:'world',id:'world-test'};worldSave={enabled:false,dungeonId:''};zoneApply=0;reset();core.explore();x=read();
assert.deepEqual(worldSave,{enabled:true,dungeonId:'world-test'},'the selected World Builder world must be resynchronised before explore');
assert.equal(x.last.map.width,6);assert.equal(x.last.map.height,6);assert.equal(x.last.map.cells.length,36);assert.equal(x.last.map.cells[0],'entry');assert.equal(x.last.map.cells[5],'wall');assert.equal(x.last.map.cells[35],'exit');assert.equal(x.last.worldNodeId,'A');assert.equal(x.last.customRoomId,'room_exact');assert.equal(x.world167823.roomNodes['1'],'A');assert.equal(zoneApply,1,'exact/mixed Zone content gets a chance to apply after geometry authority is restored');

assert.match(src,/wrapExplore/);assert.match(src,/roomWasCreated/);assert.match(src,/worldGeometryAuthoritative167835/);assert.doesNotMatch(src,/Math\.min\(9/,'V16.78.35 must not reintroduce a 9x9 clamp');
console.log('Dungeon real room-size + World Builder geometry V16.78.35 regressions: OK');
