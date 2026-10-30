'use strict';
// TDD: a Capture World save may update team/healing economy but must never
// author Combat Lab timing, active slots, items, defense or victory rules.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js'),'utf8');
const begin=source.indexOf('function saveRpgTrainerPvpSettings(){');
const end=source.indexOf('function renderRpgGameplayUi(){',begin);
assert.ok(begin>=0&&end>begin,'real historical owner must be present');
const originalOwner=source.slice(begin,end);
function runSave({profile,controls}){
 let writes=0,alerts=[];
 const context={
  lockedRpgEditingProfile:()=>({profile,index:0,profiles:[profile]}),
  ensureRpgProfileData:()=>{},
  document:{getElementById:id=>controls[id]??null},
  saveGameProfiles:profiles=>{assert.equal(profiles[0],profile);writes++;},
  alert:message=>alerts.push(message)
 };
 vm.runInNewContext(originalOwner+';saveRpgTrainerPvpSettings();',context);
 return {writes,alerts};
}
test('World settings save never rewrites the legacy battle rules or a saved profile identity',()=>{
 const rules={recallCost:'energy',autoReplaceKo:false,itemsAllowed:false,
  allowBattleOverride:false,defendAllowed:false,initiativeMode:'fixed',
  victoryMode:'all_ko',itemSlots:3,itemsPerTurn:2,activeSlots:2,
  controller:'human',captureAllowed:false,saveBattle:false};
 const profile={id:'capture-owned-profile',rpgUniverse:{captureCombat:{...rules,teamSize:4,
  minBattleTeam:1,maxBattleTeam:5,healMode:'free',healCost:8},trainerCombat:{enabled:false},pvp:{enabled:false}}};
 const controls={
  rpgCaptureActiveSlots:{value:'3'},rpgCaptureRecallCost:{value:'turn'},
  rpgCaptureItemsAllowed:{checked:true},rpgCaptureDefendAllowed:{checked:true},
  rpgCaptureAutoReplaceKo:{checked:true},rpgCaptureAllowBattleOverride:{checked:true},
  rpgCaptureTeamSize:{value:'5'},rpgCaptureMinBattleTeam:{value:'2'},
  rpgCaptureMaxBattleTeam:{value:'6'},rpgCaptureHealMode:{value:'cost'},
  rpgCaptureHealCost:{value:'25'},rpgTrainerBattlesEnabled:{checked:true},
  rpgTrainerGoldReward:{value:'10'},rpgPvpEnabled:{checked:false}
 };
 const {writes}=runSave({profile,controls});
 assert.equal(writes,1,'existing profile owner performs exactly one save');
 assert.equal(profile.id,'capture-owned-profile');
 for(const [key,value] of Object.entries(rules))assert.equal(profile.rpgUniverse.captureCombat[key],value,
  'Lab-owned combat rule was overwritten: '+key);
 assert.equal(profile.rpgUniverse.captureCombat.teamSize,5);
 assert.equal(profile.rpgUniverse.captureCombat.minBattleTeam,2);
 assert.equal(profile.rpgUniverse.captureCombat.maxBattleTeam,6);
 assert.equal(profile.rpgUniverse.captureCombat.healMode,'cost');
 assert.equal(profile.rpgUniverse.captureCombat.healCost,25);
 assert.equal(profile.rpgUniverse.trainerCombat.goldReward,10);
});
test('World-owned team/healing settings work for a new profile without inventing combat rules',()=>{
 const profile={id:'new-profile',rpgUniverse:{captureCombat:{},trainerCombat:{},pvp:{}}};
 const {writes}=runSave({profile,controls:{rpgCaptureTeamSize:{value:'3'},
  rpgCaptureMinBattleTeam:{value:'1'},rpgCaptureMaxBattleTeam:{value:'3'},
  rpgCaptureHealMode:{value:'free'},rpgCaptureHealCost:{value:'0'}}});
 assert.equal(writes,1);
 assert.deepEqual(JSON.parse(JSON.stringify(profile.rpgUniverse.captureCombat)),{
  teamSize:3,minBattleTeam:1,maxBattleTeam:3,healMode:'free',healCost:0
 });
});
