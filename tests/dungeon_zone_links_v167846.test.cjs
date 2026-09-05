const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-zone-links-167846.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const graph={id:'world-1',nodes:[{id:'A',roomId:'ra',label:'Salle A'},{id:'B',roomId:'rb',label:'Salle B'}],edges:[{id:'e1',fromNodeId:'A',fromExitIndex:4,toNodeId:'B',toEntryIndex:1}],cacheBindings:[{id:'cb1',sourceNodeId:'A',sourceIndex:2,targetNodeId:'',targetRoomId:'attic',kind:'secondary',returnMode:'source'}]};
const rooms={
 ra:{id:'ra',name:'Salle A',cells:[{object:'entry'},{},{object:'cache'},{},{object:'exit'}]},
 rb:{id:'rb',name:'Salle B',cells:[{}, {object:'entry'},{},{},{object:'exit'}]},
 attic:{id:'attic',name:'Vieux grenier',cells:[{},{},{},{object:'entry'},{object:'exit'}]}
};
function cellsForRoom(id){return (rooms[id]?.cells||[]).map(c=>c?.object||'floor')}
function makeRuntime(node='B',pos=1){const roomNo=node==='A'?1:2;return {participants:['hero'],index:0,room:roomNo,positions:{hero:pos},remaining:{hero:3},last:{authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:'world-1',worldNodeId:node,map:{cells:cellsForRoom(node==='A'?'ra':'rb')}},authored167839:{worldId:'world-1',heroNodes:{hero:node},nodeRooms:{A:1,B:2},roomNodes:{1:'A',2:'B'},history:{hero:['A','B']}}};}
const store=storage({[RT]:JSON.stringify(makeRuntime())});
const builder={findDungeon(id){return id==='world-1'?JSON.parse(JSON.stringify(graph)):null},loadLibrary(){return [JSON.parse(JSON.stringify(graph))]},upsertDungeon(g){Object.assign(graph,JSON.parse(JSON.stringify(g)));return g}};
let authoredActive=true,nextRoom=2;
const authored={
 active(){return authoredActive},graph(){return JSON.parse(JSON.stringify(graph))},
 enterNode(g,target,edge){const node=(g.nodes||[]).find(n=>n.id===target);if(!node)return false;const x=JSON.parse(store.getItem(RT));const s=x.authored167839||{worldId:g.id,heroNodes:{},nodeRooms:{},roomNodes:{},history:{hero:[]}};let rn=Number(s.nodeRooms[target]);if(!rn){rn=++nextRoom;s.nodeRooms[target]=rn;s.roomNodes[String(rn)]=target}x.room=rn;s.heroNodes.hero=target;x.authored167839=s;x.positions.hero=Number(edge?.toEntryIndex)||0;x.last={authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:g.id,worldNodeId:target,customRoomId:node.roomId,map:{cells:cellsForRoom(node.roomId)}};store.setItem(RT,JSON.stringify(x));return true},
 syncActionButton(){return true}
};
const roomApi={findRoom(id){return rooms[id]?JSON.parse(JSON.stringify(rooms[id])):null},loadLibrary(){return Object.values(rooms).map(r=>JSON.parse(JSON.stringify(r)))}};
const context={console,JSON,Math,Date,localStorage:store,setTimeout(){return 1},DungeonAuthoredRuntime167839:authored,DungeonWorldBuilder167821:builder,DungeonRoomCreator100:roomApi,DungeonRoomCreatorV2:{roomMeta(){return {cacheLinks:[]}}},DungeonCore01:{render(){return true}},showToast(){}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-zone-links-167846.js'});
const api=context.DungeonZoneLinks167846;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.47');assert.equal(api.VERSION,'1.1.0');
assert.equal(api.reverseEdge(graph,'B',1).id,'e1','B entry must expose reverse traversal to A');
assert.equal(api.travelReverse(),true,'reverse door travel should use the dedicated authored runtime');
let rt=JSON.parse(store.getItem(RT));assert.equal(rt.last.worldNodeId,'A');assert.equal(rt.positions.hero,4,'reverse arrival should be the original A exit');
rt=makeRuntime('A',2);store.setItem(RT,JSON.stringify(rt));
const binding=api.cacheBinding(graph,'A',2);assert.equal(api.bindingRoomId(graph,binding),'attic','cache target must be a room-library id, not a graph node');
const branch=api.graphWithBranch(graph,binding);assert.ok(branch);assert.equal(branch.roomId,'attic');assert.equal(graph.nodes.length,2,'secondary target must not be added to the main graph/pool');assert.equal(branch.graph.nodes.length,3,'runtime clone may contain one virtual branch node');
assert.equal(api.travelCache(),true,'cache must enter a room that is absent from the main graph pool');
rt=JSON.parse(store.getItem(RT));assert.equal(rt.last.customRoomId,'attic');assert.equal(rt.positions.hero,3,'secondary branch must use the real attic entry cell');assert.equal(rt.authored167847ReturnStacks.hero.length,1,'cache travel must push a per-hero return frame');
assert.equal(api.travelReturn(),true,'secondary cache room must return to source');
rt=JSON.parse(store.getItem(RT));assert.equal(rt.last.worldNodeId,'A');assert.equal(rt.positions.hero,2,'cache return must restore the exact source cache cell');assert.equal(rt.authored167847ReturnStacks.hero.length,0);
assert.equal(api.saveCacheBinding('world-1','A',2,'attic'),true);assert.equal(graph.cacheBindings[0].targetRoomId,'attic');assert.equal(graph.cacheBindings[0].targetNodeId,'');assert.equal(graph.nodes.length,2,'saving a cache branch must never add the target to the main pool');
authoredActive=false;rt=makeRuntime('A',2);store.setItem(RT,JSON.stringify(rt));assert.equal(api.authoredContext(),null,'non-authored / inactive runtime must be ignored');assert.equal(api.travelCache(),false,'Random Dungeon, Capture and Survival must not be modified');
console.log('Dungeon authored secondary zone links V16.78.47: OK');