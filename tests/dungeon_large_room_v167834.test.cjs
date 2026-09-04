const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-large-room-support-167834.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const PRIMARY='gensrpg_dungeon_primary_selection_v167833';
function storage(){const m=new Map();return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const localStorage=storage();
function read(){return JSON.parse(localStorage.getItem(RT)||'null')}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
function setPrimary(x){x?localStorage.setItem(PRIMARY,JSON.stringify(x)):localStorage.removeItem(PRIMARY)}
function reset(){write({participants:['hero'],index:0,room:0,last:null,positions:{hero:-1},remaining:{hero:3},enemyCells:{},heroRooms:{hero:0},roomStates:{}})}
let config={size:'large',roomGeometry:'fixed'},oldMode='generated',renderCount=0,zoneApply=0,worldSave=null,activeEnemies=[];
let randomValue=.42;const math=Object.create(Math);math.random=()=>randomValue;
function roomCells(w,h,entry,exit,wall,enemy){const a=Array.from({length:w*h},()=>({terrain:'floor',object:null}));a[entry].object='entry';a[exit].object='exit';if(Number.isInteger(wall))a[wall].terrain='wall';if(Number.isInteger(enemy))a[enemy].object='enemy';return a}
const roomA={id:'room-a',name:'Salle A exacte',width:6,height:6,roomType:'room',theme:'stone',cells:roomCells(6,6,0,35,5,14)};
const roomB={id:'room-b',name:'Salle B exacte',width:7,height:7,roomType:'room',theme:'crypt',cells:roomCells(7,7,6,42,13,24)};
const graph={id:'world-test',name:'Deux pièces',startNodeId:'A',nodes:[{id:'A',roomId:'room-a',label:'Salle A'},{id:'B',roomId:'room-b',label:'Salle B'}],edges:[{id:'AB',fromNodeId:'A',fromExitIndex:35,toNodeId:'B',toEntryIndex:6}]};
const core={
 render(){renderCount++;return true},show(){return true},
 explore(){
   if(oldMode==='blocked')return false;
   const before=read(),room=Number(before.room||0)+1,id='e'+room;
   const map={version:4,size:9,width:9,height:9,cells:Array(81).fill('floor'),entryIdx:0,exitIdx:80,heroIdx:0,enemies:[40],objective:{type:'reach_exit',status:'open'}};
   map.cells[0]='entry';map.cells[80]='exit';map.cells[40]='enemy';
   const last={kind:'enemy',room,title:'Legacy 9x9',map};
   if(before?.last?.worldNodeId)last.worldNodeId=before.last.worldNodeId; // métadonnée périmée reproduite volontairement
   if(oldMode==='authored'){last.customRoomRuntime167822=true;last.customRoomId='manual';last.map={version:4,size:7,width:7,height:7,cells:Array(49).fill('floor'),entryIdx:0,exitIdx:48};last.map.cells[0]='entry';last.map.cells[48]='exit'}
   const x={...before,room,last,positions:{...(before.positions||{}),hero:0},remaining:{...(before.remaining||{}),hero:3},enemyCells:{[id]:40},heroRooms:{...(before.heroRooms||{}),hero:room},dc313LastTransition:{heroId:'hero',from:room-1,to:room,created:true}};
   activeEnemies=[{id,enemyId:'dng_skeleton',hp:1,dungeonRoom:room}];write(x);return true;
 }
};
const ctx={console,Math:math,Date,localStorage,globalThis:null,window:null,document:null,loadDungeonConfig(){return config},loadActiveEnemies(){return activeEnemies.map(x=>({...x}))},loadDungeonSceneElements(){return []},saveDungeonSceneElements(){},activeDungeonAdventureId(){return 'adv'},DungeonCore01:core,
 DungeonWorldRuntime167823:{saveConfig(c){worldSave={...c};return c},getConfig(){return worldSave||{enabled:false,dungeonId:''}},currentPlan(){const x=read(),cur=String(x?.world167823?.heroNodes?.hero||x?.last?.worldNodeId||'');if(!cur)return {targetNodeId:'A',currentNodeId:'',edge:null};if(cur==='A')return {targetNodeId:'B',currentNodeId:'A',edge:{fromNodeId:'A',toNodeId:'B',fromExitIndex:35,toEntryIndex:6}};return {targetNodeId:'',currentNodeId:cur,edge:null}}},
 DungeonWorldBuilder167821:{findDungeon(id){return id==='world-test'?JSON.parse(JSON.stringify(graph)):null}},DungeonRoomCreator100:{findRoom(id){const r=id==='room-a'?roomA:id==='room-b'?roomB:null;return r?JSON.parse(JSON.stringify(r)):null}},
 DungeonZoneContent167824:{applyCurrentZone(){zoneApply++;return true}}};ctx.globalThis=ctx;ctx.window=ctx;
reset();vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-large-room-support-167834.js'});
const api=ctx.DungeonLargeRoom167834;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.36');assert.equal(api.MAX_SIZE,15);assert.equal(api.MIN_SIZE,6);assert.equal(api.PRIMARY_KEY,PRIMARY);
assert.equal(api.gridSize(),15,'large must mean 15x15');let direct=api.generate('enemy',5,15);assert.equal(direct.cells.length,225);assert.equal(direct.largeRoom167835,true);

// Aventure générée : l'ancien config monde ne doit plus ressusciter si la préparation dit explicitement "adventure".
config={size:'large',roomGeometry:'fixed'};setPrimary({kind:'adventure',id:'adv'});worldSave={enabled:true,dungeonId:'world-test'};oldMode='generated';reset();core.explore();let x=read();
assert.equal(x.last.map.size,15,'a stale editor world config must not override the canonical generated-adventure selection');assert.equal(x.last.map.cells.length,225);assert.equal(x.last.worldNodeId,undefined);
config={size:'small',roomGeometry:'fixed'};worldSave={enabled:false,dungeonId:''};reset();core.explore();x=read();assert.equal(x.last.map.size,6);assert.equal(x.last.map.cells.length,36);
config={size:'medium',roomGeometry:'fixed'};reset();core.explore();x=read();assert.equal(x.last.map.size,9,'fixed medium intentionally remains 9x9');
config={roomGeometry:'random'};randomValue=.999;reset();core.explore();x=read();assert.equal(x.last.map.size,15,'random mode must be able to reach 15x15 through the real explore path');
randomValue=0;reset();core.explore();x=read();assert.equal(x.last.map.size,6,'random mode must also reach 6x6');

config={size:'large',roomGeometry:'fixed'};setPrimary({kind:'adventure',id:'adv'});oldMode='authored';reset();core.explore();x=read();assert.equal(x.last.map.size,7);assert.equal(x.last.customRoomId,'manual');

// Une sortie refusée ne crée rien. Un vieux dc313LastTransition.created=true ne doit pas tromper le garde.
oldMode='blocked';setPrimary({kind:'adventure',id:'adv'});const blockedMap={version:4,size:9,width:9,height:9,cells:Array(81).fill('floor'),entryIdx:0,exitIdx:80};blockedMap.cells[0]='entry';blockedMap.cells[80]='exit';write({participants:['hero'],index:0,room:1,last:{kind:'world',room:1,map:blockedMap,exitLocked:true},positions:{hero:0},remaining:{hero:3},enemyCells:{},heroRooms:{hero:1},roomStates:{},dc313LastTransition:{heroId:'hero',from:0,to:1,created:true}});const blockedBefore=JSON.stringify(read().last.map);assert.equal(core.explore(),false);assert.equal(JSON.stringify(read().last.map),blockedBefore,'a blocked explore must never rebuild or resize the current room');

// Monde construit : le PRIMARY_KEY doit suffire, même si le bridge UI n'est pas chargé.
oldMode='generated';delete ctx.DungeonWorldSessionBridge167832;setPrimary({kind:'world',id:'world-test',settingsAdventureId:'adv'});worldSave={enabled:false,dungeonId:''};zoneApply=0;reset();core.explore();x=read();
assert.deepEqual(worldSave,{enabled:true,dungeonId:'world-test'},'the canonical pre-game selection must resynchronise the legacy runtime config before explore');
assert.equal(x.last.map.width,6);assert.equal(x.last.map.height,6);assert.equal(x.last.map.cells.length,36);assert.equal(x.last.map.cells[0],'entry');assert.equal(x.last.map.cells[5],'wall');assert.equal(x.last.map.cells[35],'exit');assert.equal(x.last.worldNodeId,'A');assert.equal(x.last.customRoomId,'room-a');assert.equal(x.world167823.roomNodes['1'],'A');

// Deuxième exploration : l'ancien moteur conserve volontairement worldNodeId=A dans son résultat.
// Le plan B doit gagner et charger réellement la deuxième pièce, pas recharger A.
core.explore();x=read();assert.equal(x.last.worldNodeId,'B','the planned target node must win over stale worldNodeId metadata');assert.equal(x.last.customRoomId,'room-b');assert.equal(x.last.map.width,7);assert.equal(x.last.map.height,7);assert.equal(x.last.map.cells.length,49);assert.equal(x.last.map.cells[6],'entry');assert.equal(x.last.map.cells[13],'wall');assert.equal(x.last.map.cells[42],'exit');assert.equal(x.world167823.roomNodes['2'],'B');assert.ok(zoneApply>=2,'Zone content must be applied after each authoritative world geometry');

assert.match(src,/readPrimarySelection/);assert.match(src,/retireDuplicateWorldActivation/);assert.match(src,/plan\?\.targetNodeId\|\|after\?\.last\?\.worldNodeId/,'the planned node must have priority over stale metadata');assert.doesNotMatch(src,/after\?\.last\?\.worldNodeId\|\|plan\?\.targetNodeId/);assert.doesNotMatch(src,/Math\.min\(9/,'V16.78.36 must not reintroduce a 9x9 clamp');
console.log('Dungeon real room-size + single World Builder authority V16.78.36 regressions: OK');
