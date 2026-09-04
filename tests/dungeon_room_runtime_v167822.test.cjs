const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-runtime-167822.js'),'utf8');
const htmlArg=process.argv[2];
const RT='gensrpg_dungeon_runtime_v2';
const CFG='gensrpg_dungeon_room_runtime_cfg_v1';

function storage(initial={}){const m=new Map(Object.entries(initial));return{getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
function makeRoom(id,name,type='room'){
  return {id,name,roomType:type,theme:'stone',width:3,height:2,cells:[
    {terrain:'floor',object:'entry'},
    {terrain:'floor',object:'enemy'},
    {terrain:'wall',object:null},
    {terrain:'floor',object:null},
    {terrain:'floor',object:'enemy'},
    {terrain:'floor',object:'exit'}
  ]};
}
const rooms=[makeRoom('room_a','Salle A'),makeRoom('room_b','Salle B'),makeRoom('room_boss','Salle Boss','boss')];
const initial={participants:['aldren','lyra'],index:0,room:0,last:null,positions:{aldren:-1,lyra:-1},remaining:{aldren:3,lyra:3},enemyCells:{},roomStates:{},heroRooms:{aldren:0,lyra:0}};
const ls=storage({
  [RT]:JSON.stringify(initial),
  [CFG]:JSON.stringify({adv1:{enabled:true,chance:100,roomIds:['room_a','room_b','room_boss']}})
});
let renderCalls=0;
const spatial={
  ensure(x){x.roomStates=x.roomStates||{};x.heroRooms=x.heroRooms||{}},
  persist(x){x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))}}
};
const core={
  render(){renderCalls++},
  explore(){
    const x=JSON.parse(ls.getItem(RT));
    x.room=1;
    x.last={kind:'enemy',room:1,map:{size:2,cells:['entry','enemy','floor','exit'],entryIdx:0,exitIdx:3}};
    x.enemyCells={e1:1,e2:2};
    x.dc313LastTransition={heroId:'aldren',from:0,to:1,created:true};
    x.positions.aldren=0;
    ls.setItem(RT,JSON.stringify(x));
    return true;
  }
};
const ctx={console,Math,Date,setTimeout(fn){fn();return 1},clearTimeout(){},localStorage:ls,DungeonCore01:core,DungeonSpatial313:spatial,activeDungeonAdventureId(){return 'adv1'},DungeonRoomCreator100:{loadLibrary(){return JSON.parse(JSON.stringify(rooms))},validateRoom(){return {valid:true}}}};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'dungeon-room-runtime-167822.js'});
const api=ctx.DungeonRoomRuntime167822;
assert.ok(api,'runtime bridge API loads');
assert.equal(api.APP_VERSION,'16.78.22');
assert.equal(core.explore.__drr167822,true,'DungeonCore01.explore is wrapped');

core.explore();
let x=JSON.parse(ls.getItem(RT));
assert.equal(x.last.customRoomRuntime167822,true,'newly created room is replaced by a custom template');
assert.equal(x.last.customRoomId,'room_a');
assert.equal(x.last.kind,'enemy','existing encounter kind is preserved');
assert.equal(x.last.map.size,3,'map size follows custom room width');
assert.equal(x.last.map.width,3);
assert.equal(x.last.map.height,2);
assert.deepEqual(x.last.map.cells,['entry','enemy','wall','floor','enemy','exit']);
assert.equal(x.last.map.entryIdx,0);
assert.equal(x.last.map.exitIdx,5);
assert.equal(x.positions.aldren,0,'active hero arrives on custom entry');
assert.deepEqual(x.enemyCells,{e1:1,e2:4},'existing spawned enemies are remapped onto custom enemy anchors');
assert.equal(x.roomStates['1'].last.customRoomId,'room_a','custom map is persisted in spatial room snapshot');
assert.equal(renderCalls,1,'room is re-rendered after custom layout application');

// Joining/re-rendering an existing room must not replace it again.
x.dc313LastTransition={heroId:'lyra',from:0,to:1,created:false};
x.last.customRoomRuntime167822=false;
ls.setItem(RT,JSON.stringify(x));
assert.equal(api.applyTemplateToCurrentRoom(),false,'existing room joins do not generate a new custom layout');

// Disabled configuration leaves generated rooms untouched.
api.saveConfig({enabled:false,chance:100,roomIds:['room_a']},'adv1');
x.dc313LastTransition={heroId:'aldren',from:0,to:2,created:true};
x.room=2;x.last={kind:'enemy',map:{size:1,cells:['entry']}};ls.setItem(RT,JSON.stringify(x));
assert.equal(api.applyTemplateToCurrentRoom(),false,'disabled integration does nothing');

// Boss rooms prefer boss templates when enabled.
api.saveConfig({enabled:true,chance:100,roomIds:['room_a','room_boss']},'adv1');
x=JSON.parse(ls.getItem(RT));x.room=3;x.last={kind:'boss',map:{size:1,cells:['entry']}};x.enemyCells={boss1:0};x.dc313LastTransition={heroId:'aldren',from:2,to:3,created:true};ls.setItem(RT,JSON.stringify(x));
assert.equal(api.applyTemplateToCurrentRoom(),true);
x=JSON.parse(ls.getItem(RT));
assert.equal(x.last.customRoomId,'room_boss','boss encounter prefers a boss room template');

assert.match(src,/preserving\n   the existing encounter\/combat\/timeline\/spawn pipeline/);
assert.doesNotMatch(src,/function\s+(?:dungeonEncounter|dungeonBossRoom|trackSpawnedEnemyInstances|endTurn)\s*\(/,'bridge must not rewrite spawn/combat/timeline producers');

if(htmlArg){
  const html=fs.readFileSync(htmlArg,'utf8');
  assert.match(html,/assets\/dungeon\/dungeon-room-runtime-167822\.js\?v=167822/,'final HTML must load runtime room integration');
}
console.log('Dungeon custom-room runtime integration V16.78.22: OK');
