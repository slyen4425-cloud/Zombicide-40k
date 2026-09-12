import assert from 'node:assert/strict';
import {
  addCaptureStatus,
  collectCaptureStatusEffects,
  removeCaptureStatus,
  resolveCaptureStatusEffect,
  tickCaptureStatuses,
} from '../src/modes/capture/statuses.js';
import {createCaptureBattleState,resolveCaptureAbilityAction} from '../src/modes/capture/dynamic-combat.js';

const poison={id:'poison',duration:3,stackMode:'stack',maxStacks:2,effects:[{type:'damage_over_time',amount:2}]};
let result=addCaptureStatus([],poison);
assert.equal(result.ok,true);
assert.equal(result.status.stacks,1);
assert.equal(result.status.remainingDuration,3);
result=addCaptureStatus(result.statuses,poison);
assert.equal(result.status.stacks,2);
result=addCaptureStatus(result.statuses,poison);
assert.equal(result.status.stacks,2);

const effects=collectCaptureStatusEffects(result.statuses);
assert.equal(effects.length,1);
assert.equal(effects[0].statusId,'poison');
assert.equal(effects[0].stacks,2);
assert.equal(effects[0].type,'damage_over_time');

let ticked=tickCaptureStatuses(result.statuses,1);
assert.equal(ticked.statuses[0].remainingDuration,2);
ticked=tickCaptureStatuses(ticked.statuses,2);
assert.equal(ticked.statuses.length,0);
assert.equal(ticked.expired[0].id,'poison');

const refreshed=addCaptureStatus([], {id:'slow',duration:2,stackMode:'refresh',effects:[{type:'movement_modifier',value:-1}]});
const refreshedAgain=addCaptureStatus(refreshed.statuses,{id:'slow',duration:5,stackMode:'refresh',effects:[{type:'movement_modifier',value:-1}]});
assert.equal(refreshedAgain.status.stacks,1);
assert.equal(refreshedAgain.status.remainingDuration,5);
const removed=removeCaptureStatus(refreshedAgain.statuses,'slow');
assert.equal(removed.ok,true);
assert.equal(removed.statuses.length,0);

const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['web']}];
const opponent={instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20};
const battle=createCaptureBattleState({encounter:{type:'wild',speciesId:'capture_aquafin'},activeTeam:team,opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
assert.deepEqual(battle.player.statuses,[]);
assert.deepEqual(battle.opponent.statuses,[]);
const ability={id:'web',range:1,chargeMax:2,cooldown:0,effect:{type:'status',status:{id:'slow',duration:2,stackMode:'refresh',effects:[{type:'movement_modifier',value:-1}]}}};
const abilityState={web:{charges:2,chargeMax:2,cooldownRemaining:0,cost:null}};
const action=resolveCaptureAbilityAction({battle,abilityDef:ability,abilityState,effectResolver:resolveCaptureStatusEffect,activeTeam:team});
assert.equal(action.ok,true);
assert.equal(action.battle.opponent.statuses.length,1);
assert.equal(action.battle.opponent.statuses[0].id,'slow');
assert.equal(action.action.outcome.type,'status');
assert.equal(action.battle.opponent.vitals.currentHp,20);

console.log('capture-statuses.test.mjs: ok');
