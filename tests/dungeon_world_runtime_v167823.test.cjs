const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-runtime-167823.js'),'utf8');
const htmlArg=process.argv[2];
const RT='gensrpg_dungeon_runtime_v2';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const rooms=[
  {id:'room_a',name:'Entrée antique',width:15,height:15,cells:Array.from({length:225},(_,i)=>({terrain:'floor',object:i===0?'entry':(i===223||i===224)?'exit':null}))},
  {id:'room_b',name:'Salle des gardes',width:9,height:9,cells:Array.from({length:81},(_,i)=>({terrain:'floor',object:i===0?'entry':i===40?'enemy':i===80?'exit':null}))},
  {id:'room_c',name:'Crypte',width:10,height:10,cells:Array.from({length:100},(_,i)=>({terrain:'floor',object:i===0?'entry':i===50?'enemy':i===99?'exit':null}))}
];
const graph={id:'world_1',name:'Monde test',startNodeId:'A',nodes:[{id:'A',roomId:'room_a',label:'Entrée'},{id:'B',roomId:'room_b',label:'Gardes'},{id:'C',roomId:'room_c',label:'Crypte'}],edges:[{id:'ab',fromNodeId:'A',fromExitIndex:223,toNodeId:'B',toEntryIndex:0},{id:'ac',fromNodeId:'A',fromExitIndex:224,toNodeId:'C',toEntryIndex:0},{id:'ca',fromNodeId:'C',fromExitIndex:99,toNodeId:'A',toEntryIndex:0}]};
const localStorage=storage({[RT]:JSON.stringify({participants:['hero'],index:0,room:0,last:null,positions:{hero:-1},remaining:{hero:3},enemyCells:{},roomStates:{},heroRooms:{hero:0}})});
let enemies=[],legacyExploreCalls=0;
function read(){return JSON.parse(localStorage.getItem(RT)||'null')}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
const spatial={ensure(x){x.roomStates=x.roomStates||{};x.heroRooms=x.heroRooms||{};x.positions=x.positions||{};x.remaining=x.remaining||{};x.enemyCells=x.enemyCells||{}},persist(x){this.ensure(x);if(Number(x.room)>0)x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))}},setRoom(x,h,r){this.ensure(x);x.heroRooms[h]=Number(r)},activate(x,h){this.ensure(x);const r=Number(x.heroRooms[h]||0);x.room=r;const s=x.roomStates[String(r)];if(s){x.last=JSON.parse(JSON.stringify(s.last));x.enemyCells=JSON.parse(JSON.stringify(s.enemyCells||{}))}}};
const core={render(){return true},show(){return true},explore(){legacyExploreCalls++;const x=read();spatial.ensure(x);const h=x.participants[x.index]||'hero';if(Number(x.room)>0)spatial.persist(x);const from=Number(x.room)||0,to=from+1;x.room=to;x.heroRooms[h]=to;x.last={kind:'enemy',map:{size:6,width:6,height:6,cells:Array(36).fill('floor'),entryIdx:0,exitIdx:35}};x.positions[h]=0;x.enemyCells={[`e${to}`]:2};x.dc313LastTransition={heroId:h,from,to,created:true};enemies.push({id:`e${to}`,enemyId:'dng_skeleton',hp:1,dungeonRoom:to});write(x);return true}};
const ctx={console,Math,Date,localStorage,setTimeout(fn){fn();return 1},clearTimeout(){},globalThis:null,window:null,DungeonCore01:core,DungeonSpatial313:spatial,DungeonWorldBuilder167821:{findDungeon(id){return id==='world_1'?JSON.parse(JSON.stringify(graph)):null},loadLibrary(){return [JSON.parse(JSON.stringify(graph))]},validation(g){return {valid:!!g?.startNodeId,errors:[],warnings:[]}}},DungeonRoomCreator100:{findRoom(id){const r=rooms.find(x=>x.id===String(id));return r?JSON.parse(JSON.stringify(r)):null}},activeDungeonAdventureId(){return 'adv_1'},loadActiveEnemies(){return JSON.parse(JSON.stringify(enemies))},saveActiveEnemies(next){enemies=JSON.parse(JSON.stringify(next))},showToast(){},modal(){return false},dungeonRoomExitLocked102(){return false}};
ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-world-runtime-167823.js'});
const api=ctx.DungeonWorldRuntime167823;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.34');api.saveConfig({enabled:true,dungeonId:'world_1'},'adv_1');for(const node of ['A','B','C'])api.saveZoneContent('world_1',node,{mode:'fixed',enemies:node==='B'?[{enemyId:'dng_skeleton',cell:40}]:[],chests:[]});
assert.equal(core.explore(),true);let x=read();assert.equal(legacyExploreCalls,0);assert.equal(x.room,1);assert.equal(x.last.worldNodeId,'A');assert.equal(x.last.worldAuthoritativeDirect167834,true);assert.equal(x.last.map.size,15);assert.equal(x.last.map.cells.length,225);assert.equal(x.positions.hero,0);assert.equal(enemies.length,0);
x.positions.hero=224;write(x);assert.equal(core.explore(),true);x=read();assert.equal(legacyExploreCalls,0);assert.equal(x.room,2);assert.equal(x.last.worldNodeId,'C');assert.equal(x.last.map.width,10);assert.equal(x.last.map.height,10);assert.equal(x.positions.hero,0);
x.positions.hero=99;write(x);assert.equal(core.explore(),true);x=read();assert.equal(x.room,1);assert.equal(x.last.worldNodeId,'A');assert.equal(legacyExploreCalls,0);assert.equal(x.last.map.cells.length,225);
x.positions.hero=1;write(x);assert.equal(core.explore(),false,'unconnected position in a multi-exit zone is blocked');assert.equal(read().room,1);
api.saveConfig({enabled:false,dungeonId:'world_1'},'adv_1');const before=read().room;core.explore();assert.equal(legacyExploreCalls,1);assert.equal(read().room,before+1);
assert.match(src,/content\.mode==="fixed"/);assert.match(src,/worldAuthoritativeDirect167834:true/);assert.match(src,/function directFixedNode/);assert.doesNotMatch(src,/function\s+(?:dungeonEncounter|dungeonBossRoom|launchCombat|endTurn|trackSpawnedEnemyInstances)\s*\(/);
if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');assert.ok(html.indexOf('assets/dungeon/dungeon-world-runtime-167823.js?v=167823')>=0)}
console.log('Dungeon authoritative World Runtime V16.78.34 regressions: OK');
