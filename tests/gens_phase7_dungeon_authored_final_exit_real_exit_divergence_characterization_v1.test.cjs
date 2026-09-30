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

assert.equal(bytes.length,8169442,
  'Phase 7 Final Exit real-exit divergence characterization must start from terminal-delegation GREEN runtime');
assert.equal(gitBlob,'a37acaabcb3202a8527c2d545f9e2ff4466ea1db',
  'Phase 7 Final Exit real-exit divergence characterization must keep the exact canonical index blob');

assert.match(
  finalExit,
  /const direct=Number\(map\.exitIdx\),exitIdx=Number\.isInteger\(direct\)&&direct>=0\?direct:cells\.findIndex\(v=>String\(v\|\|""\)\.toLowerCase\(\)==="exit"\);/,
  'Final Exit must still own its historical local exitIdx resolver during divergence characterization'
);
assert.equal(
  (finalExit.match(/resolveAuthoredRealExitIndex\(/g)||[]).length,
  0,
  'Final Exit must not consume the canonical real-exit resolver during characterization'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
const graph={id:'world-real-exit-divergence'};
const authored={
  active(){return true},
  graph(){return graph},
  plan(){return {currentNodeId:'last',outgoing:[],targetNodeId:'',needsExit:false}},
  positional(){return false}
};
const ctx={
  console,Math,Date,JSON,
  localStorage,
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

const finalApi=ctx.DungeonAuthoredFinalExit167875;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredRealExitIndex;
assert.ok(finalApi,'Final Exit API must load');
assert.equal(typeof canonical,'function','canonical real-exit resolver must already exist');

function save(cells,exitIdx){
  localStorage.setItem(RT,JSON.stringify({
    participants:['aldren'],
    index:0,
    room:3,
    positions:{aldren:0},
    last:{
      authoredRuntime167839:true,
      worldDungeonId:graph.id,
      worldNodeId:'last',
      map:{cells,exitIdx}
    },
    branch:null
  }));
}

function compare(cells,exitIdx,expectedLocal,expectedCanonical,expectedHasExit){
  save(cells,exitIdx);
  const state=finalApi.finalState();
  assert.ok(state,'Final Exit state must be available');
  assert.equal(state.exitIdx,expectedLocal,
    'unexpected Final Exit local exitIdx for '+JSON.stringify({cells,exitIdx}));
  assert.equal(state.hasExit,expectedHasExit,
    'unexpected Final Exit hasExit for '+JSON.stringify({cells,exitIdx}));
  assert.equal(canonical(cells,exitIdx),expectedCanonical,
    'unexpected canonical real-exit index for '+JSON.stringify({cells,exitIdx}));
  return state;
}

// Parity cases.
compare(['floor','exit'],1,1,1,true);
compare(['floor','exit'],'1',1,1,true);
compare(['floor','EXIT'],1,1,1,true);
compare(['floor','exit'],-1,1,1,true);
compare(['floor','exit'],1.5,1,1,true);
compare(['floor','exit'],undefined,1,1,true);

// Divergence: direct integer is accepted locally even when it is not a real exit.
let state=compare(['floor','exit'],0,0,1,false);
assert.equal(state.atExit,false,
  'Final Exit local hasExit guard must block completion for a stale direct index');

state=compare(['floor','exit'],99,99,1,false);
assert.equal(state.atExit,false,
  'Final Exit local hasExit guard must block completion for an out-of-range direct index');

// Divergence without any fallback exit: local keeps the direct integer, canonical reports -1.
state=compare(['floor','door'],1,1,-1,false);
assert.equal(state.atExit,false,
  'Final Exit must remain non-terminal when no real exit exists');

console.log(JSON.stringify({
  scenario:'Phase 7 Final Exit real-exit resolver divergence characterization',
  runtime:{bytes:bytes.length,gitBlob},
  finalExitResolver:'historical local direct-index-first resolver',
  canonicalResolver:'GensDungeonV1.movement.resolveAuthoredRealExitIndex',
  parityCases:[
    'valid direct integer',
    'valid numeric string',
    'case-insensitive EXIT',
    'negative direct fallback',
    'non-integer direct fallback',
    'missing direct fallback'
  ],
  divergenceCases:[
    'direct integer points to non-exit while another exit exists',
    'direct integer is out of range while another exit exists',
    'direct integer points to non-exit and no real exit exists'
  ],
  migrationDecision:'not safe as parity-only refactor'
},null,2));
