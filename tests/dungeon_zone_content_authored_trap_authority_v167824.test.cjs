const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-zone-content-167824.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const CONTENT='gensrpg_zone_instance_content_v1';
const store=new Map();
const runtime=authored=>({participants:['hero'],index:0,room:1,positions:{hero:0},enemyCells:{},
  last:{authoredRuntime167839:authored,worldRuntime167823:true,worldDungeonId:'world-1',worldNodeId:'zone-1',
    map:{cells:['entry','floor','floor','floor','exit']}}});
store.set(RT,JSON.stringify(runtime(true)));
const context={console,JSON,Math,Date,
  localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,String(v))}},
  setTimeout(){return 1},
  DungeonCore01:{render(){return true},explore(){return true}},
  DungeonSpatial313:{ensure(x){return x},persist(){return true}},
  loadActiveEnemies(){return []},saveActiveEnemies(){},
  loadDungeonSceneElements(){return []},saveDungeonSceneElements(){}
};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-zone-content-167824.js'});
const api=context.DungeonZoneContent167824;
api.saveZoneContent('world-1','zone-1',{mode:'fixed',traps:[{id:'trap-authored',cell:2,trapType:'damage',damage:1,once:true}]});
assert.equal(api.applyCurrentZone(),true);
let x=JSON.parse(store.get(RT));
assert.equal(x.last.map.cells[2],'floor','authored ZoneContent must leave exact traps hidden for ExactTrapRuntime ownership');
assert.equal(x.last.worldZoneContent167824.traps.length,1,'authored trap specification must remain available to ExactTrapRuntime');

x=runtime(false);store.set(RT,JSON.stringify(x));
assert.equal(api.applyCurrentZone({force:true}),true);
x=JSON.parse(store.get(RT));
assert.equal(x.last.map.cells[2],'trap','non-authored legacy world content keeps its historical raw trap marker');

assert.match(src,/!x\?\.last\?\.authoredRuntime167839/,'raw trap marker must be excluded only for dedicated authored runtime');
console.log('Dungeon authored ZoneContent trap ownership: OK');
