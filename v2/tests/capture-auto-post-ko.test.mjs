import assert from 'node:assert/strict';
import {createCaptureBattleState,resolveCaptureAbilityAction} from '../src/modes/capture/dynamic-combat.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';

const damageAbility={id:'hit',chargeMax:3,cooldown:0,range:5,effect:{type:'damage',amount:20}};
const abilityState={hit:{charges:3,chargeMax:3,cooldownRemaining:0,cost:null}};

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:30,maxHp:30}];
  const battle=createCaptureBattleState({
    encounter:{type:'wild',speciesId:'capture_aquafin'},
    activeTeam:team,
    opponent:{instanceId:'wild1',speciesId:'capture_aquafin',currentHp:10,maxHp:10,wild:true},
  });
  const result=resolveCaptureAbilityAction({
    battle,abilityDef:damageAbility,abilityState,effectResolver:resolveCaptureVitalEffect,activeTeam:team,
  });
  assert.equal(result.ok,true);
  assert.equal(result.koOutcome,'opponent_ko');
  assert.equal(result.battle.status,'ended');
  assert.equal(result.battle.endReason,'opponent_ko');
}

{
  const team=[
    {instanceId:'p1',speciesId:'capture_braiseau',currentHp:10,maxHp:30},
    {instanceId:'p2',speciesId:'capture_aquafin',currentHp:25,maxHp:25},
  ];
  const battle=createCaptureBattleState({
    encounter:{type:'wild',speciesId:'capture_moussado'},
    activeTeam:team,
    playerActiveInstanceId:'p1',
    opponent:{instanceId:'wild2',speciesId:'capture_moussado',currentHp:30,maxHp:30,wild:true},
  });
  const result=resolveCaptureAbilityAction({
    battle,side:'opponent',targetSide:'player',abilityDef:damageAbility,abilityState,effectResolver:resolveCaptureVitalEffect,activeTeam:team,
  });
  assert.equal(result.ok,true);
  assert.equal(result.koOutcome,'forced_switch');
  assert.equal(result.battle.status,'active');
  assert.equal(result.battle.player.activeInstanceId,'p2');
  assert.equal(result.activeTeam.find(x=>x.instanceId==='p1').currentHp,0);
}

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:10,maxHp:30}];
  const battle=createCaptureBattleState({
    encounter:{type:'wild',speciesId:'capture_moussado'},
    activeTeam:team,
    opponent:{instanceId:'wild3',speciesId:'capture_moussado',currentHp:30,maxHp:30,wild:true},
  });
  const result=resolveCaptureAbilityAction({
    battle,side:'opponent',targetSide:'player',abilityDef:damageAbility,abilityState,effectResolver:resolveCaptureVitalEffect,activeTeam:team,
  });
  assert.equal(result.ok,true);
  assert.equal(result.koOutcome,'player_team_unavailable');
  assert.equal(result.battle.status,'ended');
  assert.equal(result.battle.endReason,'player_team_unavailable');
}

console.log('capture-auto-post-ko.test.mjs: ok');
