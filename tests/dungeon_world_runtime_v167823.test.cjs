const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-runtime-167823.js'),'utf8');
const htmlArg=process.argv[2];
const RT='gensrpg_dungeon_runtime_v2';

function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},dump(){return Object.fromEntries(m)}}}
const rooms=[
  {id:'room_a',name:'Entrée antique',width:2,height:2,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:'exit'},{terrain:'floor',object:'exit'}]},
  {id:'room_b',name:'Salle des gardes',width:2,height:2,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:'enemy'},{terrain:'floor',object:'exit'},{terrain:'floor',object:null}]},
  {id:'room_c',name:'Crypte',width:2,height:2,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:'enemy'},{terrain:'floor',object:'exit'},{terrain:'floor',object:null}]}
];
const graph={id:'world_1',name:'Monde test',startNodeId:'A',nodes:[
  {id:'A',roomId:'room_a',label:'Entrée'},
  {id:'B',roomId:'room_b',label:'Gardes'},
  {id:'C',roomId:'room_c',label:'Crypte'}
],edges:[
  {id:'ab',fromNodeId:'A',fromExitIndex:2,toNodeId:'B',toEntryIndex:0},
  {id:'ac',fromNodeId:'A',fromExitIndex:3,toNodeId:'C',toEntryIndex:0},
  {id:'ca',fromNodeId:'C',fromExitIndex:2,toNodeId:'A',toEntryIndex:0}
]};
const localStorage=storage({[RT]:JSON.stringify({participants:['hero'],index:0,room:0,last:null,positions:{hero:-1},remaining:{hero:3},enemyCells:{},roomStates:{},heroRooms:{hero:0}})});
let enemies=[];
function read(){return JSON.parse(localStorage.getItem(RT)||'null')}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
const spatial={
  ensure(x){x.roomStates=x.roomStates||{};x.heroRooms=x.heroRooms||{};x.positions=x.positions||{};x.remaining=x.remaining||{};x.enemyCells=x.enemyCells||{}},
  persist(x){this.ensure(x);if(Number(x.room)>0)x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))}},
  setRoom(x,h,r){this.ensure(x);x.heroRooms[h]=Number(r)},
  activate(x,h){this.ensure(x);const r=Number(x.heroRooms[h]||0);x.room=r;const s=x.roomStates[String(r)];if(s){x.last=JSON.parse(JSON.stringify(s.last));x.enemyCells=JSON.parse(JSON.stringify(s.enemyCells||{}))}}
};
const core={
  render(){return true},show(){return true},
  explore(){
    const x=read();spatial.ensure(x);const h=x.participants[x.index]||'hero';if(Number(x.room)>0)spatial.persist(x);
    const from=Number(x.room)||0,to=from+1;x.room=to;x.heroRooms[h]=to;x.last={kind:'enemy',map:{size:2,width:2,height:2,cells:['entry','floor','enemy','exit'],entryIdx:0,exitIdx:3}};x.positions[h]=0;x.enemyCells={[`e${to}`]:2};x.dc313LastTransition={heroId:h,from,to,created:true};enemies.push({id:`e${to}`,enemyId:'dng_skeleton',hp:1,dungeonRoom:to});write(x);return true
  }
};
const ctx={console,Math,Date,localStorage,setTimeout(fn){fn();return 1},clearTimeout(){},globalThis:null,window:null,DungeonCore01:core,DungeonSpatial313:spatial,
  DungeonWorldBuilder167821:{findDungeon(id){return id==='world_1'?JSON.parse(JSON.stringify(graph)):null},loadLibrary(){return [JSON.parse(JSON.stringify(graph))]},validation(g){return {valid:!!g?.startNodeId,errors:[],warnings:[]}}},
  DungeonRoomCreator100:{findRoom(id){const r=rooms.find(x=>x.id===String(id));return r?JSON.parse(JSON.stringify(r)):null}},
  activeDungeonAdventureId(){return 'adv_1'},loadActiveEnemies(){return JSON.parse(JSON.stringify(enemies))},saveActiveEnemies(next){enemies=JSON.parse(JSON.stringify(next))},showToast(){},modal(){return false}
};
ctx.globalThis=ctx;ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-world-runtime-167823.js'});
const api=ctx.DungeonWorldRuntime167823;
assert.ok(api,'authoritative world runtime API must load');
assert.equal(api.APP_VERSION,'16.78.23');
assert.equal(api.chooseEdge(graph,'A',2).toNodeId,'B');
assert.equal(api.chooseEdge(graph,'A',3).toNodeId,'C');
assert.equal(api.chooseEdge(graph,'A',99),null,'multiple exits require exact current exit');

api.saveConfig({enabled:true,dungeonId:'world_1'},'adv_1');
let content=api.saveZoneContent('world_1','B',{mode:'fixed',enemies:[{enemyId:'dng_skeleton',cell:1}],chests:[{cell:3,rarity:'rare'}]});
assert.equal(content.mode,'fixed');
assert.equal(api.getZoneContent('world_1','B').enemies[0].enemyId,'dng_skeleton');

assert.equal(core.explore(),true,'first explore should enter exact start zone');
let x=read();
assert.equal(x.room,1);assert.equal(x.last.worldNodeId,'A');assert.equal(x.last.customRoomId,'room_a');assert.equal(x.world167823.roomNodes['1'],'A');assert.equal(x.positions.hero,0);

x.positions.hero=3;write(x);
assert.equal(core.explore(),true,'secondary exit must route to its connected zone');
x=read();assert.equal(x.room,2);assert.equal(x.last.worldNodeId,'C');assert.equal(x.last.customRoomId,'room_c');assert.equal(x.world167823.nodeRooms.C,2);assert.equal(x.positions.hero,0);

x.positions.hero=2;write(x);const enemiesBefore=enemies.map(e=>e.id);
assert.equal(core.explore(),true,'route back to an already visited node should succeed');
x=read();assert.equal(x.room,1,'visited node reuses its canonical runtime room');assert.equal(x.last.worldNodeId,'A');assert.equal(x.world167823.heroNodes.hero,'A');assert.deepEqual(enemies.map(e=>e.id),enemiesBefore,'generated enemies from discarded duplicate room must be removed');

x.positions.hero=1;write(x);
assert.equal(core.explore(),false,'unconnected/non-exit route is blocked in authoritative mode');
assert.equal(read().room,1);

api.saveConfig({enabled:false,dungeonId:'world_1'},'adv_1');
const roomBefore=read().room;core.explore();assert.equal(read().room,roomBefore+1,'disabled authoritative mode falls back to legacy explore');

assert.doesNotMatch(src,/function\s+(?:dungeonEncounter|dungeonBossRoom|launchCombat|endTurn|trackSpawnedEnemyInstances)\s*\(/,'world runtime must not rewrite spawn/combat/timeline producers');
assert.match(src,/CONTENT_KEY="gensrpg_zone_instance_content_v1"/);
assert.match(src,/Sortie non reliée/);
assert.match(src,/Vers /);

if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');const builderPos=html.indexOf('assets/dungeon/dungeon-world-builder-167821.js?v=167821');const roomRuntimePos=html.indexOf('assets/dungeon/dungeon-room-runtime-167822.js?v=167822');const worldRuntimePos=html.indexOf('assets/dungeon/dungeon-world-runtime-167823.js?v=167823');assert.ok(builderPos>=0&&roomRuntimePos>builderPos&&worldRuntimePos>roomRuntimePos,'final HTML must load builder, room runtime, then authoritative world runtime')}
console.log('Dungeon authoritative World Runtime V16.78.23 regressions: OK');
