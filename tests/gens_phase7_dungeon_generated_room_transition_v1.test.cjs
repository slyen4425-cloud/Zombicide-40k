'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const index=read('index.html');
const roomRuntime=read('assets/dungeon/dungeon-room-runtime-167822.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.buildGeneratedRoomTransition,'function',
  'Phase 7 micro-lot 3 requires Dungeon-owned generated room transition descriptors');

const build=sandbox.GensDungeonV1.exploration.buildGeneratedRoomTransition;
const plain=v=>JSON.parse(JSON.stringify(v));
assert.deepEqual(plain(build('aldren',1,2,false,1234)),{
  heroId:'aldren',from:1,to:2,created:false,at:1234
},'existing-room transition descriptor must preserve created:false');
assert.deepEqual(plain(build('lyra',2,3,true,5678)),{
  heroId:'lyra',from:2,to:3,created:true,at:5678
},'new-room transition descriptor must preserve created:true');

assert.doesNotMatch(entry,/Date\.now\(|Math\.random\(|document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon transition descriptor must remain pure with explicit inputs');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'Dungeon transition descriptor must not consume another module runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
const core200=block('dungeonCore200Rebuild');
assert.equal((core200.match(/GensDungeonV1\.exploration\.buildGeneratedRoomTransition\(/g)||[]).length,2,
  'Core 2.00 must delegate both existing and create transition descriptors to Dungeon entry');
assert.match(core200,/x\.dc313LastTransition=GensDungeonV1\.exploration\.buildGeneratedRoomTransition\(heroId,targetRoom-1,targetRoom,false,Date\.now\(\)\)/,
  'existing-room path must delegate created:false with Date.now remaining at the callsite');
assert.match(core200,/x\.dc313LastTransition=GensDungeonV1\.exploration\.buildGeneratedRoomTransition\(heroId,targetRoom-1,targetRoom,true,Date\.now\(\)\)/,
  'new-room path must delegate created:true with Date.now remaining at the callsite');
assert.doesNotMatch(core200,/x\.dc313LastTransition=\{heroId,from:targetRoom-1,to:targetRoom,created:(?:false|true),at:Date\.now\(\)\}/,
  'Core 2.00 must retire both inline generated transition descriptor constructions');

assert.match(roomRuntime,/created===true/,
  'RoomRuntime must continue consuming the created marker');
assert.doesNotMatch(authored,/buildGeneratedRoomTransition/,
  'Authored World Builder must remain outside generated transition descriptors');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated room transition descriptor owner',
  owner:'GensDungeonV1.exploration.buildGeneratedRoomTransition',
  consumers:2,
  createdStates:[false,true],
  timestamp:'explicit callsite input',
  spatial:'unchanged',
  authored:'unchanged'
},null,2));
