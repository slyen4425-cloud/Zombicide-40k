import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  advanceCaptureBattleSession,
  beginCaptureBattleSession,
  CAPTURE_APP_LIFECYCLE_CONTRACT,
  createCaptureAppSession,
  createCaptureModeState,
  finishCaptureBattleSession,
  setCaptureBattleBlocking,
} from '../src/modes/capture/runtime.js';

function buildSession(){
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20};
  let state=createCaptureModeState({activeTeam:[player],roster:[player]});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  return createCaptureAppSession({state});
}

assert.equal(CAPTURE_APP_LIFECYCLE_CONTRACT.startsDriverWithBattle,true);
assert.equal(CAPTURE_APP_LIFECYCLE_CONTRACT.pausesDriverForBlockingUi,true);
assert.equal(CAPTURE_APP_LIFECYCLE_CONTRACT.stopsDriverWhenBattleEnds,true);
assert.equal(CAPTURE_APP_LIFECYCLE_CONTRACT.fixedRealtimeCadence,false);

{
  let session=buildSession();
  assert.equal(session.driver.status,'stopped');
  const started=beginCaptureBattleSession(session,{
    opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  session=started.session;
  assert.equal(session.driver.status,'running');
  assert.ok(session.state.battle);
  assert.equal(session.blocking,false);

  const paused=setCaptureBattleBlocking(session,true);
  assert.equal(paused.ok,true);
  session=paused.session;
  assert.equal(session.driver.status,'paused');
  assert.equal(session.blocking,true);

  const blockedAdvance=advanceCaptureBattleSession(session,{delta:3,driverOptions:{schedulerOptions:{stepSize:1}}});
  assert.equal(blockedAdvance.ok,true);
  assert.equal(blockedAdvance.reason,'driver-paused');
  assert.equal(blockedAdvance.processedSteps,0);
  assert.equal(blockedAdvance.session.driver.status,'paused');
  assert.equal(blockedAdvance.session.state.battle.timing.reactionTime,undefined);
  session=blockedAdvance.session;

  const resumed=setCaptureBattleBlocking(session,false);
  assert.equal(resumed.ok,true);
  session=resumed.session;
  assert.equal(session.driver.status,'running');
  assert.equal(session.blocking,false);

  const advanced=advanceCaptureBattleSession(session,{delta:1,driverOptions:{schedulerOptions:{stepSize:1}}});
  assert.equal(advanced.ok,true);
  assert.equal(advanced.processedSteps,1);
  assert.equal(advanced.session.state.battle.timing.reactionTime,1);
  assert.equal(advanced.session.driver.status,'running');
  session=advanced.session;

  const finished=finishCaptureBattleSession(session,'flee');
  assert.equal(finished.ok,true);
  assert.equal(finished.session.state.battle,null);
  assert.equal(finished.session.driver.status,'stopped');
  assert.equal(finished.session.blocking,false);
  assert.equal(finished.session.state.exploration.freeMovement,true);
}

{
  let session=buildSession();
  const started=beginCaptureBattleSession(session,{
    opponent:{instanceId:'w2',speciesId:'capture_aquafin',wild:true,currentHp:2,maxHp:2},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  session=started.session;
  session.state.battle.opponent.statuses=[{
    id:'burn',name:'Burn',remainingDuration:2,duration:2,stacks:1,stackMode:'refresh',maxStacks:1,
    effects:[{type:'damage',amount:2}],source:'capture',
  }];
  const advanced=advanceCaptureBattleSession(session,{delta:1,driverOptions:{schedulerOptions:{stepSize:1}}});
  assert.equal(advanced.ok,true);
  assert.equal(advanced.battleEnded,true);
  assert.equal(advanced.session.state.battle,null);
  assert.equal(advanced.session.driver.status,'stopped');
  assert.equal(advanced.session.blocking,false);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.equal(pageSource.includes('createCaptureAppSession'),true);
assert.equal(pageSource.includes('beginCaptureBattleSession'),true);
assert.equal(pageSource.includes('setCaptureBattleBlocking'),true);
assert.equal(pageSource.includes('advanceCaptureBattleSession'),true);
assert.equal(pageSource.includes('stopCaptureDriver'),true);
assert.equal(pageSource.includes('setInterval('),false);
assert.equal(pageSource.includes('requestAnimationFrame('),false);

console.log('capture-app-lifecycle.test.mjs: ok');
