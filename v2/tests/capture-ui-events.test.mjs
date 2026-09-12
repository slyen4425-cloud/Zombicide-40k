import assert from 'node:assert/strict';
import {
  advanceCaptureBattleSession,
  beginCaptureBattleSession,
  CAPTURE_UI_EVENT_CONTRACT,
  captureUiEventsFromCaptureAttempt,
  captureUiEventsFromResult,
  consumeCaptureUiEvents,
  createCaptureAppSession,
  createCaptureModeState,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_EVENT_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_EVENT_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_EVENT_CONTRACT.derivesFromAuthoritativeResults,true);
assert.equal(CAPTURE_UI_EVENT_CONTRACT.captureAttemptEvents,true);

{
  const result={
    ok:true,
    action:{targetSide:'opponent',outcome:{type:'reaction',reactionId:'dodge',negated:true}},
    reaction:{triggered:true,reaction:{id:'dodge',type:'dodge',negatesEffect:true},outcome:{success:true}},
  };
  assert.deepEqual(captureUiEventsFromResult(result),[{
    type:'reaction_triggered',side:'opponent',reactionId:'dodge',reactionType:'dodge',negated:true,outcome:{success:true},
  }]);
}

{
  const result={ok:true,action:{targetSide:'opponent',outcome:{type:'status',statusId:'burn',stacks:2}}};
  assert.deepEqual(captureUiEventsFromResult(result),[{
    type:'status_applied',side:'opponent',statusId:'burn',stacks:2,source:'ability',
  }]);
}

{
  const result={
    ok:true,
    statusTick:{playerApplied:[],opponentApplied:[{type:'damage',statusId:'burn',amount:3,stacks:1,ko:false}],playerExpired:[],opponentExpired:[{id:'burn'}]},
    koOutcome:'forced_switch',previousInstanceId:'p1',activeInstanceId:'p2',
  };
  assert.deepEqual(captureUiEventsFromResult(result),[
    {type:'status_periodic_effect',side:'opponent',effectType:'damage',statusId:'burn',amount:3,stacks:1,ko:false},
    {type:'status_expired',side:'opponent',statusId:'burn'},
    {type:'ko',side:'player',instanceId:'p1'},
    {type:'forced_switch',side:'player',previousInstanceId:'p1',activeInstanceId:'p2'},
  ]);
}

{
  assert.deepEqual(captureUiEventsFromCaptureAttempt({ok:false,reason:'pending_orb_coefficient',itemId:'capture_orb_basic'}),[
    {type:'capture_unavailable',reason:'pending_orb_coefficient',orbId:'capture_orb_basic'},
  ]);
  assert.deepEqual(captureUiEventsFromCaptureAttempt({ok:true,captured:false,attempt:{orbId:'capture_orb_plus',chancePercent:42,roll:77}}),[
    {type:'capture_failed',orbId:'capture_orb_plus',chancePercent:42,roll:77},
  ]);
  assert.deepEqual(captureUiEventsFromCaptureAttempt({ok:true,captured:true,destination:'reserve',creature:{speciesId:'capture_descendre'},attempt:{orbId:'capture_orb_ultra'}}),[
    {type:'capture_success',orbId:'capture_orb_ultra',destination:'reserve',speciesId:'capture_descendre'},
  ]);
}

{
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20};
  let state=createCaptureModeState({activeTeam:[player],roster:[player]});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  let session=createCaptureAppSession({state});
  const begun=beginCaptureBattleSession(session,{
    opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:3,maxHp:20},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(begun.ok,true);
  session=begun.session;
  session.state.battle.opponent.statuses=[{
    id:'burn',name:'Burn',remainingDuration:1,duration:1,stacks:1,stackMode:'refresh',maxStacks:1,
    effects:[{type:'damage',amount:3}],source:'capture',
  }];

  const advanced=advanceCaptureBattleSession(session,{delta:1,driverOptions:{schedulerOptions:{stepSize:1}}});
  assert.equal(advanced.ok,true);
  assert.equal(advanced.battleEnded,true);
  assert.equal(advanced.session.driver.status,'stopped');
  assert.deepEqual(advanced.uiEvents,[
    {type:'status_periodic_effect',side:'opponent',effectType:'damage',statusId:'burn',amount:3,stacks:1,ko:true},
    {type:'status_expired',side:'opponent',statusId:'burn'},
    {type:'ko',side:'opponent'},
  ]);
  assert.equal(advanced.session.uiEvents.length,3);

  const consumed=consumeCaptureUiEvents(advanced.session);
  assert.equal(consumed.events.length,3);
  assert.equal(consumed.session.uiEvents.length,0);
  assert.equal(consumed.session.state.battle,null);
}

console.log('capture-ui-events.test.mjs: ok');
