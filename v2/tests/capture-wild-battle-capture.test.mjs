import assert from 'node:assert/strict';
import {
  attemptCaptureInBattle,
  createCaptureModeState,
  startCaptureBattle,
} from '../src/modes/capture/capture.js';

const orbLibrary=[
  {id:'capture_orb_basic',legacyIds:['capture_orb_basic'],tier:1,captureCoefficient:1,coefficientStatus:'configured'},
];

function baseState(activeCount=1){
  const activeTeam=Array.from({length:activeCount},(_,i)=>({instanceId:`owned-${i+1}`,speciesId:'capture_braiseau',level:3}));
  let state=createCaptureModeState({
    activeTeam,
    roster:[...activeTeam],
    inventory:{counts:{capture_orb_basic:3}},
  });
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin',status:'spotted'}};
  const started=startCaptureBattle(state,{opponent:{instanceId:'wild-aqua',speciesId:'capture_aquafin',wild:true,level:4}});
  assert.equal(started.ok,true);
  return started.state;
}

{
  const state=baseState();
  const result=attemptCaptureInBattle(state,{
    orbId:'capture_orb_basic',speciesCaptureRate:50,currentHp:20,maxHp:100,
    orbLibrary,lowHpMultiplier:2,rng:()=>0.2,
  });
  assert.equal(result.ok,true);
  assert.equal(result.captured,true);
  assert.equal(result.destination,'active');
  assert.equal(result.state.inventory.counts.capture_orb_basic,2);
  assert.equal(result.state.activeTeam.length,2);
  assert.equal(result.state.activeTeam[1].speciesId,'capture_aquafin');
  assert.equal(result.state.activeTeam[1].level,4);
  assert.equal(result.state.reserve.length,0);
  assert.equal(result.state.battle,null);
  assert.equal(result.state.encounter,null);
  assert.equal(result.state.exploration.freeMovement,true);
}

{
  const state=baseState(6);
  const result=attemptCaptureInBattle(state,{
    orbId:'capture_orb_basic',speciesCaptureRate:100,currentHp:80,maxHp:100,
    orbLibrary,lowHpMultiplier:2,rng:()=>0,
  });
  assert.equal(result.ok,true);
  assert.equal(result.captured,true);
  assert.equal(result.destination,'reserve');
  assert.equal(result.state.activeTeam.length,6);
  assert.equal(result.state.reserve.length,1);
  assert.equal(result.state.reserve[0].speciesId,'capture_aquafin');
}

{
  const state=baseState();
  const result=attemptCaptureInBattle(state,{
    orbId:'capture_orb_basic',speciesCaptureRate:10,currentHp:80,maxHp:100,
    orbLibrary,lowHpMultiplier:2,rng:()=>0.9,
  });
  assert.equal(result.ok,true);
  assert.equal(result.captured,false);
  assert.equal(result.state.inventory.counts.capture_orb_basic,2);
  assert.notEqual(result.state.battle,null);
  assert.notEqual(result.state.encounter,null);
}

{
  const state=baseState();
  const pendingLibrary=[{id:'capture_orb_basic',legacyIds:['capture_orb_basic'],tier:1,captureCoefficient:null}];
  const result=attemptCaptureInBattle(state,{
    orbId:'capture_orb_basic',speciesCaptureRate:50,currentHp:80,maxHp:100,
    orbLibrary:pendingLibrary,lowHpMultiplier:2,rng:()=>0,
  });
  assert.equal(result.ok,false);
  assert.equal(result.reason,'pending_orb_coefficient');
  assert.equal(result.state.inventory.counts.capture_orb_basic,3);
}

console.log('capture-wild-battle-capture.test.mjs: ok');
