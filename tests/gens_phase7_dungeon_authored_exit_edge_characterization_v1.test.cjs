'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167138,
  'Phase 7 authored exit-edge characterization must track the move-allowance GREEN runtime');
assert.equal(gitBlob,'09b1e19c04777da82fd0ad355adc7eb82532db29',
  'Phase 7 authored exit-edge characterization must track the exact move-allowance GREEN blob');

assert.match(
  authored,
  /function plan\(x,g\)\{const hero=activeHero\(x\),s=ensureState\(x,g\),current=currentNode\(x,s,hero\);if\(!current\)return \{hero,s,currentNodeId:"",targetNodeId:String\(g\.startNodeId\|\|""\),edge:null,first:true,needsExit:false\};const list=outgoing\(g,current\),pos=Number\(x\?\.positions\?\.\[hero\]\),edge=ROOT\.GensDungeonV1\.movement\.selectAuthoredOutgoingEdge\(list,pos,positional\(\)\);return \{hero,s,currentNodeId:current,targetNodeId:String\(edge\?\.toNodeId\|\|""\),edge,first:false,needsExit:!!list\.length&&!edge,outgoing:list\}\}/,
  'post-raccord authored plan must preserve graph/position/config ownership around the pure selector'
);

let positionalEnabled=true;
const context={
  console,Math,Date,JSON,
  localStorage:{getItem(){return null},setItem(){}},
  dc305PositionalGameplay(){return positionalEnabled}
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,context,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;
assert.ok(api,'authored runtime API must load');

const graph={
  id:'world',
  startNodeId:'A',
  edges:[]
};

function state(position){
  return {
    participants:['hero'],
    index:0,
    room:1,
    positions:{hero:position},
    authored167839:{
      worldId:'world',
      heroNodes:{hero:'A'},
      nodeRooms:{A:1},
      roomNodes:{1:'A'},
      history:{hero:['A']}
    }
  };
}

function plan(edges,position,positional){
  graph.edges=edges.map(x=>({...x}));
  positionalEnabled=positional;
  return api.plan(state(position),graph);
}

{
  const p=plan([
    {id:'AB',fromNodeId:'A',fromExitIndex:5,toNodeId:'B'},
    {id:'AC',fromNodeId:'A',fromExitIndex:9,toNodeId:'C'}
  ],5,true);
  assert.equal(p.edge.id,'AB');
  assert.equal(p.targetNodeId,'B');
  assert.equal(p.needsExit,false);
}
{
  const p=plan([
    {id:'AB',fromNodeId:'A',fromExitIndex:'5',toNodeId:'B'},
    {id:'AC',fromNodeId:'A',fromExitIndex:9,toNodeId:'C'}
  ],5,true);
  assert.equal(p.edge.id,'AB','numeric-string fromExitIndex must preserve Number coercion');
}
{
  const p=plan([
    {id:'first',fromNodeId:'A',fromExitIndex:5,toNodeId:'B'},
    {id:'second',fromNodeId:'A',fromExitIndex:5,toNodeId:'C'}
  ],5,true);
  assert.equal(p.edge.id,'first','first matching authored edge must win');
}
{
  const p=plan([
    {id:'AB',fromNodeId:'A',fromExitIndex:5,toNodeId:'B'}
  ],2,true);
  assert.equal(p.edge,null);
  assert.equal(p.targetNodeId,'');
  assert.equal(p.needsExit,true);
}
{
  const p=plan([
    {id:'AB',fromNodeId:'A',fromExitIndex:5,toNodeId:'B'}
  ],2,false);
  assert.equal(p.edge.id,'AB','single outgoing edge must auto-select only when positional movement is disabled');
  assert.equal(p.targetNodeId,'B');
  assert.equal(p.needsExit,false);
}
{
  const p=plan([
    {id:'AB',fromNodeId:'A',fromExitIndex:5,toNodeId:'B'},
    {id:'AC',fromNodeId:'A',fromExitIndex:9,toNodeId:'C'}
  ],2,false);
  assert.equal(p.edge,null,'multiple outgoing edges must not auto-select without a position match');
  assert.equal(p.needsExit,true);
}
{
  const p=plan([
    {id:'AB',fromNodeId:'A',fromExitIndex:5,toNodeId:'B'},
    {id:'AC',fromNodeId:'A',fromExitIndex:9,toNodeId:'C'}
  ],9,false);
  assert.equal(p.edge.id,'AC','position match must win even when positional movement is disabled');
}
{
  const p=plan([],2,false);
  assert.equal(p.edge,null);
  assert.equal(p.needsExit,false);
}

const pureSandbox={};
pureSandbox.window=pureSandbox;
pureSandbox.globalThis=pureSandbox;
vm.createContext(pureSandbox);
vm.runInContext(entry,pureSandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pureSandbox.GensDungeonV1?.movement?.selectAuthoredOutgoingEdge,
  'function',
  'post-raccord characterization requires the Dungeon-owned authored outgoing-edge selector'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored exit-edge selection post-raccord characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.plan consumer',
  semantics:{
    positionMatch:true,
    numericCoercion:true,
    firstMatchWins:true,
    positionalRequiredWhenEnabled:true,
    singleEdgeFallbackWhenDisabled:true,
    multipleEdgesNoFallback:true
  },
  pureTarget:'GensDungeonV1.movement.selectAuthoredOutgoingEdge'
},null,2));
