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
const finalExit=read('assets/dungeon/dungeon-authored-final-exit-167875.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165398,
  'Phase 7 Final Exit terminal characterization must start from lock-delegation GREEN runtime');
assert.equal(gitBlob,'18627cc0c5fc7945732c8a910504c59ef823b6ae',
  'Phase 7 Final Exit terminal characterization must keep the exact canonical index blob');

assert.match(
  finalExit,
  /const atExit=hasExit&&R\.GensDungeonV1\.movement\.isAuthoredTerminalExit\(hero,exitIdx,positional,x\?\.positions\?\.\[hero\]\);/,
  'post-raccord Final Exit must keep hasExit local and delegate only the positional terminal decision'
);
assert.equal(
  (finalExit.match(/GensDungeonV1\.movement\.isAuthoredTerminalExit\(/g)||[]).length,
  1,
  'post-raccord Final Exit must consume the canonical terminal helper exactly once'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
const document={
  readyState:'complete',
  body:{style:{removeProperty(){}}},
  documentElement:{style:{removeProperty(){}}},
  getElementById(){return null},
  addEventListener(){}
};
let positionalEnabled=true;
const graph={id:'world-terminal'};
const authored={
  active(){return true},
  graph(){return graph},
  plan(){return {currentNodeId:'last',outgoing:[],targetNodeId:'',needsExit:false}},
  positional(){return positionalEnabled}
};
const ctx={
  console,Math,Date,JSON,
  localStorage,document,
  setTimeout(){return 1},
  DungeonAuthoredRuntime167839:authored,
  DungeonCore01:{modal(){return true},render(){return true},show(){return true}},
  markSessionActive(){},
  saveDungeonState(){},
  showToast(){}
};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(finalExit,ctx,{filename:'assets/dungeon/dungeon-authored-final-exit-167875.js'});
const api=ctx.DungeonAuthoredFinalExit167875;
assert.ok(api,'Final Exit API must load');

function save(options={}){
  const position=Object.prototype.hasOwnProperty.call(options,'position')?options.position:2;
  const cells=Object.prototype.hasOwnProperty.call(options,'cells')?options.cells:['floor','cache','exit'];
  const exitIdx=Object.prototype.hasOwnProperty.call(options,'exitIdx')?options.exitIdx:2;
  localStorage.setItem(RT,JSON.stringify({
    participants:['aldren'],
    index:0,
    room:3,
    positions:{aldren:position},
    last:{
      authoredRuntime167839:true,
      worldDungeonId:'world-terminal',
      worldNodeId:'last',
      map:{cells,exitIdx}
    },
    branch:null
  }));
}

positionalEnabled=true;
save({position:2});
let state=api.finalState();
assert.equal(state.hasExit,true);
assert.equal(state.atExit,true,
  'positional Final Exit must accept matching numeric position');

positionalEnabled=true;
save({position:'2'});
state=api.finalState();
assert.equal(state.hasExit,true);
assert.equal(state.atExit,true,
  'positional Final Exit must preserve numeric-string position coercion');

positionalEnabled=true;
save({position:1});
state=api.finalState();
assert.equal(state.hasExit,true);
assert.equal(state.atExit,false,
  'positional Final Exit must reject a different position');

positionalEnabled=true;
save({position:undefined});
state=api.finalState();
assert.equal(state.hasExit,true);
assert.equal(state.atExit,false,
  'positional Final Exit must reject a missing position');

positionalEnabled=false;
save({position:0});
state=api.finalState();
assert.equal(state.hasExit,true);
assert.equal(state.atExit,true,
  'non-positional Final Exit must accept a valid exit without position matching');

positionalEnabled=false;
save({position:2,cells:['floor','exit'],exitIdx:0});
state=api.finalState();
assert.equal(state.exitIdx,0,
  'this micro-lot must preserve the local direct exit index resolution');
assert.equal(state.hasExit,false,
  'direct index pointing to non-exit must remain invalid in Final Exit');
assert.equal(state.atExit,false,
  'local hasExit guard must continue to block atExit regardless of positional mode');

const pure={};
pure.window=pure;
pure.globalThis=pure;
vm.createContext(pure);
vm.runInContext(entry,pure,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pure.GensDungeonV1?.movement?.isAuthoredTerminalExit,
  'function',
  'canonical terminal helper must already exist before Final Exit delegation'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Final Exit terminal decision post-raccord characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredFinalExit167875 finalState consumer',
  canonicalOwner:'GensDungeonV1.movement.isAuthoredTerminalExit',
  semantics:{
    hasExitGuardLocal:true,
    localExitIndexResolverPreserved:true,
    nonPositionalAllowsValidExit:true,
    positionalRequiresMatch:true,
    numericPositionCoercion:true
  }
},null,2));
