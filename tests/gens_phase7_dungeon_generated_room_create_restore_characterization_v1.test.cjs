'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169856,'Phase 7 room create/restore characterization must track the generated Boss policy runtime');
assert.equal(gitBlob,'454b2e12cde591c2db19023d1b76055ebac8e1b1','Phase 7 room create/restore characterization must track the exact generated Boss policy blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
function ordered(source,parts,label){
  let at=-1;
  for(const part of parts){
    const i=source.indexOf(part,at+1);
    assert.ok(i>at,label+' missing/out-of-order: '+part);
    at=i;
  }
}

const core200=block('dungeonCore200Rebuild');
const spatial313=block('dungeonCore313SpatialModel');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const roomRuntime=read('assets/dungeon/dungeon-room-runtime-167822.js');
const roomRuntimeTest=read('tests/dungeon_room_runtime_v167822.test.cjs');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

assert.match(entry,/planGeneratedAdvance/,'prior generated advance planner must remain present');
assert.match(entry,/pickWeightedGeneratedRoomKind/,'prior room-kind weighting owner must remain present');

const exploreMatch=core200.match(/function explore\(\)\{[\s\S]*?\}\s*function moveTo\(/);
assert.ok(exploreMatch,'Core 2.00 explore body must remain extractable');
const explore=exploreMatch[0].replace(/\}\s*function moveTo\([\s\S]*$/,'}');

assert.equal((explore.match(/GensDungeonV1\.exploration\.planGeneratedAdvance\(/g)||[]).length,1,
  'generated explore must consume the Dungeon advance planner exactly once');
ordered(explore,[
  'const advancePlan=GensDungeonV1.exploration.planGeneratedAdvance',
  "if(advancePlan.status==='complete')",
  'const targetRoom=advancePlan.targetRoom',
  'spatialPersist(x)',
  'const existing=x.roomStates?.[String(targetRoom)]',
  "if(advancePlan.status==='existing'&&existing?.last)",
  'x.room=targetRoom;x.enemyCells={};x.branch=null'
],'generated advance branch order');

const existingStart=explore.indexOf("if(advancePlan.status==='existing'&&existing?.last)");
const createStart=explore.indexOf('x.room=targetRoom;x.enemyCells={};x.branch=null');
assert.ok(existingStart>=0&&createStart>existingStart,'existing branch must precede create branch');
const existingBranch=explore.slice(existingStart,createStart);

ordered(existingBranch,[
  'spatialSetRoom(x,heroId,targetRoom)',
  'spatialActivate(x,heroId)',
  'const entry=spawnIndex(x.last?.map)',
  'x.remaining[heroId]=movementLeft',
  'GensDungeonV1.exploration.buildGeneratedRoomTransition(heroId,targetRoom-1,targetRoom,false,Date.now())',
  'saveRt(x);render()',
  "return modal('🚪 '+heroName(heroId)+' avance'"
],'existing-room restore path');
assert.doesNotMatch(existingBranch,/chooseKind\(|createRoom\(|placeSceneForRoom\(|maybeSpecialBranch\(|assignEnemyCells\(|initLock\(|maybeDoorChallenge\(/,
  'existing-room path must not regenerate room kind/content/spatial encounter setup');

const createBranch=explore.slice(createStart);
ordered(createBranch,[
  'x.room=targetRoom;x.enemyCells={};x.branch=null',
  'spatialSetRoom(x,heroId,targetRoom)',
  'const kind=chooseKind(x.room),made=createRoom(x.room,kind)',
  'x.last={kind,room:x.room',
  'const entry=spawnIndex(x.last?.map)',
  'x.remaining[heroId]=movementLeft',
  'GensDungeonV1.exploration.buildGeneratedRoomTransition(heroId,targetRoom-1,targetRoom,true,Date.now())',
  'saveRt(x);placeSceneForRoom(x,kind,made.result)',
  "if(kind==='rest')applyRest200(x)",
  'maybeSpecialBranch(x);assignEnemyCells(x);initLock(x);maybeDoorChallenge(x);saveRt(x);render();roomIntro(x,made.result)'
],'new-room creation path');
assert.equal((createBranch.match(/createRoom\(x\.room,kind\)/g)||[]).length,1,
  'new-room path must materialize the room exactly once');

assert.match(spatial313,/function persist313\(x\)[\s\S]*x\.roomStates\[roomKey313\(room\)\]=\{\s*last:clone313\(x\.last\),enemyCells:clone313\(x\.enemyCells\|\|\{\}\)\s*\}/,
  'DungeonSpatial313 persist must snapshot last + enemyCells for the current room');
assert.match(spatial313,/function activate313\(x,id\)[\s\S]*const room=roomOf313\(x,id\),saved=x\.roomStates\?\.\[roomKey313\(room\)\];[\s\S]*else if\(saved\)\{x\.last=clone313\(saved\.last\)\|\|null;x\.enemyCells=clone313\(saved\.enemyCells\|\|\{\}\)\}/,
  'DungeonSpatial313 activate must restore last + enemyCells from roomStates');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(spatial313,sandbox,{filename:'dungeonCore313SpatialModel.js'});
const spatial=sandbox.DungeonSpatial313;
assert.ok(spatial,'DungeonSpatial313 API must load in isolation');

const state={
  participants:['aldren','lyra'],index:0,room:1,
  last:{kind:'enemy',map:{cells:['entry','enemy','exit']}},
  enemyCells:{e1:1},positions:{aldren:0,lyra:0},remaining:{aldren:3,lyra:3},
  heroRooms:{aldren:1,lyra:1},roomStates:{},heroBranchStates:{},branch:null
};
spatial.persist(state);
assert.deepEqual(JSON.parse(JSON.stringify(state.roomStates['1'])),{
  last:{kind:'enemy',map:{cells:['entry','enemy','exit']}},enemyCells:{e1:1}
},'persist must capture the canonical generated-room snapshot');
state.roomStates['2']={last:{kind:'chest',map:{cells:['entry','chest','exit']}},enemyCells:{}};
spatial.setRoom(state,'aldren',2);
spatial.activate(state,'aldren');
assert.equal(state.room,2,'activate must switch to the hero saved room');
assert.equal(state.last.kind,'chest','activate must restore the saved room kind without regeneration');
assert.deepEqual(JSON.parse(JSON.stringify(state.enemyCells)),{},'activate must restore saved enemy assignments');
state.last.kind='mutated-after-restore';
assert.equal(state.roomStates['2'].last.kind,'chest','activate must clone snapshots rather than alias roomStates');

assert.match(roomRuntime,/function transitionWasCreated\(x\)\{[\s\S]*return !!t&&t\.created===true\}/,
  'custom-room runtime must key off created:true transitions');
assert.match(roomRuntime,/if\(!transitionWasCreated\(x\)&&!forceRoom\)return false/,
  'custom-room runtime must refuse ordinary existing-room joins');
assert.match(roomRuntimeTest,/existing room joins do not generate a new custom layout/,
  'permanent Room Runtime test must keep the existing-room non-regeneration proof');

assert.doesNotMatch(authored,/planGeneratedAdvance|pickWeightedGeneratedRoomKind|createRoom\(room,kind\)/,
  'Authored World Builder must remain outside generated create/restore flow');
assert.doesNotMatch(existingBranch,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'existing generated room restoration must not consume another module runtime');

console.log(JSON.stringify({
  scenario:'Phase 7 generated room create/restore characterization',
  runtime:{bytes:bytes.length,gitBlob},
  planner:'GensDungeonV1.exploration.planGeneratedAdvance',
  existing:{regenerates:false,restores:['last','enemyCells'],transitionCreated:false},
  create:{createRoomCalls:1,transitionCreated:true},
  spatialOwner:'DungeonSpatial313',
  customRoomOwner:'DungeonRoomRuntime167822 only on created:true',
  authored:'separate and unchanged'
},null,2));
