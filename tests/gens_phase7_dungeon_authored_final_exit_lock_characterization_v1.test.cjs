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

assert.equal(bytes.length,8169447,
  'Phase 7 Final Exit lock characterization must track the exit-lock GREEN runtime');
assert.equal(gitBlob,'106d2ec6e82f3b777e1d724cd3f74f30a22fdf39',
  'Phase 7 Final Exit lock characterization must keep the exact exit-lock GREEN blob');

assert.match(
  finalExit,
  /function blocked\(x\)\{try\{if\(R\.dungeonRoomExitLocked102\?\.\(\)\)return true\}catch\(e\)\{\}return R\.GensDungeonV1\.movement\.isAuthoredExitBlocked\(x\?\.last\?\.exitLocked,x\?\.last\?\.map\?\.objective\?\.status,x\?\.last\?\.objective\?\.status\)\}/,
  'post-raccord Final Exit must retain the dynamic guard locally and delegate only the authored fallback decision'
);
assert.equal(
  (finalExit.match(/GensDungeonV1\.movement\.isAuthoredExitBlocked\(/g)||[]).length,
  1,
  'post-raccord Final Exit must consume the canonical authored lock helper exactly once'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};

const button={textContent:'NORMAL',disabled:false,onclick:null,dataset:{}};
const document={
  readyState:'complete',
  getElementById(id){return id==='dc01Explore'?button:null},
  addEventListener(){},
  body:{style:{removeProperty(){}}},
  documentElement:{style:{removeProperty(){}}}
};

let dynamicMode='false';
function dynamicLock(){
  if(dynamicMode==='throw')throw new Error('dynamic lock probe');
  return dynamicMode==='true';
}

const graph={id:'world-lock'};
const authored={
  active(){return true},
  graph(){return graph},
  plan(){return {currentNodeId:'last',outgoing:[],targetNodeId:'',needsExit:false}},
  positional(){return true}
};
const core={
  render(){return true},
  show(){return true},
  modal(){return true}
};

const context={
  console,Math,Date,JSON,
  localStorage,document,
  setTimeout(){return 1},
  DungeonAuthoredRuntime167839:authored,
  DungeonCore01:core,
  dungeonRoomExitLocked102:dynamicLock
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(finalExit,context,{filename:'assets/dungeon/dungeon-authored-final-exit-167875.js'});

assert.equal(
  typeof context.GensDungeonV1?.movement?.isAuthoredExitBlocked,
  'function',
  'the canonical authored exit-lock helper must already exist before Final Exit delegation'
);

const pureBlocked=context.GensDungeonV1.movement.isAuthoredExitBlocked;
assert.equal(pureBlocked(true,'open','open'),true);
assert.equal(pureBlocked(false,'locked','open'),true);
assert.equal(pureBlocked(false,'','locked'),true);
assert.equal(pureBlocked(false,'open','locked'),false);
assert.equal(pureBlocked(false,'LOCKED',''),false);
assert.equal(pureBlocked(false,'open','open'),false);

const api=context.DungeonAuthoredFinalExit167875;
assert.ok(api,'Final Exit runtime API must load');

function save({
  lastExitLocked=false,
  mapStatus='open',
  objectiveStatus='open'
}={}){
  localStorage.setItem(RT,JSON.stringify({
    participants:['hero'],
    index:0,
    room:3,
    positions:{hero:2},
    last:{
      authoredRuntime167839:true,
      worldDungeonId:'world-lock',
      worldNodeId:'last',
      exitLocked:lastExitLocked,
      map:{
        cells:['floor','floor','exit'],
        exitIdx:2,
        objective:{status:mapStatus}
      },
      objective:{status:objectiveStatus}
    },
    branch:null
  }));
}

function buttonState(options={},mode='false'){
  dynamicMode=mode;
  save(options);
  button.textContent='NORMAL';
  button.disabled=false;
  api.syncButton();
  return button.textContent;
}

assert.match(buttonState({},'true'),/SORTIE VERROUILLÉE/,
  'Final Exit dynamic guard must short-circuit authored state');

assert.match(buttonState({},'throw'),/TERMINER LE DONJON/,
  'Final Exit dynamic guard exception must fall through to authored state');

assert.match(buttonState({lastExitLocked:true}),/SORTIE VERROUILLÉE/,
  'Final Exit last.exitLocked truthy must lock');

assert.match(buttonState({mapStatus:'locked',objectiveStatus:'open'}),/SORTIE VERROUILLÉE/,
  'Final Exit map objective locked status must lock');

assert.match(buttonState({mapStatus:'',objectiveStatus:'locked'}),/SORTIE VERROUILLÉE/,
  'Final Exit fallback objective must lock when map status is falsy');

assert.match(buttonState({mapStatus:'open',objectiveStatus:'locked'}),/TERMINER LE DONJON/,
  'Final Exit truthy map status must keep priority over fallback objective');

assert.match(buttonState({mapStatus:'LOCKED',objectiveStatus:''}),/TERMINER LE DONJON/,
  'Final Exit lock comparison must remain case-sensitive');

assert.match(buttonState({lastExitLocked:false,mapStatus:'open',objectiveStatus:'open'}),/TERMINER LE DONJON/,
  'Final Exit open authored state must remain finishable');

assert.doesNotMatch(
  entry,
  /dungeonRoomExitLocked102|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon public entry must remain pure while Final Exit is characterized'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored Final Exit lock post-raccord characterization',
  runtime:{bytes:bytes.length,gitBlob},
  canonicalOwner:'GensDungeonV1.movement.isAuthoredExitBlocked',
  currentFinalExitState:'canonical helper consumed after local dynamic guard',
  semantics:{
    dynamicGuardFirst:true,
    dynamicGuardExceptionFallsThrough:true,
    lastExitLocked:true,
    mapObjectivePriority:true,
    fallbackObjectiveWhenMapFalsy:true,
    caseSensitiveLockedStatus:true
  }
},null,2));
