import assert from 'node:assert/strict';
import {createCaptureModeState,startCaptureBattle} from '../src/modes/capture/capture.js';
import {advanceCaptureModeTime} from '../src/modes/capture/time-runtime.js';

function buildState({opponentHp=20,statusAmount=2,statusDuration=3}={}){
  const player={
    instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,
    reactionState:{dodge:{resource:null,cooldownRemaining:3}},
  };
  let state=createCaptureModeState({activeTeam:[player],roster:[player]});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(state,{
    opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:opponentHp,maxHp:opponentHp,reactionState:{dodge:{resource:null,cooldownRemaining:2}}},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  started.state.battle.opponent.statuses=[{
    id:'burn',name:'Burn',remainingDuration:statusDuration,duration:statusDuration,stacks:1,stackMode:'refresh',maxStacks:1,
    effects:[{type:'damage',amount:statusAmount}],source:'capture',
  }];
  return started.state;
}

{
  const state=buildState();
  const result=advanceCaptureModeTime(state,{amount:1});
  assert.equal(result.ok,true);
  assert.equal(result.reactionTime,1);
  assert.equal(result.state.battle.player.reactionState.dodge.cooldownRemaining,2);
  assert.equal(result.state.battle.opponent.reactionState.dodge.cooldownRemaining,1);
  assert.equal(result.state.battle.opponent.vitals.currentHp,18);
  assert.equal(result.state.battle.opponent.statuses[0].remainingDuration,2);
  assert.equal(result.statusTick.opponentApplied[0].type,'damage');
  assert.equal(result.ended,false);
}

{
  const state=buildState({opponentHp:2,statusAmount:2,statusDuration:2});
  const result=advanceCaptureModeTime(state,{amount:1});
  assert.equal(result.ok,true);
  assert.equal(result.ended,true);
  assert.equal(result.endReason,'opponent_ko');
  assert.equal(result.koOutcome,'opponent_ko');
  assert.equal(result.state.battle,null);
  assert.equal(result.state.encounter,null);
  assert.equal(result.state.exploration.freeMovement,true);
}

{
  const state=buildState();
  const result=advanceCaptureModeTime(state,{amount:2,tickStatuses:false});
  assert.equal(result.ok,true);
  assert.equal(result.reactionTime,2);
  assert.equal(result.state.battle.opponent.vitals.currentHp,20);
  assert.equal(result.state.battle.opponent.statuses[0].remainingDuration,3);
  assert.equal(result.state.battle.player.reactionState.dodge.cooldownRemaining,1);
}

console.log('capture-unified-time-runtime.test.mjs: ok');
