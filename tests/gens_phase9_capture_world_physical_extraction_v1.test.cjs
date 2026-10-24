'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const moduleText=fs.readFileSync(path.join(root,'assets/gensrpg/capture/world-exploration-v1.js'),'utf8');
const {seedEraIndexBytes}=require('./helpers/gens_capture_world_extraction_snapshot_v1.cjs');
const orig=seedEraIndexBytes(root).toString('utf8');
const load='<script src="assets/gensrpg/capture/world-exploration-v1.js?v=1"></script>';
assert.equal(index.split(load).length-1,1,'one synchronous Capture World owner');
assert.ok(index.indexOf(load)>index.indexOf('assets/gensrpg/capture/hub-entry-v1.js?v=1'));
assert.ok(index.indexOf(load)<index.indexOf('<script>\n\nconst Z40K_GENERIC_SHEET_BG'));
for(const name of ['captureWorldState','saveCaptureWorldState','captureDefaultLocations','captureProfileLocations','captureTogglePlayMode','captureNextPlayerTurn','captureRenderTurnDay','renderCaptureWorldHub','captureExploreAt','captureGenerateEncounter','renderCaptureEncounterPage','captureTakeFoundMoney']){
  assert.equal((moduleText.match(new RegExp('(?:^|\\n)function '+name+'\\(','g'))||[]).length,1,'Capture owns '+name);
  assert.equal((index.match(new RegExp('(?:^|\\n)function '+name+'\\(','g'))||[]).length,0,'legacy body removed '+name);
}
assert.ok(moduleText.includes('gensrpg_capture_world_v1'),'existing world storage key retained');
assert.ok(moduleText.includes('...custom,...defaults.filter'),'custom creator locations still win');
assert.ok(moduleText.includes('ws.playMode==="turns"'),'custom turn mode retained');
assert.ok(moduleText.includes('renderCaptureCurrentEncounter()'),'encounter view retained');
assert.doesNotMatch(moduleText,/function captureAwardBattleXp\(/,'combat XP not moved');
assert.doesNotMatch(moduleText,/function captureTeamEntityRoster\(/,'team authority not moved');
// Test real relocated expressions against byte-identical original sections in VM.
const match=moduleText.match(/\/\/ BEGIN_CAPTURE_WORLD_SECTION_3\n([\s\S]*?)\/\/ END_CAPTURE_WORLD_SECTION_3/);
assert.ok(match);
const original=orig.slice(orig.indexOf('function captureParticipantIds(){'),orig.indexOf('function captureXpForDefeat('));
assert.equal(match[1],original,'turn/day source expressions byte-identical');
function run(source){
 const events=[],store={day:2,playMode:'turns',turnIndex:1};
 const context={
  normalizeGameParticipants:()=>['a','b'],
  CHARS:{a:{name:'A'},b:{name:'B'}},
  findCustomHero:()=>null,
  captureWorldState:()=>({...store}),
  saveCaptureWorldState:v=>{Object.assign(store,v);events.push(JSON.stringify(v));},
  renderCaptureWorldHub:()=>events.push('render'),
  document:{getElementById:()=>null},
  console
 };
 vm.createContext(context);vm.runInContext(source,context,{timeout:1000});
 vm.runInContext('captureNextPlayerTurn()',context);
 const first={...store};vm.runInContext('captureTogglePlayMode()',context);
 return {first,final:{...store},events};
}
const before=run(original),after=run(match[1]);
assert.equal(JSON.stringify(after),JSON.stringify(before),'turn/day gameplay parity, no changed rules');
assert.equal(after.first.day,3);
assert.equal(after.first.turnIndex,0);
assert.equal(after.final.playMode,'free');
console.log(JSON.stringify({scenario:'Phase9 real World/Exploration source externalization',sourceBytes:7975990,indexBytes:Buffer.byteLength(index),moduleBytes:Buffer.byteLength(moduleText),rollbackByteExact:true,turnDayParity:true,singleOwner:true}));
