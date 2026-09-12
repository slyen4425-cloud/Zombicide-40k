import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createCaptureModeState,
  startCaptureBattle,
  switchCaptureBattleCreature,
} from '../src/modes/capture/runtime.js';

function startedState(){
  const team=[
    {instanceId:'p1',speciesId:'capture_braiseau',currentHp:12,maxHp:20},
    {instanceId:'p2',speciesId:'capture_voltige',currentHp:15,maxHp:15},
    {instanceId:'p3',speciesId:'capture_aquafin',currentHp:0,maxHp:18},
  ];
  let state=createCaptureModeState({activeTeam:team,roster:structuredClone(team)});
  state={...state,encounter:{type:'wild',speciesId:'capture_moussado',status:'spotted'}};
  const started=startCaptureBattle(state,{
    opponent:{instanceId:'wild-1',speciesId:'capture_moussado',wild:true,currentHp:20,maxHp:20},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  return started.state;
}

{
  const state=startedState();
  assert.equal(state.battle.player.activeInstanceId,'p1');
  const before=structuredClone(state);
  const result=switchCaptureBattleCreature(state,'p2');
  assert.equal(result.ok,true);
  assert.equal(result.state.battle.player.activeInstanceId,'p2');
  assert.equal(result.state.battle.player.creature.instanceId,'p2');
  assert.equal(result.state.activeTeam.find(entry=>entry.instanceId==='p1').currentHp,12);
  assert.equal(result.state.activeTeam.find(entry=>entry.instanceId==='p2').currentHp,15);
  assert.equal(result.state.roster.find(entry=>entry.instanceId==='p1').currentHp,12);
  assert.equal(result.state.roster.find(entry=>entry.instanceId==='p2').currentHp,15);
  assert.equal(state.battle.player.activeInstanceId,before.battle.player.activeInstanceId);
  assert.equal(state.battle.player.activeInstanceId,'p1');
}

{
  const state=startedState();
  const result=switchCaptureBattleCreature(state,'p3');
  assert.equal(result.ok,false);
  assert.equal(result.reason,'capture-battle-switch-creature-ko');
  assert.equal(result.state.battle.player.activeInstanceId,'p1');
}

{
  const state=startedState();
  const result=switchCaptureBattleCreature(state,'missing');
  assert.equal(result.ok,false);
  assert.equal(result.reason,'capture-battle-switch-creature-missing');
  assert.equal(result.state.battle.player.activeInstanceId,'p1');
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/switchCaptureBattleCreature,/);
assert.match(pageSource,/switchCaptureBattleCreature\(session\.state,instanceId\)/);
assert.match(pageSource,/data-capture-switch-instance/);
assert.match(pageSource,/>Changer<\/button>/);
assert.match(pageSource,/battleActive&&entry\.location==='active'&&!entry\.activeInBattle&&!entry\.ko/);
assert.match(pageSource,/switchActiveCreature\(instanceId\)/);
assert.match(pageSource,/session=\{\.\.\.session,state:result\.state\}/);
assert.match(pageSource,/activeList\.addEventListener\('click',handleRosterSwitchClick\)/);
assert.match(pageSource,/activeList\.removeEventListener\('click',handleRosterSwitchClick\)/);
assert.equal(pageSource.includes("reserveList.addEventListener('click',handleRosterSwitchClick)"),false);
assert.equal(pageSource.includes('switchCaptureActiveCreature('),false);
assert.equal(pageSource.includes('moveCaptureRosterCreature('),false);
assert.equal(pageSource.includes('setCaptureTeam('),false);
assert.equal(pageSource.includes('useCaptureBattleAbility('),false);
assert.equal(pageSource.includes('attemptCaptureInBattle('),false);

console.log('capture-ui-switch-active.test.mjs: ok');
