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

assert.equal(bytes.length,8169555,
  'Phase 7 authored exit-lock characterization must track the terminal-exit GREEN runtime');
assert.equal(gitBlob,'02a052bc231728eb383e17c83e61a958be0ac58c',
  'Phase 7 authored exit-lock characterization must track the exact terminal-exit GREEN blob');

assert.match(
  authored,
  /function blocked\(x\)\{try\{if\(ROOT\.dungeonRoomExitLocked102\?\.\(\)\)return true\}catch\(e\)\{\}return ROOT\.GensDungeonV1\.movement\.isAuthoredExitBlocked\(x\?\.last\?\.exitLocked,x\?\.last\?\.map\?\.objective\?\.status,x\?\.last\?\.objective\?\.status\)\}/,
  'post-raccord blocked policy must keep the dynamic guard local and delegate only the authored fallback decision'
);

const RT='gensrpg_dungeon_runtime_v2';
const PRIMARY='gensrpg_dungeon_primary_selection_v167833';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
store.set(PRIMARY,JSON.stringify({kind:'world',id:'world-lock'}));

const graph={
  id:'world-lock',
  startNodeId:'A',
  nodes:[{id:'A',roomId:'room-a',label:'Zone A'}],
  edges:[]
};
const room={
  id:'room-a',name:'Zone A',width:2,height:1,roomType:'room',
  cells:[{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]
};
const button={textContent:'',disabled:false,onclick:null};
const document={
  readyState:'complete',
  getElementById(id){return id==='dc01Explore'?button:null},
  addEventListener(){}
};

let dynamicMode='false';
function dynamicLock(){
  if(dynamicMode==='throw')throw new Error('dynamic lock probe');
  return dynamicMode==='true';
}

const context={
  console,Math,Date,JSON,
  document,localStorage,
  setTimeout(){return 1},
  dungeonRoomExitLocked102:dynamicLock,
  dc305PositionalGameplay(){return true},
  gensGameplayModules(){return {movement:true}},
  DungeonWorldBuilder167821:{
    findDungeon(id){return id===graph.id?graph:null},
    validation(){return {valid:true,errors:[],warnings:[]}}
  },
  DungeonRoomCreator100:{
    findRoom(id){return id===room.id?room:null}
  },
  DungeonWorldRuntime167823:{saveConfig(){return true}},
  DungeonCore01:{
    explore(){return true},
    render(){return true},
    show(){return true},
    start(){return true},
    modal(){return true}
  }
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,context,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;
assert.ok(api,'authored runtime API must load');

function save({
  lastExitLocked=false,
  mapStatus='open',
  objectiveStatus='open'
}={}){
  const x={
    participants:['hero'],
    index:0,
    room:1,
    positions:{hero:0},
    remaining:{hero:0},
    branch:null,
    authored167839:{
      worldId:graph.id,
      heroNodes:{hero:'A'},
      nodeRooms:{A:1},
      roomNodes:{1:'A'},
      history:{hero:['A']}
    },
    last:{
      exitLocked:lastExitLocked,
      map:{
        cells:['floor','exit'],
        exitIdx:1,
        objective:{status:mapStatus}
      },
      objective:{status:objectiveStatus}
    }
  };
  localStorage.setItem(RT,JSON.stringify(x));
}

function renderState(options={},mode='false'){
  dynamicMode=mode;
  save(options);
  button.textContent='';
  api.syncActionButton();
  return button.textContent;
}

assert.match(renderState({},'true'),/SORTIE VERROUILLÉE/,
  'dynamic exit lock must short-circuit authored state');

assert.doesNotMatch(renderState({},'throw'),/SORTIE VERROUILLÉE/,
  'dynamic lock exception must be ignored before authored fallback state');

assert.match(renderState({lastExitLocked:true}),/SORTIE VERROUILLÉE/,
  'last.exitLocked truthy must lock the authored exit');

assert.match(renderState({mapStatus:'locked',objectiveStatus:'open'}),/SORTIE VERROUILLÉE/,
  'map objective locked status must lock the authored exit');

assert.match(renderState({mapStatus:'',objectiveStatus:'locked'}),/SORTIE VERROUILLÉE/,
  'fallback objective locked status must lock when map status is falsy');

assert.doesNotMatch(renderState({mapStatus:'open',objectiveStatus:'locked'}),/SORTIE VERROUILLÉE/,
  'truthy map status must keep precedence over fallback objective status');

assert.doesNotMatch(renderState({mapStatus:'LOCKED',objectiveStatus:''}),/SORTIE VERROUILLÉE/,
  'historical exit lock status comparison must remain case-sensitive');

assert.doesNotMatch(renderState({lastExitLocked:false,mapStatus:'open',objectiveStatus:'open'}),/SORTIE VERROUILLÉE/,
  'open authored state must remain unblocked');

const pureSandbox={};
pureSandbox.window=pureSandbox;
pureSandbox.globalThis=pureSandbox;
vm.createContext(pureSandbox);
vm.runInContext(entry,pureSandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pureSandbox.GensDungeonV1?.movement?.isAuthoredExitBlocked,
  'function',
  'post-raccord characterization requires the Dungeon-owned authored exit-lock helper'
);

const pureBlocked=pureSandbox.GensDungeonV1.movement.isAuthoredExitBlocked;
assert.equal(pureBlocked(true,'open','open'),true);
assert.equal(pureBlocked(false,'locked','open'),true);
assert.equal(pureBlocked(false,'','locked'),true);
assert.equal(pureBlocked(false,'open','locked'),false);
assert.equal(pureBlocked(false,'LOCKED',''),false);
assert.equal(pureBlocked(false,'open','open'),false);

assert.doesNotMatch(
  entry,
  /dungeonRoomExitLocked102|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon public entry must remain pure after exit-lock extraction'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored exit lock post-raccord characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.blocked consumer',
  semantics:{
    dynamicGuardFirst:true,
    dynamicGuardExceptionFallsThrough:true,
    lastExitLocked:true,
    mapObjectivePriority:true,
    fallbackObjectiveWhenMapFalsy:true,
    caseSensitiveLockedStatus:true
  },
  pureTarget:'GensDungeonV1.movement.isAuthoredExitBlocked'
},null,2));
