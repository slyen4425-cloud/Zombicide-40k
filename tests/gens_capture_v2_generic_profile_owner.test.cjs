'use strict';
// Characterize the exact historical generic profile factory BEFORE retiring it.
// It is NOT a Capture game function. Survival and Dungeon both depend on its output.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const old=read('assets/gensrpg/capture/legacy-monolith-functions-v1.js');
const start=old.indexOf('function captureCurrentGameProfile(name,id,builtIn=false){');
assert.ok(start>0,'Historic profile factory must be available to characterize');
const original=old.slice(start);
const owner=read('assets/gensrpg/core/game-profile-builder-v1.js');
function context(){
 const now=1700000000000;
 const DateFixed=class extends Date{static now(){return now}};
 return {Date:DateFixed,ITEMS:[{id:'a'},{id:42}],ZOMBICIDE_BASE_PRESET_ID:'base-wave',
   activeWavePresetId:()=> 'chosen-wave',loadWavePresets:()=>[{id:'chosen-wave',reserve:{walker:3}}],
   gameProfileId:()=> 'generated',loadGameCustomization:()=>({turnOrder:true,weight:2}),
   loadDeckConfig:()=>({potion:5}),currentAllHeroIds:()=>['h1','h2'],
   loadZombieConfig:()=>({walker:1})};
}
test('Core game-profile builder is exactly equivalent to retired, incorrectly Capture-owned factory',()=>{
 for(const [name,id,builtIn] of [
  ['Dungeons','dungeon',true],['Survival','survival',false],
  ['',null,false],['Monster (historical save only)','capture-old',false]
 ]){
  const orig=context(),next=context();
  vm.runInNewContext(original,orig);vm.runInNewContext(owner,next);
  const before=orig.captureCurrentGameProfile(name,id,builtIn);
  const after=next.gensBuildGameProfileBaseV1(name,id,builtIn);
  assert.deepEqual(JSON.parse(JSON.stringify(after)),JSON.parse(JSON.stringify(before)));
 }
});
test('real app consumes Core one time; old Capture factory and scripts are physically absent',()=>{
 const index=read('index.html');
 assert.ok(index.includes('src="assets/gensrpg/core/game-profile-builder-v1.js"'));
 assert.ok(!index.includes('captureCurrentGameProfile('));
 assert.equal((index.match(/gensBuildGameProfileBaseV1\(/g)||[]).length,4);
 assert.match(owner,/^function gensBuildGameProfileBaseV1\(/m);
 assert.doesNotMatch(owner,/captureStartBattle|creatureTeam|captureWorldState/);
});
