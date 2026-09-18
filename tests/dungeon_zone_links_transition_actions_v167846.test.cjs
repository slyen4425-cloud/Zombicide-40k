const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-zone-links-167846.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const graph={id:'world-1',nodes:[{id:'A',roomId:'ra',label:'Salle A'}],edges:[],cacheBindings:[{id:'cb',sourceNodeId:'A',sourceIndex:2,targetRoomId:'attic',kind:'secondary',returnMode:'source'}]};
const rooms={
  ra:{id:'ra',name:'Salle A',cells:[{object:'entry'},{},{object:'cache'},{},{object:'exit'}]},
  attic:{id:'attic',name:'Grenier',cells:[{},{},{},{object:'entry'},{object:'exit'}]}
};
const runtime={participants:['hero'],index:0,room:1,positions:{hero:2},remaining:{hero:3},
  last:{authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:'world-1',worldNodeId:'A',customRoomId:'ra',map:{cells:['entry','floor','cache','floor','exit']}},
  authored167839:{worldId:'world-1',heroNodes:{hero:'A'},nodeRooms:{A:1},roomNodes:{1:'A'},history:{hero:['A']}}};
const store=new Map([[RT,JSON.stringify(runtime)]]);
const nodes={};
const parent={insertBefore(el){nodes[el.id]=el;el.parentNode=this}};
const anchor={id:'dc01Explore',className:'dc01Btn',parentNode:parent};
nodes[anchor.id]=anchor;
const document={
  readyState:'loading',
  addEventListener(){},
  getElementById(id){return nodes[id]||null},
  createElement(){return {id:'',type:'',className:'',textContent:'',disabled:false,onclick:null,parentNode:null,remove(){delete nodes[this.id]}}}
};
let nextRoom=1;
const authored={
  active(){return true},
  graph(){return JSON.parse(JSON.stringify(graph))},
  syncActionButton(){return true},
  enterNode(g,target,edge){
    const node=(g.nodes||[]).find(n=>String(n.id)===String(target));if(!node)return false;
    const x=JSON.parse(store.get(RT)),s=x.authored167839;
    let rn=Number(s.nodeRooms[target]);if(!rn){rn=++nextRoom;s.nodeRooms[target]=rn;s.roomNodes[String(rn)]=target}
    x.room=rn;s.heroNodes.hero=target;x.positions.hero=Number(edge?.toEntryIndex)||0;
    x.last={authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:g.id,worldNodeId:target,customRoomId:node.roomId,map:{cells:(rooms[node.roomId].cells||[]).map(c=>c.object||'floor')}};
    store.set(RT,JSON.stringify(x));return true;
  }
};
const context={console,JSON,Math,Date,document,
  localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,String(v))}},
  DungeonAuthoredRuntime167839:authored,
  DungeonWorldBuilder167821:{findDungeon(){return JSON.parse(JSON.stringify(graph))}},
  DungeonRoomCreator100:{findRoom(id){return rooms[id]?JSON.parse(JSON.stringify(rooms[id])):null}},
  DungeonCore01:{render(){return true}},
  showToast(){}
};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-zone-links-167846.js'});
const api=context.DungeonZoneLinks167846;

assert.equal(api.travelCache(),true,'cache transition must succeed');
let x=JSON.parse(store.get(RT));
assert.equal(x.last.customRoomId,'attic');
assert.equal(x.positions.hero,3,'branch arrival must be its authored entry');
assert.ok(nodes.dwr167846Return,'transition owner must repaint the dedicated return action immediately');
assert.match(nodes.dwr167846Return.textContent,/Retour vers Salle A/);
assert.equal(nodes.dwr167846Cache,undefined,'branch entry must not keep the source cache action');

assert.equal(api.travelReturn(),true,'dedicated return must succeed');
x=JSON.parse(store.get(RT));
assert.equal(x.last.worldNodeId,'A');
assert.equal(x.positions.hero,2,'return must restore the exact source cache cell');
assert.equal(nodes.dwr167846Return,undefined,'return action must disappear after returning to parent');
assert.ok(nodes.dwr167846Cache,'source cache action must be repainted after returning');

assert.match(src,/syncActionButton\?\.\(\).*paintTravelButtons\(\)/,'transition owner must repaint travel actions directly');
console.log('Dungeon authored cache transition actions refresh: OK');
