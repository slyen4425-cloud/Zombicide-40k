import assert from 'node:assert/strict';
import {
  CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT,
  createCaptureModeState,
  executeCapturePlayerCaptureAttempt,
  startCaptureBattle,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT.usesAuthoritativeCaptureAttempt,true);
assert.equal(CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT.neverInventsCaptureValues,true);
assert.equal(CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT.neverUsesRpgRuntime,true);

const orbLibrary=[{id:'capture_orb_basic',legacyIds:['capture_orb_basic'],captureCoefficient:1}];
const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20};
function battleState(opponentHp=8){
  let state=createCaptureModeState({
    activeTeam:[player],
    roster:[player],
    inventory:{counts:{capture_orb_basic:2}},
  });
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(state,{
    opponent:{instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:opponentHp,maxHp:10,level:3},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  return started.state;
}

{
  const state=battleState(8);
  const before=structuredClone(state);
  const missing=executeCapturePlayerCaptureAttempt(state,{
    orbId:'capture_orb_basic',speciesCaptureRates:{},orbLibrary,lowHpMultiplier:2,rng:()=>0,
  });
  assert.equal(missing.ok,false);
  assert.equal(missing.reason,'missing_species_capture_rate');
  assert.equal(missing.state.inventory.counts.capture_orb_basic,2);
  assert.deepEqual(state,before);
}

{
  const state=battleState(2);
  const missingLowHp=executeCapturePlayerCaptureAttempt(state,{
    orbId:'capture_orb_basic',speciesCaptureRates:{capture_aquafin:50},orbLibrary,rng:()=>0,
  });
  assert.equal(missingLowHp.ok,false);
  assert.equal(missingLowHp.reason,'pending_low_hp_multiplier');
  assert.equal(missingLowHp.state.inventory.counts.capture_orb_basic,2);
}

{
  const state=battleState(8);
  const failed=executeCapturePlayerCaptureAttempt(state,{
    orbId:'capture_orb_basic',speciesCaptureRates:{capture_aquafin:20},orbLibrary,lowHpMultiplier:2,rng:()=>0.9,
  });
  assert.equal(failed.ok,true);
  assert.equal(failed.captured,false);
  assert.equal(failed.state.inventory.counts.capture_orb_basic,1);
  assert.ok(failed.state.battle);
  assert.equal(failed.state.encounter.speciesId,'capture_aquafin');
}

{
  const state=battleState(2);
  const success=executeCapturePlayerCaptureAttempt(state,{
    orbId:'capture_orb_basic',speciesCaptureRates:{capture_aquafin:50},orbLibrary,lowHpMultiplier:2,rng:()=>0,
  });
  assert.equal(success.ok,true);
  assert.equal(success.captured,true);
  assert.equal(success.state.inventory.counts.capture_orb_basic,1);
  assert.equal(success.state.battle,null);
  assert.equal(success.state.encounter,null);
  assert.equal(success.state.activeTeam.length,2);
  assert.equal(success.state.activeTeam[1].speciesId,'capture_aquafin');
  assert.equal(success.state.activeTeam[1].currentHp,2);
  assert.equal(success.state.activeTeam[1].maxHp,10);
}

console.log('capture-player-capture-action.test.mjs: ok');
