import assert from 'node:assert/strict';
import {createCaptureBattleState} from '../src/modes/capture/dynamic-combat.js';
import {chooseCaptureAiAction,executeCaptureAiAction} from '../src/modes/capture/ai.js';

const encounter={type:'wild',speciesId:'capture_aquafin'};
const team=[{instanceId:'owned-1',speciesId:'capture_braiseau'}];
const opponent={instanceId:'wild-aqua',speciesId:'capture_aquafin',wild:true};
const abilities=[
  {id:'water_bolt',range:2,chargeMax:2,cooldown:1,effect:{type:'damage',amount:5}},
];

{
  const battle=createCaptureBattleState({encounter,activeTeam:team,opponent,playerPosition:{x:0,y:0,zoneId:'capture-battle'},opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
  const abilityState={water_bolt:{charges:2,chargeMax:2,cooldownRemaining:0,cost:null}};
  const decision=chooseCaptureAiAction({battle,abilityDefs:abilities,abilityState});
  assert.deepEqual(decision,{type:'ability',abilityId:'water_bolt'});
  const result=executeCaptureAiAction({
    battle,abilityDefs:abilities,abilityState,
    effectResolver:()=>({ok:true,outcome:{type:'damage',amount:5}}),
  });
  assert.equal(result.ok,true);
  assert.equal(result.decision.type,'ability');
  assert.equal(result.abilityState.water_bolt.charges,1);
  assert.equal(result.battle.actionLog.at(-1).side,'opponent');
}

{
  const battle=createCaptureBattleState({encounter,activeTeam:team,opponent,playerPosition:{x:0,y:0,zoneId:'capture-battle'},opponentPosition:{x:4,y:0,zoneId:'capture-battle'}});
  const abilityState={water_bolt:{charges:2,chargeMax:2,cooldownRemaining:0,cost:null}};
  const decision=chooseCaptureAiAction({battle,abilityDefs:abilities,abilityState});
  assert.equal(decision.type,'move_toward_target');
  assert.equal(decision.distance,4);
  const result=executeCaptureAiAction({battle,abilityDefs:abilities,abilityState});
  assert.equal(result.ok,true);
  assert.equal(result.decision.type,'move_toward_target');
  assert.equal(result.decision.target.x,3);
}

{
  const battle=createCaptureBattleState({encounter,activeTeam:team,opponent,playerPosition:{x:0,y:0,zoneId:'capture-battle'},opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
  const abilityState={water_bolt:{charges:0,chargeMax:2,cooldownRemaining:0,cost:null}};
  const decision=chooseCaptureAiAction({battle,abilityDefs:abilities,abilityState});
  assert.equal(decision.type,'move_toward_target');
}

console.log('capture-dynamic-ai.test.mjs: ok');
