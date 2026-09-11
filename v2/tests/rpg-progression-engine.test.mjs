import assert from 'node:assert/strict';
import {createProgressionConfig,createProgressionState,xpRequiredForLevel,levelForXp,grantXp,spendSkillPoints,spendStatPoints,progressionSnapshot} from '../src/modes/rpg/progression-engine.js';

const config=createProgressionConfig({
  curve:{kind:'linear',baseXp:10,stepXp:0},skillPointsPerLevel:1,statPointsPerLevel:2,
  levelUpEventId:'event-level-up',healOnLevelUp:true,healResourceId:'hp'
});
assert.equal(xpRequiredForLevel(2,config),10);
assert.equal(xpRequiredForLevel(4,config),30);
assert.equal(levelForXp(29,config),3);
assert.equal(levelForXp(30,config),4);

let state=createProgressionState();
let out=grantXp(state,25,config,{source:'boss'}); assert.equal(out.ok,true); state=out.state;
assert.equal(state.level,3); assert.equal(state.xp,25); assert.equal(state.skillPoints,2); assert.equal(state.statPoints,4);
assert.equal(out.levelsGained,2); assert.equal(out.levelUps.length,2);
assert.equal(out.levelUps[0].eventId,'event-level-up'); assert.equal(out.levelUps[0].heal.resourceId,'hp');

out=spendSkillPoints(state,1); assert.equal(out.ok,true); state=out.state; assert.equal(state.skillPoints,1);
out=spendStatPoints(state,3); assert.equal(out.ok,true); state=out.state; assert.equal(state.statPoints,1);
assert.equal(spendStatPoints(state,2).reason,'not-enough-stat-points');

const snap=progressionSnapshot(state,config); assert.equal(snap.level,3); assert.equal(snap.nextRequired,30);

const tableConfig=createProgressionConfig({curve:{kind:'table',thresholds:[5,15,40]},skillPointsPerLevel:0,statPointsPerLevel:1,maxLevel:4});
assert.equal(levelForXp(14,tableConfig),2); assert.equal(levelForXp(99,tableConfig),4);
let tableState=createProgressionState();
out=grantXp(tableState,99,tableConfig); assert.equal(out.ok,true); assert.equal(out.state.level,4); assert.equal(out.state.statPoints,3);
assert.equal(progressionSnapshot(out.state,tableConfig).nextRequired,null);

console.log('rpg progression engine ok');
