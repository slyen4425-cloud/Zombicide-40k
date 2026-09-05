const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-zone-links-167846.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},dump(){return m}}}
const graph={id:'world-1',nodes:[{id:'A',roomId:'ra',label:'Salle A'},{id:'B',roomId:'rb',label:'Salle B'}],edges:[{id:'e1',fromNodeId:'A',fromExitIndex:4,toNodeId:'B',toEntryIndex:1}],cacheBindings:[{id:'cb1',sourceNodeId:'A',sourceIndex:2,targetNodeId:'B',targetRoomId:'rb'}]};
const rooms={ra:{id:'ra',name:'Salle A',cells:[{object:'entry'},{},{object:'cache'},{},{object:'exit'}]},rb:{id:'rb',name:'Salle B',cells:[{}, {object:'entry'},{},{},{object:'exit'}]}};
function mapFor(node){return node==='A'?['entry','floor','cache','floor','exit']:['floor','entry','floor','floor','exit']}
function makeRuntime(node='B',pos=1){return {participants:['hero'],index:0,room:node==='A'?1:2,positions:{hero:pos},remaining:{hero:3},last:{worldRuntime167823:true,worldDungeonId:'world-1',worldNodeId:node,map:{cells:mapFor(node)}},world167823:{dungeonId:'world-1',heroNodes:{hero:node},nodeRooms:{A:1,B:2},roomNodes:{1:'A',2:'B'},history:{hero:['A','B']}}};}
const store=storage({[RT]:JSON.stringify(makeRuntime())});
const builder={findDungeon(id){return id==='world-1'?JSON.parse(JSON.stringify(graph)):null},loadLibrary(){return [JSON.parse(JSON.stringify(graph))]},upsertDungeon(g){Object.assign(graph,JSON.parse(JSON.stringify(g)));return g}};
const world={getConfig(){return {enabled:true,dungeonId:'world-1'}},ensureWorldState(x){return x.world167823},directFixedNode(x,g,plan,hero,w){const target=plan.targetNodeId,roomNo=w.nodeRooms[target];x.room=roomNo;w.heroNodes[hero]=target;x.last={worldRuntime167823:true,worldDungeonId:g.id,worldNodeId:target,map:{cells:mapFor(target)}};x.positions[hero]=plan.edge.toEntryIndex;store.setItem(RT,JSON.stringify(x));return true}};
const context={console,JSON,Math,Date,localStorage:store,setTimeout(){return 1},DungeonWorldBuilder167821:builder,DungeonWorldRuntime167823:world,DungeonRoomCreator100:{findRoom(id){return rooms[id]||null}},DungeonZoneContent167824:{applyCurrentZone(){return true}},DungeonCore01:{render(){return true}},showToast(){}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-zone-links-167846.js'});
const api=context.DungeonZoneLinks167846;assert.ok(api);
assert.equal(api.entryIndexForNode(graph,'B'),1,'cache travel must use the real target entry cell');
assert.equal(api.reverseEdge(graph,'B',1).id,'e1','B entry must expose reverse traversal to A');
assert.equal(api.travelReverse(),true,'reverse door travel should work in authored world');
let rt=JSON.parse(store.getItem(RT));assert.equal(rt.last.worldNodeId,'A');assert.equal(rt.positions.hero,4,'reverse arrival should be the original A exit');
rt=makeRuntime('A',2);store.setItem(RT,JSON.stringify(rt));
assert.equal(api.travelCache(),true,'cache binding should enter target zone');
rt=JSON.parse(store.getItem(RT));assert.equal(rt.last.worldNodeId,'B');assert.equal(rt.positions.hero,1,'cache travel must arrive on the real target entry');assert.equal(rt.world167846ReturnStacks.hero.length,1,'cache travel must push a return frame');
assert.equal(api.travelReturn(),true,'cache sub-zone must return to source');
rt=JSON.parse(store.getItem(RT));assert.equal(rt.last.worldNodeId,'A');assert.equal(rt.positions.hero,2,'cache return must restore the source cache cell');assert.equal(rt.world167846ReturnStacks.hero.length,0);
rt=makeRuntime('A',2);delete rt.last.worldRuntime167823;store.setItem(RT,JSON.stringify(rt));
assert.equal(api.authoredContext(),null,'non-authored runtime must be ignored');assert.equal(api.travelCache(),false,'non-authored modes must not be modified');
console.log('Dungeon authored zone links V16.78.46: OK');