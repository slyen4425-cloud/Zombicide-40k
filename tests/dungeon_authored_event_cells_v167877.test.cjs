const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets','dungeon','dungeon-authored-event-cells-167877.js');
const src=fs.readFileSync(file,'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const values=new Map();
const localStorage={getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}};
const runtime={participants:['aldren'],index:0,room:4,positions:{aldren:0},last:{authoredRuntime167839:true,worldDungeonId:'world_test',worldNodeId:'room_B',map:{cells:['floor','event','floor'],exitIdx:2}},branch:null};
localStorage.setItem(RT,JSON.stringify(runtime));
let eventCalls=0,renderCalls=0;
const head={appendChild(){}};
const document={readyState:'complete',head,body:{appendChild(){},style:{removeProperty(){}}},documentElement:{appendChild(){},style:{removeProperty(){}}},getElementById(){return null},createElement(){return {id:'',textContent:'',classList:{remove(){}},style:{}}},addEventListener(){}};
const core={render(){renderCalls++;return true},show(){return this.render()},explore(){return true},modal(){return true}};
const ctx={console,Math,Date,localStorage,document,setTimeout(fn){fn();return 1},DungeonCore01:core,DungeonRoomCreator100:{TOOLS:{floor:{label:'Sol',icon:'·',kind:'terrain'}}},DungeonCore318:{withRoom(room,fn){assert.equal(room,4);return fn()}},dungeonEventSpawn(){eventCalls++;return true},showToast(){}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-authored-event-cells-167877.js'});

const api=ctx.DungeonAuthoredEventCells167877;
assert.ok(api,'le module de cases événement doit être installé');
assert.equal(api.APP_VERSION,'16.78.77');
assert.equal(ctx.DungeonRoomCreator100.TOOLS.event.label,'Événement');
assert.equal(ctx.DungeonRoomCreator100.TOOLS.event.icon,'🎲');
assert.equal(eventCalls,0,'aucun événement ne doit partir tant que le héros n’est pas sur la case');

let x=JSON.parse(localStorage.getItem(RT));
x.positions.aldren=1;localStorage.setItem(RT,JSON.stringify(x));
core.render();
assert.equal(eventCalls,1,'entrer sur la case événement doit réutiliser dungeonEventSpawn()');
x=JSON.parse(localStorage.getItem(RT));
const keys=Object.keys(x.authoredEventCells167877||{});
assert.equal(keys.length,1,'la case déclenchée doit être persistée dans le runtime');
assert.match(keys[0],/^world_test::room_B::1$/);

core.render();core.show();api.fire();
assert.equal(eventCalls,1,'un rerender ou un second passage ne doit pas redéclencher le même événement');

x=JSON.parse(localStorage.getItem(RT));
x.last.worldNodeId='room_C';x.positions.aldren=1;delete x.authoredEventCells167877['world_test::room_C::1'];localStorage.setItem(RT,JSON.stringify(x));
api.fire();
assert.equal(eventCalls,2,'la même position dans une autre zone doit être un nouvel événement');

assert.match(src,/dungeonEventSpawn/,'le système doit appeler le moteur d’événements Dungeon existant');
assert.doesNotMatch(src,/trackSpawnedEnemyInstances\?\./,'le module ne doit pas recréer un moteur de spawn ennemi');
assert.match(bridge,/dungeon-authored-event-cells-167877\.js\?v=167877/,'le build chargé doit lancer le module événement depuis un bridge déjà présent');
console.log('Authored Dungeon event cells V16.78.77: OK');
