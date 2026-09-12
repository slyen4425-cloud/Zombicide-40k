import assert from 'node:assert/strict';
import {createCaptureBattleState,resolveCaptureAbilityAction} from '../src/modes/capture/dynamic-combat.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';

const activeTeam=[{instanceId:'owned-1',speciesId:'capture_braiseau',currentHp:30,maxHp:30,abilityIds:['hit','heal']}];
const opponent={instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20};
let battle=createCaptureBattleState({encounter:{type:'wild',speciesId:'capture_aquafin'},activeTeam,opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
assert.deepEqual(battle.player.vitals,{currentHp:30,maxHp:30,ko:false});
assert.deepEqual(battle.opponent.vitals,{currentHp:20,maxHp:20,ko:false});

const defs=[
  {id:'hit',range:1,chargeMax:3,cooldown:0,effect:{type:'damage',amount:7}},
  {id:'heal',range:0,chargeMax:2,cooldown:0,effect:{type:'heal',amount:5}},
];
let playerAbilityState=initializeCreatureAbilityState(activeTeam[0],defs);

let result=resolveCaptureAbilityAction({battle,side:'player',targetSide:'opponent',abilityDef:defs[0],abilityState:playerAbilityState,effectResolver:resolveCaptureVitalEffect});
assert.equal(result.ok,true);
assert.equal(result.battle.opponent.vitals.currentHp,13);
assert.equal(result.action.outcome.type,'damage');
assert.equal(result.action.outcome.amount,7);
playerAbilityState=result.abilityState;
battle=result.battle;

result=resolveCaptureAbilityAction({battle,side:'player',targetSide:'opponent',abilityDef:{...defs[0],effect:{type:'damage',amount:99}},abilityState:playerAbilityState,effectResolver:resolveCaptureVitalEffect});
assert.equal(result.ok,true);
assert.equal(result.battle.opponent.vitals.currentHp,0);
assert.equal(result.battle.opponent.vitals.ko,true);
battle=result.battle;

const opponentState={hit:{charges:1,chargeMax:1,cooldownRemaining:0,cost:null}};
const blocked=resolveCaptureAbilityAction({battle,side:'opponent',targetSide:'player',abilityDef:defs[0],abilityState:opponentState,effectResolver:resolveCaptureVitalEffect});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'capture-actor-ko');
assert.equal(blocked.abilityState.hit.charges,1);

let healBattle=createCaptureBattleState({encounter:{type:'wild',speciesId:'capture_aquafin'},activeTeam:[{...activeTeam[0],currentHp:10}],opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
const healState=initializeCreatureAbilityState(activeTeam[0],defs);
const healResult=resolveCaptureAbilityAction({healBattle,battle:healBattle,side:'player',targetSide:'player',abilityDef:defs[1],abilityState:healState,effectResolver:resolveCaptureVitalEffect});
assert.equal(healResult.ok,true);
assert.equal(healResult.battle.player.vitals.currentHp,15);

console.log('capture-vitals.test.mjs: ok');
