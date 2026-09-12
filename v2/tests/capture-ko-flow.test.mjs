import assert from 'node:assert/strict';
import {
  createCaptureBattleState,
  resolveCaptureKoState,
} from '../src/modes/capture/dynamic-combat.js';

function battleWith({team,playerId='a',playerHp=10,playerMax=10,opponentHp=10,opponentMax=10}={}){
  const normalized=team.map(entry=>({...entry}));
  const player=normalized.find(entry=>entry.instanceId===playerId);
  player.currentHp=playerHp;
  player.maxHp=playerMax;
  return createCaptureBattleState({
    encounter:{type:'wild',speciesId:'capture_aquafin'},
    activeTeam:normalized,
    playerActiveInstanceId:playerId,
    opponent:{instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:opponentHp,maxHp:opponentMax},
  });
}

{
  const team=[{instanceId:'a',speciesId:'capture_braiseau',currentHp:10,maxHp:10}];
  const battle=battleWith({team,opponentHp:0,opponentMax:10});
  const result=resolveCaptureKoState(battle,team);
  assert.equal(result.ok,true);
  assert.equal(result.outcome,'opponent_ko');
  assert.equal(result.battle.status,'ended');
  assert.equal(result.battle.endReason,'opponent_ko');
}

{
  const team=[
    {instanceId:'a',speciesId:'capture_braiseau',currentHp:10,maxHp:10},
    {instanceId:'b',speciesId:'capture_aquafin',currentHp:7,maxHp:12},
  ];
  const battle=battleWith({team,playerHp:0,playerMax:10});
  const result=resolveCaptureKoState(battle,team);
  assert.equal(result.ok,true);
  assert.equal(result.outcome,'forced_switch');
  assert.equal(result.previousInstanceId,'a');
  assert.equal(result.activeInstanceId,'b');
  assert.equal(result.battle.status,'active');
  assert.equal(result.battle.player.activeInstanceId,'b');
  assert.equal(result.battle.player.vitals.currentHp,7);
  assert.equal(result.activeTeam.find(entry=>entry.instanceId==='a').currentHp,0);
}

{
  const team=[
    {instanceId:'a',speciesId:'capture_braiseau',currentHp:10,maxHp:10},
    {instanceId:'b',speciesId:'capture_aquafin',currentHp:0,maxHp:12},
  ];
  const battle=battleWith({team,playerHp:0,playerMax:10});
  const result=resolveCaptureKoState(battle,team);
  assert.equal(result.ok,true);
  assert.equal(result.outcome,'player_team_unavailable');
  assert.equal(result.battle.status,'ended');
  assert.equal(result.battle.endReason,'player_team_unavailable');
}

{
  const team=Array.from({length:6},(_,i)=>({
    instanceId:String.fromCharCode(97+i),
    speciesId:'capture_braiseau',
    currentHp:i===0?10:5,
    maxHp:10,
  }));
  const battle=battleWith({team,playerId:'a',playerHp:0,playerMax:10});
  const result=resolveCaptureKoState(battle,team);
  assert.equal(result.ok,true);
  assert.equal(result.outcome,'forced_switch');
  assert.notEqual(result.battle.endReason,'player_team_unavailable');
  assert.equal(result.battle.status,'active');
}

console.log('capture-ko-flow.test.mjs: ok');
