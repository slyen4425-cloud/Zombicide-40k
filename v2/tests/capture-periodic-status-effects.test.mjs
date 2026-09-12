import assert from 'node:assert/strict';
import {createCaptureBattleState} from '../src/modes/capture/dynamic-combat.js';
import {tickCaptureBattleStatuses} from '../src/modes/capture/status-tick.js';
import {tickCaptureModeStatuses} from '../src/modes/capture/status-runtime.js';

function battleWith(team,opponent){
  return createCaptureBattleState({
    encounter:{type:'wild',speciesId:opponent.speciesId},
    activeTeam:team,
    opponent,
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
}

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,statuses:[{id:'burn',remainingDuration:2,stacks:2,effects:[{type:'damage',amount:3}]}]}];
  const battle=battleWith(team,{instanceId:'w1',speciesId:'capture_aquafin',currentHp:20,maxHp:20,wild:true,statuses:[{id:'regen',remainingDuration:2,stacks:1,effects:[{type:'heal',amount:4}]}]});
  battle.opponent.vitals.currentHp=10;
  const ticked=tickCaptureBattleStatuses(battle,{amount:1,activeTeam:team});
  assert.equal(ticked.ok,true);
  assert.equal(ticked.applied.player[0].amount,6);
  assert.equal(ticked.battle.player.vitals.currentHp,14);
  assert.equal(ticked.applied.opponent[0].amount,4);
  assert.equal(ticked.battle.opponent.vitals.currentHp,14);
  assert.equal(ticked.battle.player.statuses[0].remainingDuration,1);
  assert.equal(ticked.battle.opponent.statuses[0].remainingDuration,1);
}

{
  const team=[
    {instanceId:'p1',speciesId:'capture_braiseau',currentHp:5,maxHp:20,statuses:[{id:'poison',remainingDuration:2,stacks:1,effects:[{type:'damage',amount:10}]}]},
    {instanceId:'p2',speciesId:'capture_voltige',currentHp:15,maxHp:15,statuses:[]},
  ];
  const battle=battleWith(team,{instanceId:'w1',speciesId:'capture_aquafin',currentHp:20,maxHp:20,wild:true});
  const ticked=tickCaptureBattleStatuses(battle,{amount:1,activeTeam:team});
  assert.equal(ticked.ok,true);
  assert.equal(ticked.koOutcome,'forced_switch');
  assert.equal(ticked.activeTeam[0].currentHp,0);
  assert.equal(ticked.battle.player.activeInstanceId,'p2');
}

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,statuses:[]}];
  const battle=battleWith(team,{instanceId:'w1',speciesId:'capture_aquafin',currentHp:4,maxHp:20,wild:true,statuses:[{id:'burn',remainingDuration:1,stacks:1,effects:[{type:'damage',amount:5}]}]});
  const state={
    activeTeam:team,
    reserve:[],
    roster:[...team],
    battle,
    encounter:{type:'wild',speciesId:'capture_aquafin'},
    exploration:{freeMovement:false},
  };
  const ticked=tickCaptureModeStatuses(state,{amount:1});
  assert.equal(ticked.ok,true);
  assert.equal(ticked.ended,true);
  assert.equal(ticked.endReason,'opponent_ko');
  assert.equal(ticked.state.battle,null);
  assert.equal(ticked.state.encounter,null);
  assert.equal(ticked.state.exploration.freeMovement,true);
}

console.log('capture-periodic-status-effects.test.mjs: ok');
