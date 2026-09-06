const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-secondary-branch-content-fix-167860.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const branchId='branch_A_39_attic';
let runtime={room:7,index:0,participants:['lyra'],positions:{lyra:0},last:{authoredRuntime167839:true,worldDungeonId:'world-1',worldNodeId:branchId,customRoomId:'attic',worldZoneContent167824:{mode:'fixed',enemies:[{id:'e1',enemyId:'dng_skeleton',qty:1,cell:8}],chests:[{id:'c1',cell:5,rarity:'epic',gold:0,items:[],label:''}]}}};
const store={[RT]:JSON.stringify(runtime)};
const mainGraph={id:'world-1',nodes:[{id:'A',roomId:'room-a'}],edges:[]};
const rooms={'room-a':{id:'room-a',name:'Main',width:9,height:9},attic:{id:'attic',name:'Vieux grenier',width:4,height:3}};
let scene=[
 {id:'legacy',kind:'chest',room:7,cellIndex:2,name:'Coffre common',rarity:'common'},
 {id:'exact',kind:'chest',room:7,cellIndex:5,name:'Coffre common',rarity:'common',exactChest167824:true,exactChestId167824:'c1',exactDungeonId167824:'world-1',exactNodeId167824:branchId},
 {id:'other-room',kind:'chest',room:3,cellIndex:1,name:'Other',rarity:'common'}
];
let observed={nodeFound:false,max:-1,enemyCell:-1,applyCalls:0};
const builder={findDungeon(id){return id==='world-1'?mainGraph:null}};
const zone={
 normalizeContent(v){return JSON.parse(JSON.stringify(v||{}))},
 applyCurrentZone(){
   observed.applyCalls++;
   const x=JSON.parse(store[RT]);
   const g=builder.findDungeon(x.last.worldDungeonId);
   const node=g.nodes.find(n=>String(n.id)===String(x.last.worldNodeId));
   observed.nodeFound=!!node;
   const room=node?rooms[node.roomId]:null;
   observed.max=Math.max(0,(Number(room?.width)||0)*(Number(room?.height)||0)-1);
   observed.enemyCell=Math.max(0,Math.min(observed.max,8));
   return true;
 }
};
const timers=[];
const context={console,JSON,Math,Date,setTimeout(fn,ms){timers.push({fn,ms});return timers.length},localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=String(v)}},DungeonWorldBuilder167821:builder,DungeonZoneContent167824:zone,DungeonAuthoredRuntime167839:{graph(){return mainGraph}},DungeonRoomCreator100:{findRoom(id){return rooms[id]||null}},loadDungeonSceneElements(){return scene},saveDungeonSceneElements(v){scene=JSON.parse(JSON.stringify(v))}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-secondary-branch-content-fix-167860.js'});
const api=context.DungeonSecondaryBranchContentFix167860;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.60');
zone.applyCurrentZone();
assert.equal(observed.nodeFound,true,'virtual secondary branch node must be exposed while exact content is applied');
assert.equal(observed.max,11,'branch cell clamp must use the real 4x3 room dimensions');
assert.equal(observed.enemyCell,8,'configured enemy cell must not collapse to case 0');
assert.equal(scene.some(e=>e.id==='legacy'),false,'legacy/random chest must be removed from fixed authored branch');
const exact=scene.find(e=>e.id==='exact');assert.ok(exact,'configured exact chest must remain');assert.equal(exact.rarity,'epic');assert.equal(exact.name,'Coffre epic','exact chest display metadata must follow configured rarity');
assert.ok(scene.some(e=>e.id==='other-room'),'other rooms must remain untouched');
const saved=JSON.parse(store[RT]);assert.equal(saved.last.secondaryBranchContentFixed167860,true);
// A normal authored graph node must bypass the secondary-branch repair.
runtime=JSON.parse(store[RT]);runtime.room=3;runtime.last.worldNodeId='A';runtime.last.customRoomId='room-a';delete runtime.last.secondaryBranchContentFixed167860;store[RT]=JSON.stringify(runtime);scene.push({id:'normal-legacy',kind:'chest',room:3,cellIndex:2,name:'Legacy normal'});observed.nodeFound=false;zone.applyCurrentZone();assert.ok(scene.some(e=>e.id==='normal-legacy'),'normal authored nodes must not be scrubbed by the secondary-branch fix');
console.log('Dungeon secondary branch content fix V16.78.60: OK');
